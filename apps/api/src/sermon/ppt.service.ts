import { Injectable } from '@nestjs/common';

const PptxGenJS = require('pptxgenjs');

interface SlideData {
  title: string;
  scripture: string;
  summary: string;
  introduction: string;
  outline: Array<{ point: number; title: string; content: string }>;
  application: string;
  conclusion: string;
  churchName: string;
  worshipLabel: string;
  dateStr: string;
}

@Injectable()
export class PptService {
  // ── 디자인 시스템 ──
  private readonly COLORS = {
    // 기본 팔레트
    navy: '1B2A4A',
    deepNavy: '0F1D32',
    gold: 'C9A84C',
    goldLight: 'E8D5A0',

    // 텍스트
    white: 'FFFFFF',
    textPrimary: '1A1A2E',
    textBody: '374151',
    textMuted: '9CA3AF',
    textLight: 'D1D5DB',

    // 배경
    bgWhite: 'FFFFFF',
    bgWarm: 'FFFBF0',
    bgLight: 'F9FAFB',
    bgAccent: 'EFF6FF',

    // 악센트
    blue: '2563EB',
    blueLight: 'BFDBFE',
    amber: 'D97706',
    amberLight: 'FDE68A',
    green: '059669',
  };

  // 글자 수 제한 상수
  private readonly LIMITS = {
    titleMax: 16,         // 표지 제목 최대 글자
    pointTitleMax: 15,    // 대지 제목 최대 글자
    keywordMax: 25,       // 키워드 한 줄 최대
    bulletMax: 30,        // 불렛 한 줄 최대
    closingMax: 30,       // 결론 한 줄 최대
    maxBullets: 3,        // 슬라이드당 불렛 최대
  };

  async generatePpt(data: SlideData): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = '말씀동역';

    this.slideCover(pptx, data);
    this.slideScripture(pptx, data);
    for (const point of data.outline) {
      this.slideOutline(pptx, point, data.outline.length);
    }
    this.slideApplication(pptx, data);
    this.slideClosing(pptx, data);

