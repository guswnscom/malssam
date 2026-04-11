import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai/ai.service';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { RegenerateSermonDto } from './dto/regenerate-sermon.dto';
import { PptService } from './ppt.service';
import { buildRegenerationPrompt } from './ai/prompts';
import {
  parseSermonJson,
  validateSermonOutput,
  processReferences,
} from './ai/post-processor';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class SermonService {
  private readonly logger = new Logger(SermonService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly pptService: PptService,
  ) {}

  // ── 생성 ──
  async generate(userId: string, dto: GenerateSermonDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
      include: { church: { include: { profile: true, subscription: true } } },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const church = membership.church;
    const profile = church.profile!;
    const subscription = church.subscription!;

    // 구독 상태 체크
    if (subscription.status === 'expired' || subscription.status === 'suspended') {
      throw new ForbiddenException('구독이 만료되었습니다. 결제를 진행해주세요.');
    }
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trialEnd);
      if (new Date() > trialEnd) {
        await this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'expired' } });
        throw new ForbiddenException('무료체험이 종료되었습니다. 구독을 시작해주세요.');
      }
    }

    if (subscription.maxSermonsMonth > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await this.prisma.sermonRequest.count({
        where: { churchId: church.id, createdAt: { gte: monthStart } },
      });
      if (count >= subscription.maxSermonsMonth) {
        throw new ForbiddenException(`이번 달 설교 생성 한도(${subscription.maxSermonsMonth}회)에 도달했습니다`);
      }
    }

    const request = await this.prisma.sermonRequest.create({
      data: {
        churchId: church.id, userId,
        worshipType: dto.worshipType, targetDate: new Date(dto.targetDate),
        scripture: dto.scripture, depth: dto.depth,
        targetAudience: dto.targetAudience,
        specialInstruction: dto.specialInstruction, status: 'generating',
      },
    });

    try {
      const { output, model, tokensUsed } = await this.ai.generateSermon({
        worshipType: dto.worshipType, targetDate: dto.targetDate,
        scripture: dto.scripture, depth: dto.depth,
        targetAudience: dto.targetAudience,
        specialInstruction: dto.specialInstruction,
        churchSize: church.sizeCategory,
        sermonStyle: profile.sermonStyle,
        congregationType: profile.congregationType,
      });

      // 트랜잭션: draft 생성 + request 상태 업데이트를 원자적으로 처리
      const [draft] = await this.prisma.$transaction([
        this.prisma.sermonDraft.create({
          data: {
            sermonRequestId: request.id, title: output.title,
            scripture: output.scripture || dto.scripture,
            scriptureText: output.scriptureText || null,
            summary: output.summary || '', introduction: output.introduction,
            outline: output.outline as any, application: output.application,
            conclusion: output.conclusion,
            citations: {
              create: (output.references || []).map((ref) => ({
                citationType: ref.type || 'REFERENCE',
                sourceAuthor: ref.author, sourceTitle: ref.title,
              })),
            },
          },
          include: { citations: true },
        }),
        this.prisma.sermonRequest.update({
          where: { id: request.id },
          data: { status: 'completed', aiModel: model, aiTokensUsed: tokensUsed },
        }),
      ]);

      return this.formatDraftResponse(draft, request);
    } catch (error) {
      await this.prisma.sermonRequest.update({ where: { id: request.id }, data: { status: 'failed' } });
      throw error;
    }
  }

  // ── 조회 ──
  async getById(userId: string, sermonId: string) {
    const { draft, membership } = await this.loadDraftWithAuth(userId, sermonId);
    return this.formatDraftResponse(draft, draft.sermonRequest);
  }

  // ── 수정 ──
  async update(userId: string, sermonId: string, dto: UpdateSermonDto) {
    const { draft, membership } = await this.loadDraftWithAuth(userId, sermonId);

    // 권한: 작성자 또는 SENIOR_PASTOR
    if (draft.sermonRequest.userId !== userId && membership.role !== 'SENIOR_PASTOR') {
      throw new ForbiddenException('수정 권한이 없습니다');
    }

    const updated = await this.prisma.sermonDraft.update({
      where: { id: sermonId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.introduction !== undefined && { introduction: dto.introduction }),
        ...(dto.outline !== undefined && { outline: dto.outline as any }),
        ...(dto.application !== undefined && { application: dto.application }),
        ...(dto.conclusion !== undefined && { conclusion: dto.conclusion }),
      },
      include: { citations: true, sermonRequest: true },
    });

    return this.formatDraftResponse(updated, updated.sermonRequest);
  }

  // ── 재생성 ──
  async regenerate(userId: string, sermonId: string, dto: RegenerateSermonDto) {
    const { draft, membership } = await this.loadDraftWithAuth(userId, sermonId);

    if (draft.sermonRequest.userId !== userId && membership.role !== 'SENIOR_PASTOR') {
      throw new ForbiddenException('수정 권한이 없습니다');
    }

    if (draft.regenerationCount >= 5) {
      throw new ForbiddenException('재생성은 5회까지 가능합니다. 직접 편집을 시도해보세요.');
    }

    const originalDraft = {
      title: draft.title, scripture: draft.scripture, summary: draft.summary,
      introduction: draft.introduction, outline: draft.outline,
      application: draft.application, conclusion: draft.conclusion,
    };

    const regenPrompt = buildRegenerationPrompt(originalDraft, dto.feedback, dto.targetSection);

    let output: any;
    let tokensUsed: number;
    try {
      const result = await this.ai.regenerateSermon(regenPrompt);
      output = result.output;
      tokensUsed = result.tokensUsed;
    } catch (error: any) {
      this.logger.error(`재생성 AI 호출 실패: ${error.message}`);
      throw new ForbiddenException(`AI 수정 요청에 실패했습니다. 잠시 후 다시 시도해주세요. (${error.message?.substring(0, 50)})`);
    }

    const updated = await this.prisma.sermonDraft.update({
      where: { id: sermonId },
      data: {
        title: output.title || draft.title,
        summary: output.summary || draft.summary,
        introduction: output.introduction || draft.introduction,
        outline: (output.outline as any) || draft.outline,
        application: output.application || draft.application,
        conclusion: output.conclusion || draft.conclusion,
        regenerationCount: { increment: 1 },
      },
      include: { citations: true, sermonRequest: true },
    });

    this.logger.log(`재생성 완료: "${updated.title}" (${tokensUsed} tokens, ${updated.regenerationCount}/5)`);

    return this.formatDraftResponse(updated, updated.sermonRequest);
  }

  // ── PDF ──
  // ── PDF (HTML 기반 — 한글 정상 표시) ──
  async generatePdfHtml(userId: string, sermonId: string): Promise<string> {
    // 서명된 PDF 요청 시 인증 우회 (이미 서명으로 검증됨)
    let draft: any;
    if (userId === '__pdf_signed__') {
      draft = await this.prisma.sermonDraft.findUnique({
        where: { id: sermonId },
        include: { citations: true, sermonRequest: true },
      });
      if (!draft) throw new NotFoundException('설교를 찾을 수 없습니다');
    } else {
      const result = await this.loadDraftWithAuth(userId, sermonId);
      draft = result.draft;
    }
    const request = draft.sermonRequest;
    const church = await this.prisma.church.findUnique({ where: { id: request.churchId } });
    const churchName = church?.name || '';
    const worshipLabel: Record<string, string> = {
      SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
      DAWN: '새벽예배', SPECIAL: '특별예배',
    };
    const dateStr = new Date(request.targetDate).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const outline = draft.outline as any[];
    const citations = draft.citations || [];

    const escHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escHtml(draft.title)} - ${churchName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', sans-serif; color: #1a1a2e; line-height: 1.8; }
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 20mm 18mm 20mm 18mm; }
  }
  @media screen {
    body { max-width: 210mm; margin: 0 auto; padding: 20mm 18mm; background: #f9fafb; }
    .page { background: white; padding: 20mm; box-shadow: 0 2px 20px rgba(0,0,0,0.08); border-radius: 4px; }
  }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
  .header .church { font-size: 11px; color: #6b7280; letter-spacing: 2px; margin-bottom: 4px; }
  .header .worship { font-size: 12px; color: #2563eb; font-weight: 600; margin-bottom: 16px; }
  .header .title { font-size: 26px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; }
  .header .scripture { font-size: 14px; color: #2563eb; font-style: italic; }
  .header .date { font-size: 11px; color: #9ca3af; margin-top: 8px; }
  .summary { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; margin-bottom: 28px; font-size: 13px; color: #374151; border-radius: 0 8px 8px 0; }
  .section { margin-bottom: 24px; }
  .section-label { font-size: 11px; color: #2563eb; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; }
  .section-title { font-size: 17px; font-weight: 700; color: #1e3a5f; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
  .section-title .num { background: #2563eb; color: white; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .section-content { font-size: 13px; color: #374151; text-align: justify; }
  .application { background: #fffbeb; border-left: 4px solid #d97706; padding: 16px 20px; border-radius: 0 8px 8px 0; }
  .application .section-label { color: #d97706; }
  .references { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .references h3 { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
  .references .ref { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .ref-type { background: #f3f4f6; color: #6b7280; font-size: 10px; padding: 1px 6px; border-radius: 3px; margin-right: 6px; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #2563eb; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.3); z-index: 100; }
  .print-btn:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="church">${escHtml(churchName)}</div>
    <div class="worship">${escHtml(worshipLabel[request.worshipType] || '')}</div>
    <div class="title">${escHtml(draft.title)}</div>
    <div class="scripture">${escHtml(draft.scripture)}</div>
    <div class="date">${escHtml(dateStr)}</div>
  </div>

  ${draft.scriptureText ? `
  <div class="section" style="background: #f0f4ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
    <div class="section-label" style="color: #2563eb;">성경 원문</div>
    <div class="section-content" style="font-style: italic; font-size: 12px; line-height: 2;">${escHtml(draft.scriptureText)}</div>
  </div>
  ` : ''}

  <div class="summary">${escHtml(draft.summary)}</div>

  <div class="section">
    <div class="section-label">서론</div>
    <div class="section-content">${escHtml(draft.introduction)}</div>
  </div>

  ${outline.map(p => `
  <div class="section">
    <div class="section-title"><span class="num">${p.point}</span> ${escHtml(p.title)}</div>
    <div class="section-content">${escHtml(p.content)}</div>
  </div>
  `).join('')}

  <div class="section application">
    <div class="section-label">적용</div>
    <div class="section-content">${escHtml(draft.application)}</div>
  </div>

  <div class="section">
    <div class="section-label">결론</div>
    <div class="section-content">${escHtml(draft.conclusion)}</div>
  </div>

</div>

<button class="print-btn no-print" onclick="window.print()">PDF 저장 / 인쇄</button>
</body>
</html>`;
  }

  // ── PDF (레거시 — PDFKit) ──
  async generatePdf(userId: string, sermonId: string): Promise<Buffer> {
    const { draft } = await this.loadDraftWithAuth(userId, sermonId);
    const request = draft.sermonRequest;

    // 교회명 가져오기
    const church = await this.prisma.church.findUnique({ where: { id: request.churchId } });
    const churchName = church?.name || '';

    const worshipLabel: Record<string, string> = {
      SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
      DAWN: '새벽예배', SPECIAL: '특별예배',
    };

    const dateStr = new Date(request.targetDate).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 한글 폰트 없이 기본 폰트 사용 — PDF에 한글이 깨질 수 있으므로
      // HTML→PDF 방식으로 전환합니다
      doc.fontSize(10).text(`${churchName} | ${worshipLabel[request.worshipType] || ''} | ${dateStr}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(20).text(draft.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(draft.scripture, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(11).text(draft.summary, { align: 'left' });
      doc.moveDown(2);

      doc.fontSize(14).text('[서론]');
      doc.fontSize(11).text(draft.introduction);
      doc.moveDown();

      const outline = draft.outline as any[];
      for (const point of outline) {
        doc.moveDown();
        doc.fontSize(14).text(`[${point.point}] ${point.title}`);
        doc.fontSize(11).text(point.content);
      }

      doc.moveDown();
      doc.fontSize(14).text('[적용]');
      doc.fontSize(11).text(draft.application);

      doc.moveDown();
      doc.fontSize(14).text('[결론]');
      doc.fontSize(11).text(draft.conclusion);

      if (draft.citations && draft.citations.length > 0) {
        doc.moveDown(2);
        doc.fontSize(12).text('[참고자료]');
        for (const c of draft.citations) {
          doc.fontSize(10).text(`- ${c.citationType === 'REFERENCE' ? '참고' : '배경'}: ${c.sourceAuthor}, "${c.sourceTitle}"`);
        }
      }

      doc.end();
    });
  }

  // ── PPT ──
  async generatePptx(userId: string, sermonId: string): Promise<Buffer> {
    const { draft } = await this.loadDraftWithAuth(userId, sermonId);
    const request = draft.sermonRequest;
    const church = await this.prisma.church.findUnique({ where: { id: request.churchId } });

    const worshipLabel: Record<string, string> = {
      SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
      DAWN: '새벽예배', SPECIAL: '특별예배',
    };

    return this.pptService.generatePpt({
      title: draft.title,
      scripture: draft.scripture,
      summary: draft.summary,
      introduction: draft.introduction,
      outline: draft.outline as any[],
      application: draft.application,
      conclusion: draft.conclusion,
      churchName: church?.name || '',
      worshipLabel: worshipLabel[request.worshipType] || '',
      dateStr: new Date(request.targetDate).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    });
  }

  // ── 삭제 ──
  async remove(userId: string, sermonId: string) {
    const { draft, membership } = await this.loadDraftWithAuth(userId, sermonId);

    if (draft.sermonRequest.userId !== userId && membership.role !== 'SENIOR_PASTOR') {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }

    // 트랜잭션: 관련 데이터를 원자적으로 삭제
    await this.prisma.$transaction([
      this.prisma.citation.deleteMany({ where: { sermonDraftId: sermonId } }),
      this.prisma.sermonDraft.delete({ where: { id: sermonId } }),
      this.prisma.sermonRequest.delete({ where: { id: draft.sermonRequestId } }),
    ]);

    return { message: '설교가 삭제되었습니다' };
  }

  // ── 목록 ──
  async list(userId: string, worshipType?: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const where: any = { churchId: membership.churchId, status: 'completed' };
    if (worshipType) where.worshipType = worshipType;

    const requests = await this.prisma.sermonRequest.findMany({
      where,
      include: {
        draft: { select: { id: true, title: true, scripture: true, createdAt: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return requests
      .filter((r) => r.draft)
      .map((r) => ({
        id: r.draft!.id,
        title: r.draft!.title,
        scripture: r.draft!.scripture,
        worshipType: r.worshipType,
        targetDate: r.targetDate,
        authorName: r.user.name,
        createdAt: r.draft!.createdAt,
      }));
  }

  // ── 분석 (라이트) ──
  async analyzeSermon(text: string) {
    const { output } = await this.ai.analyzeSermon(text);
    return output;
  }

  // ── 개선된 설교 생성 ──
  async improveSermon(originalText: string, suggestions: string[]) {
    const { output } = await this.ai.improveSermon(originalText, suggestions);
    return output;
  }

  // ── 개선된 설교 저장 ──
  async saveImprovedSermon(userId: string, body: any) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const request = await this.prisma.sermonRequest.create({
      data: {
        churchId: membership.churchId, userId,
        worshipType: 'SUNDAY', targetDate: new Date(),
        scripture: body.scripture || '분석 기반 개선',
        status: 'completed',
      },
    });

    const draft = await this.prisma.sermonDraft.create({
      data: {
        sermonRequestId: request.id,
        title: body.title || '개선된 설교',
        scripture: body.scripture || '',
        summary: body.summary || '',
        introduction: body.introduction || '',
        outline: body.outline || [],
        application: body.application || '',
        conclusion: body.conclusion || '',
      },
      include: { citations: true, sermonRequest: true },
    });

    return this.formatDraftResponse(draft, request);
  }

  // ── 헬퍼 ──
  private async loadDraftWithAuth(userId: string, sermonId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const draft = await this.prisma.sermonDraft.findUnique({
      where: { id: sermonId },
      include: { citations: true, sermonRequest: true },
    });
    if (!draft) throw new NotFoundException('설교를 찾을 수 없습니다');
    if (draft.sermonRequest.churchId !== membership.churchId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    return { draft, membership };
  }

  private formatDraftResponse(draft: any, request: any) {
    return {
      id: draft.id, sermonRequestId: request.id,
      title: draft.title, scripture: draft.scripture,
      scriptureText: draft.scriptureText || null,
      summary: draft.summary, introduction: draft.introduction,
      outline: draft.outline, application: draft.application,
      conclusion: draft.conclusion,
      citations: (draft.citations || []).map((c: any) => ({
        id: c.id, type: c.citationType,
        author: c.sourceAuthor, title: c.sourceTitle,
      })),
      regenerationCount: draft.regenerationCount,
      worshipType: request.worshipType, targetDate: request.targetDate,
      createdAt: draft.createdAt, updatedAt: draft.updatedAt,
    };
  }
}
