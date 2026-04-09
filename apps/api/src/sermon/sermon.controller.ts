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

@Controller('sermons')
export class SermonController {
  constructor(
    private readonly sermonService: SermonService,
    private readonly fileParser: FileParserService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Request() req: any, @Body() dto: GenerateSermonDto) {
    try {
      return await this.sermonService.generate(req.user.sub, dto);
    } catch (error: any) {
      throw new HttpException(
        { statusCode: error.status || 500, message: error.message || '설교 생성에 실패했습니다' },
        error.status || 500,
      );
    }
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

  @Get(':id/pdf')
  async getPdf(@Request() req: any, @Param('id') id: string, @Query('token') token: string, @Res() res: Response) {
    let userId: string | null = req.user?.sub || null;
    if (!userId && token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || '') as any;
        userId = payload.sub;
      } catch { /* token invalid */ }
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
