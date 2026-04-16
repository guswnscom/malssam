import {
  Controller, Post, Get, Put, Delete,
  Body, Param, Query, Res, UseGuards, Request, HttpException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { SermonService } from './sermon.service';
import { FileParserService } from './file-parser.service';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { RegenerateSermonDto } from './dto/regenerate-sermon.dto';
import { AnalyzeSermonDto } from './dto/analyze-sermon.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// 인메모리 Rate Limiter (사용자별 분당 3회)
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(userId: string, maxPerMinute = 3): boolean {
  const now = Date.now();
  const key = userId;
  const timestamps = (rateLimitMap.get(key) || []).filter(t => now - t < 60000);
  if (timestamps.length >= maxPerMinute) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}
// 5분마다 오래된 항목 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter(t => now - t < 60000);
    if (valid.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, valid);
  }
}, 300000);

@Controller('sermons')
export class SermonController {
  constructor(
    private readonly sermonService: SermonService,
    private readonly fileParser: FileParserService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Request() req: any, @Body() dto: GenerateSermonDto) {
    if (!checkRateLimit(req.user.sub, 3)) {
      throw new HttpException({ statusCode: 429, message: '요청이 너무 빈번합니다. 1분 후 다시 시도해주세요.' }, 429);
    }
    try {
      return await this.sermonService.generate(req.user.sub, dto);
    } catch (error: any) {
      throw new HttpException(
        { statusCode: error.status || 500, message: error.message || '설교 생성에 실패했습니다' },
        error.status || 500,
      );
    }
  }

  @Get('generate/status/:requestId')
  @UseGuards(JwtAuthGuard)
  async getGenerationStatus(@Request() req: any, @Param('requestId') requestId: string) {
    return this.sermonService.getGenerationStatus(req.user.sub, requestId);
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyze(@Body() dto: AnalyzeSermonDto) {
    try {
      return await this.sermonService.analyzeSermon(dto.text);
    } catch (error: any) {
      throw new HttpException(
        { statusCode: 500, message: error.message || '분석에 실패했습니다' }, 500,
      );
    }
  }

  @Post('analyze/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async analyzeUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException({ statusCode: 400, message: '파일을 업로드해주세요' }, 400);
    try {
      const text = await this.fileParser.parseFile(file);
      return { text, filename: file.originalname, size: file.size };
    } catch (error: any) {
      throw new HttpException({ statusCode: 400, message: error.message || '파일 처리 실패' }, error.status || 400);
    }
  }

  @Post('analyze/improve')
  @UseGuards(JwtAuthGuard)
  async analyzeImprove(@Request() req: any, @Body() body: { originalText: string; suggestions: string[] }) {
    try {
      return await this.sermonService.improveSermon(body.originalText, body.suggestions);
    } catch (error: any) {
      throw new HttpException({ statusCode: 500, message: error.message || '개선에 실패했습니다' }, 500);
    }
  }

  @Post('save-improved')
  @UseGuards(JwtAuthGuard)
  async saveImproved(@Request() req: any, @Body() body: any) {
    return this.sermonService.saveImprovedSermon(req.user.sub, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Request() req: any, @Query('worshipType') worshipType?: string) {
    return this.sermonService.list(req.user.sub, worshipType);
  }

  @Get(':id/pdf-token')
  @UseGuards(JwtAuthGuard)
  getPdfToken(@Param('id') id: string) {
    const crypto = require('crypto');
    const secret = process.env.JWT_ACCESS_SECRET || '';
    const exp = Math.floor(Date.now() / 1000) + 300; // 5분 유효
    const sig = crypto.createHmac('sha256', secret).update(`${id}:${exp}`).digest('hex').substring(0, 16);
    return { sig, exp };
  }

  @Get(':id/pdf')
  async getPdf(@Request() req: any, @Param('id') id: string, @Query('sig') sig: string, @Query('exp') exp: string, @Res() res: Response) {
    let userId: string | null = req.user?.sub || null;
    // 서명 기반 임시 토큰 검증 (5분 유효)
    if (!userId && sig && exp) {
      const secret = process.env.JWT_ACCESS_SECRET || '';
      const now = Math.floor(Date.now() / 1000);
      if (parseInt(exp) > now) {
        const crypto = require('crypto');
        const expected = crypto.createHmac('sha256', secret).update(`${id}:${exp}`).digest('hex').substring(0, 16);
        if (sig === expected) {
          // 서명 유효 → 원본 요청자의 userId를 sig에서 복원할 수 없으므로, 공개 접근으로 처리
          userId = '__pdf_signed__';
        }
      }
    }
    if (!userId) {
      res.status(401).send('<h1>인증이 필요합니다. 로그인 후 다시 시도해주세요.</h1>');
      return;
    }
    const html = await this.sermonService.generatePdfHtml(userId, id);
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }

  @Get(':id/ppt')
  @UseGuards(JwtAuthGuard)
  async getPpt(@Request() req: any, @Param('id') id: string, @Res() res: Response) {
    const buffer = await this.sermonService.generatePptx(req.user.sub, id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="sermon-${id.substring(0, 8)}.pptx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Request() req: any, @Param('id') id: string) {
    return this.sermonService.getById(req.user.sub, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateSermonDto) {
    return this.sermonService.update(req.user.sub, id, dto);
  }

  @Post(':id/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerate(@Request() req: any, @Param('id') id: string, @Body() dto: RegenerateSermonDto) {
    if (!checkRateLimit(req.user.sub, 5)) {
      throw new HttpException({ statusCode: 429, message: '요청이 너무 빈번합니다. 1분 후 다시 시도해주세요.' }, 429);
    }
    try {
      return await this.sermonService.regenerate(req.user.sub, id, dto);
    } catch (error: any) {
      throw new HttpException(
        { statusCode: error.status || 500, message: error.message || '재생성에 실패했습니다' },
        error.status || 500,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.sermonService.remove(req.user.sub, id);
  }
}
