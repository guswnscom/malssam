import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  async parseFile(file: Express.Multer.File): Promise<string> {
    const ext = (file.originalname.toLowerCase().split('.').pop() || '').trim();
    const mime = file.mimetype || '';
    this.logger.log(`파일 파싱 시도: ${file.originalname} (${mime}, ${file.size} bytes)`);

    if (ext === 'txt' || mime.includes('text/plain')) {
      return file.buffer.toString('utf-8');
    }
    if (ext === 'pdf' || mime.includes('pdf')) {
      return this.parsePdf(file.buffer);
    }
    if (ext === 'docx' || mime.includes('wordprocessingml')) {
      return this.parseDocx(file.buffer);
    }
    // .doc 구버전 Word: mammoth가 지원 안함
    if (ext === 'doc' || mime === 'application/msword') {
      throw new BadRequestException(
        'Word 97-2003(.doc) 파일은 지원되지 않습니다. Word에서 "다른 이름으로 저장 → .docx 형식"으로 변환하여 업로드해주세요.',
      );
    }
    // 한글 파일
    if (ext === 'hwp' || ext === 'hwpx') {
      throw new BadRequestException(
        '한글 파일(.hwp)은 지원되지 않습니다. 한글에서 "파일 → 다른 이름으로 저장 → PDF" 로 변환하거나, 본문을 복사하여 아래 입력란에 붙여넣어 주세요.',
      );
    }

    throw new BadRequestException('지원 형식: TXT, PDF, Word(.docx) 파일만 가능합니다.');
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // pdf-parse 모듈의 test 폴더 이슈 우회
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer);
      const text = (data.text || '').trim();
      this.logger.log(`PDF 파싱 완료: ${text.length}자 추출, 페이지 수 ${data.numpages}`);

      if (text.length < 10) {
        // 텍스트가 거의 없으면 이미지 기반 PDF일 가능성
        throw new BadRequestException(
          'PDF에서 텍스트를 추출하지 못했습니다. 스캔된 이미지 PDF는 지원되지 않습니다. 텍스트가 포함된 PDF를 업로드하거나, 본문을 복사하여 아래 입력란에 붙여넣어 주세요.',
        );
      }
      return text;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // 실제 에러 원인을 로그에 기록 (디버깅용)
      this.logger.error(`PDF 파싱 실패: ${err.message}`, err.stack);

      // 암호화된 PDF 감지
      if (err.message?.includes('password') || err.message?.includes('encrypted')) {
        throw new BadRequestException(
          '암호가 걸린 PDF는 처리할 수 없습니다. 암호를 해제한 후 다시 시도해주세요.',
        );
      }
      // 손상된 PDF
      if (err.message?.includes('Invalid') || err.message?.includes('corrupt')) {
        throw new BadRequestException(
          'PDF 파일이 손상되었거나 올바른 형식이 아닙니다. 다른 PDF를 시도해주세요.',
        );
      }

      throw new BadRequestException(
        'PDF 파일을 처리할 수 없습니다. 본문을 복사하여 아래 입력란에 붙여넣어 주세요.',
      );
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || '').trim();
      this.logger.log(`DOCX 파싱 완료: ${text.length}자 추출`);

      if (text.length < 10) {
        throw new BadRequestException(
          'Word 파일에서 텍스트를 추출하지 못했습니다. 파일이 비어있거나 이미지로만 구성되어 있을 수 있습니다.',
        );
      }
      return text;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`DOCX 파싱 실패: ${err.message}`, err.stack);

      // .doc 파일을 .docx로 잘못 올린 경우
      if (err.message?.includes('zip') || err.message?.includes('ZIP') || err.message?.includes("Can't find end of central directory")) {
        throw new BadRequestException(
          '이 파일은 구버전 Word(.doc) 또는 손상된 파일로 보입니다. Word에서 .docx 형식으로 다시 저장하여 업로드해주세요.',
        );
      }

      throw new BadRequestException(
        'Word 파일을 처리할 수 없습니다. 본문을 복사하여 아래 입력란에 붙여넣어 주세요.',
      );
    }
  }
}
