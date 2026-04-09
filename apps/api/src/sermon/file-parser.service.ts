import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileParserService {
  async parseFile(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const mime = file.mimetype;

    // TXT
    if (ext === 'txt' || mime === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    // PDF
    if (ext === 'pdf' || mime === 'application/pdf') {
      return this.parsePdf(file.buffer);
    }

    // Word (.docx)
    if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.parseDocx(file.buffer);
    }

    // 한글 (.hwp / .hwpx) — 텍스트 추출 시도
    if (ext === 'hwp' || ext === 'hwpx') {
      return this.parseHwp(file.buffer, ext);
    }

    // Word 97-2003 (.doc)
    if (ext === 'doc' || mime === 'application/msword') {
      // .doc은 바이너리 포맷이라 mammoth로 처리 불가, 텍스트 추출 시도
      return this.extractTextFallback(file.buffer);
    }

    throw new BadRequestException(
      `지원하지 않는 파일 형식입니다 (${ext}). PDF, Word(.docx), 텍스트(.txt) 파일을 업로드해주세요.`
    );
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const text = data.text?.trim();
      if (!text || text.length < 10) {
        throw new Error('PDF에서 텍스트를 추출할 수 없습니다 (이미지 기반 PDF일 수 있습니다)');
      }
      return text;
    } catch (err: any) {
      if (err.message?.includes('텍스트를 추출')) throw new BadRequestException(err.message);
      throw new BadRequestException('PDF 파일을 처리할 수 없습니다. 다른 형식으로 시도해주세요.');
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (!text || text.length < 10) {
        throw new Error('Word 파일에서 텍스트를 추출할 수 없습니다');
      }
      return text;
    } catch (err: any) {
      if (err.message?.includes('텍스트를 추출')) throw new BadRequestException(err.message);
      throw new BadRequestException('Word 파일을 처리할 수 없습니다. .docx 형식인지 확인해주세요.');
    }
  }

  private async parseHwp(buffer: Buffer, ext: string): Promise<string> {
    // HWP는 전용 파서가 필요하지만, 간단한 텍스트 추출 시도
    // hwpx는 ZIP 기반이므로 XML 추출 가능
    if (ext === 'hwpx') {
      try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        let text = '';
        for (const entry of entries) {
          if (entry.entryName.includes('content') && entry.entryName.endsWith('.xml')) {
            const xml = entry.getData().toString('utf-8');
            // XML 태그 제거하고 텍스트만 추출
            text += xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '\n';
          }
        }
        if (text.trim().length > 10) return text.trim();
      } catch { /* fall through */ }
    }

    // HWP 바이너리는 직접 파싱 불가 → 안내
    throw new BadRequestException(
      '한글(.hwp) 파일은 현재 직접 지원이 어렵습니다. Word(.docx) 또는 PDF로 변환 후 업로드해주세요.'
    );
  }

  private extractTextFallback(buffer: Buffer): string {
    // 바이너리에서 한글/영문 텍스트 추출 시도
    const text = buffer.toString('utf-8').replace(/[^\uAC00-\uD7A3\u0020-\u007E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 50) return text;
    throw new BadRequestException('이 파일 형식에서 텍스트를 추출할 수 없습니다. PDF 또는 .docx로 변환 후 업로드해주세요.');
  }
}