    return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  }

  // ══════════════════════════════════════
  // 키워드 추출 엔진
  // "문장 → 핵심 키워드/짧은 구" 변환
  // ══════════════════════════════════════

  private toKeywords(text: string, maxItems: number = 3, maxLen: number = 25): string[] {
    // 1. 문장 분리
    const sentences = text
      .replace(/\n+/g, ' ')
      .split(/[.!?]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (sentences.length === 0) return [];

    // 2. 각 문장에서 핵심 구 추출
    const keywords: string[] = [];
    for (const sent of sentences) {
      if (keywords.length >= maxItems) break;

      // 접속사/부사 제거하고 핵심만
      let core = sent
        .replace(/^(그러므로|그러나|그리고|따라서|또한|특히|결국|마찬가지로|이처럼|이것은|이는|우리는|우리가|여러분|성도 여러분)\s*/g, '')
        .replace(/[.!?,;:…"'"']/g, '')
        .trim();

      // 너무 길면 주어+핵심만 추출
      if (core.length > maxLen) {
        // "~하는 것입니다" 류 제거
        core = core
          .replace(/(인 것|인 것입니다|이라는 것입니다|하는 것입니다|할 수 있습니다|해야 합니다|하시는 분입니다)$/g, '')
          .trim();

        if (core.length > maxLen) {
          // 마지막으로 글자 수 강제 자르기 (단어 경계)
          const words = core.split(/\s+/);
          let result = '';
          for (const w of words) {
            if ((result + ' ' + w).trim().length > maxLen) break;
            result = (result + ' ' + w).trim();
          }
          core = result || core.substring(0, maxLen);
        }
      }

      if (core.length >= 4 && !keywords.includes(core)) {
        keywords.push(core);
      }
    }

    return keywords.slice(0, maxItems);
  }

  // 안전한 텍스트 자르기 (... 없이, 깔끔하게)
  private safeTrunc(text: string, max: number): string {
    if (!text) return '';
    const clean = text.replace(/\n+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.lastIndexOf(' ', max);
    return clean.substring(0, cut > max * 0.5 ? cut : max);
  }

  // ══════════════════════════════════════
  // 슬라이드 1: 표지
  // ══════════════════════════════════════
  private slideCover(pptx: any, data: SlideData) {
    const slide = pptx.addSlide();
    slide.background = { color: this.COLORS.deepNavy };

    // 상단 교회명
    slide.addText(data.churchName, {
      x: 0.8, y: 0.6, w: 4, h: 0.35,
      fontSize: 11, color: this.COLORS.goldLight,
      fontFace: 'Arial', bold: true, letterSpacing: 2,
    });

    // 예배 유형
    slide.addText(data.worshipLabel, {
      x: 0.8, y: 1.0, w: 4, h: 0.3,
      fontSize: 10, color: this.COLORS.textMuted,
      fontFace: 'Arial',
    });

    // 골드 구분선
    slide.addShape('rect', {
      x: 0.8, y: 1.6, w: 1.2, h: 0.05,
      fill: { color: this.COLORS.gold },
    });

    // 설교 제목 (큰 글자, 제한)
    const title = this.safeTrunc(data.title, this.LIMITS.titleMax);
    slide.addText(title, {
      x: 0.8, y: 1.9, w: 8.4, h: 1.2,
      fontSize: 44, color: this.COLORS.white, bold: true,
      fontFace: 'Arial',
    });

    // 본문
    slide.addText(data.scripture, {
      x: 0.8, y: 3.4, w: 8.4, h: 0.45,
      fontSize: 16, color: this.COLORS.gold,
      fontFace: 'Arial', italic: true,
    });

    // 날짜
    slide.addText(data.dateStr, {
      x: 0.8, y: 4.6, w: 8.4, h: 0.3,
      fontSize: 10, color: this.COLORS.textMuted,
      fontFace: 'Arial',
    });
  }

  // ══════════════════════════════════════
  // 슬라이드 2: 오늘의 말씀
  // ══════════════════════════════════════
  private slideScripture(pptx: any, data: SlideData) {
    const slide = pptx.addSlide();
    slide.background = { color: this.COLORS.bgWhite };

    // 좌측 악센트 바
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.06, h: 5.63,
      fill: { color: this.COLORS.blue },
    });

    // 레이블
    slide.addText('오늘의 말씀', {
      x: 0.7, y: 0.5, w: 3, h: 0.35,
      fontSize: 11, color: this.COLORS.blue, bold: true,
      fontFace: 'Arial', letterSpacing: 1,
    });

    // 본문 참조
    slide.addText(data.scripture, {
      x: 0.7, y: 1.1, w: 8.6, h: 0.55,
      fontSize: 28, color: this.COLORS.textPrimary, bold: true,
      fontFace: 'Arial',
    });

    // 구분선
    slide.addShape('rect', {
      x: 0.7, y: 1.9, w: 2.5, h: 0.03,
      fill: { color: this.COLORS.blueLight },
    });

    // 핵심 메시지 (키워드 3개)
    const keywords = this.toKeywords(data.summary, 3, this.LIMITS.bulletMax);
    if (keywords.length > 0) {
      const items = keywords.map(kw => ({
        text: kw,
        options: {
          fontSize: 18, color: this.COLORS.textBody,
          bullet: { code: '2022', color: this.COLORS.blue },
          paraSpaceAfter: 18,
        },
      }));

      slide.addText(items, {
        x: 0.9, y: 2.3, w: 8.3, h: 2.6,
        fontFace: 'Arial', valign: 'top',
        lineSpacingMultiple: 1.5,
      });
    }
  }

  // ══════════════════════════════════════
  // 슬라이드 3~5: 대지
  // ══════════════════════════════════════
  private slideOutline(pptx: any, point: { point: number; title: string; content: string }, total: number) {
    const slide = pptx.addSlide();
    slide.background = { color: this.COLORS.bgLight };

    // 번호 (큰 숫자)
    slide.addText(String(point.point), {
      x: 0.5, y: 0.3, w: 0.8, h: 0.8,
      fontSize: 36, color: this.COLORS.blue, bold: true,
      fontFace: 'Arial', align: 'center', valign: 'middle',
    });

    // 구분 점
    slide.addShape('rect', {
      x: 1.4, y: 0.5, w: 0.04, h: 0.4,
      fill: { color: this.COLORS.blueLight },
    });

    // 대지 제목
    const pointTitle = this.safeTrunc(point.title, this.LIMITS.pointTitleMax);
    slide.addText(pointTitle, {
      x: 1.7, y: 0.35, w: 7.6, h: 0.7,
      fontSize: 26, color: this.COLORS.textPrimary, bold: true,
      fontFace: 'Arial', valign: 'middle',
    });

    // 하단 구분선
    slide.addShape('rect', {
      x: 0.5, y: 1.3, w: 9.0, h: 0.02,
      fill: { color: this.COLORS.blueLight },
    });

    // 핵심 키워드 (3개, 각 25자)
    const keywords = this.toKeywords(point.content, this.LIMITS.maxBullets, this.LIMITS.keywordMax);

    const bulletItems = keywords.map(kw => ({
      text: kw,
      options: {
        fontSize: 20, color: this.COLORS.textBody,
        bullet: { code: '25CF', color: this.COLORS.blue },
        indentLevel: 0,
        paraSpaceAfter: 20,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.8, y: 1.7, w: 8.4, h: 3.0,
      fontFace: 'Arial', valign: 'top',
      lineSpacingMultiple: 1.7,
    });

    // 페이지 표시
    slide.addText(`${point.point}/${total}`, {
      x: 9.0, y: 5.0, w: 0.6, h: 0.25,
      fontSize: 9, color: this.COLORS.textMuted,
      fontFace: 'Arial', align: 'right',
    });
  }

  // ══════════════════════════════════════
  // 슬라이드 6: 적용
  // ══════════════════════════════════════
  private slideApplication(pptx: any, data: SlideData) {
    const slide = pptx.addSlide();
    slide.background = { color: this.COLORS.bgWarm };

    // 좌측 악센트 바
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.06, h: 5.63,
      fill: { color: this.COLORS.amber },
    });

    // 레이블
    slide.addText('이번 한 주', {
      x: 0.7, y: 0.5, w: 3, h: 0.35,
      fontSize: 11, color: this.COLORS.amber, bold: true,
      fontFace: 'Arial', letterSpacing: 1,
    });

    // 소제목
    slide.addText('삶으로 실천하기', {
      x: 0.7, y: 1.1, w: 8.6, h: 0.55,
      fontSize: 28, color: this.COLORS.textPrimary, bold: true,
      fontFace: 'Arial',
    });

    // 구분선
    slide.addShape('rect', {
      x: 0.7, y: 1.9, w: 2.5, h: 0.03,
      fill: { color: this.COLORS.amberLight },
    });

    // 적용 키워드 (3개)
    const keywords = this.toKeywords(data.application, 3, this.LIMITS.bulletMax);
    const items = keywords.map((kw, i) => ({
      text: kw,
      options: {
        fontSize: 20, color: this.COLORS.textBody,
        bullet: { code: '25B6', color: this.COLORS.amber },
        paraSpaceAfter: 20,
      },
    }));

    slide.addText(items, {
      x: 0.9, y: 2.3, w: 8.3, h: 2.6,
      fontFace: 'Arial', valign: 'top',
      lineSpacingMultiple: 1.7,
    });
  }

  // ══════════════════════════════════════
  // 슬라이드 7: 마무리
  // ══════════════════════════════════════
  private slideClosing(pptx: any, data: SlideData) {
    const slide = pptx.addSlide();
    slide.background = { color: this.COLORS.deepNavy };

    // 상단 골드 라인
    slide.addShape('rect', {
      x: 3.5, y: 1.4, w: 3.0, h: 0.04,
      fill: { color: this.COLORS.gold },
    });

    // 핵심 마무리 문장 (키워드 1개)
    const closingKeywords = this.toKeywords(data.conclusion, 1, this.LIMITS.closingMax);
    const closingText = closingKeywords[0] || this.safeTrunc(data.title, this.LIMITS.closingMax);

    slide.addText(closingText, {
      x: 0.8, y: 1.7, w: 8.4, h: 1.8,
      fontSize: 32, color: this.COLORS.white, bold: true,
      fontFace: 'Arial', align: 'center', valign: 'middle',
      lineSpacingMultiple: 1.4,
    });

    // 하단 골드 라인
    slide.addShape('rect', {
      x: 3.5, y: 3.7, w: 3.0, h: 0.04,
      fill: { color: this.COLORS.gold },
    });

    // 본문 참조
    slide.addText(data.scripture, {
      x: 0.8, y: 4.0, w: 8.4, h: 0.4,
      fontSize: 13, color: this.COLORS.gold, italic: true,
      fontFace: 'Arial', align: 'center',
    });

    // 교회명
    slide.addText(data.churchName, {
      x: 0.8, y: 4.7, w: 8.4, h: 0.3,
      fontSize: 10, color: this.COLORS.textMuted,
      fontFace: 'Arial', align: 'center',
    });
  }
}
