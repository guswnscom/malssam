import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileParserService {
  async parseFile(file: Express.Multer.File): Promise<string> {
    const ext = (file.originalname.toLowerCase().split('.').pop() || '').trim();
    const mime = file.mimetype || '';

    if (ext === 'txt' || mime.includes('text/plain')) {
      return file.buffer.toString('utf-8');
    }
    if (ext === 'pdf' || mime.includes('pdf')) {
      return this.parsePdf(file.buffer);
    }
    if (ext === 'docx' || mime.includes('wordprocessingml')) {
      return this.parseDocx(file.buffer);
    }

    throw new BadRequestException('PDF, Word(.docx), 텍스트(.txt) 파일만 지원됩니다.');
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // pdf-parse 모듈의 test 폴더 이슈 우회
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer);
      const text = (data.text || '').trim();
      if (text.length < 10) {
        throw new BadRequestException('PDF에서 텍스트를 추출할 수 없습니다. 텍스트를 직접 복사하여 붙여넣기 해주세요.');
      }
      return text;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('PDF 파일을 처리할 수 없습니다. 텍스트를 직접 복사하여 붙여넣기 해주세요.');
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || '').trim();
      if (text.length < 10) {
        throw new BadRequestException('Word 파일에서 텍스트를 추출할 수 없습니다.');
      }
      return text;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Word 파일을 처리할 수 없습니다.');
    }
  }
}
