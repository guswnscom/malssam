'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import PageHelp, { HelpButton, HELP_DATA } from '@/components/PageHelp';
import { useToast } from '@/components/Toast';

interface OutlinePoint { point: number; title: string; content: string; }
interface Citation { id: string; type: string; author: string; title: string; }
interface SermonData {
  id: string; title: string; scripture: string; scriptureText?: string | null;
  summary: string; introduction: string; outline: OutlinePoint[];
  application: string; conclusion: string; citations: Citation[];
  worshipType: string; targetDate: string; regenerationCount: number;
  createdAt: string; updatedAt: string;
}

const WL: Record<string, string> = {
  SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배', DAWN: '새벽예배', SPECIAL: '특별예배',
};

export default function SermonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast, confirm } = useToast();
  const [sermon, setSermon] = useState<SermonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [editVal, setEditVal] = useState('');
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [regenSection, setRegenSection] = useState('FULL');
  const [regenLoading, setRegenLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ before: SermonData; after: SermonData; changes: string[] } | null>(null);
  const [reviewSec, setReviewSec] = useState(0);
  const [enrichSec, setEnrichSec] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | ''>('');

  const sid = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  useEffect(() => {
    if (!sid) { setError('ID 없음'); setLoading(false); return; }
    // 로컬 임시저장 복구 시도
    const draft = localStorage.getItem(`sermon_draft_${sid}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setSermon(parsed);
        setAutoSaveStatus('saved');
        setLoading(false);
        // 서버 데이터도 확인 (백그라운드)
        api.get(`/sermons/${sid}`).then(r => {
          // 서버 데이터가 더 최신이면 교체
          const serverUpdated = new Date(r.data.updatedAt).getTime();
          const localUpdated = parsed._localSavedAt || 0;
          if (serverUpdated > localUpdated) {
            setSermon(r.data);
            localStorage.removeItem(`sermon_draft_${sid}`);
          }
        }).catch(() => {});
        return;
      } catch { /* ignore invalid draft */ }
    }
    api.get(`/sermons/${sid}`)
      .then(r => setSermon(r.data))
      .catch(e => setError(e?.response?.data?.message || '설교를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [sid]);

  // 자동저장: 30초마다 로컬 임시저장
  useEffect(() => {
    if (!sermon || !sid) return;
    const timer = setInterval(() => {
      try {
        localStorage.setItem(`sermon_draft_${sid}`, JSON.stringify({ ...sermon, _localSavedAt: Date.now() }));
        setAutoSaveStatus('saved');
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, [sermon, sid]);

  if (loading) return <div className="flex items-center justify-center py-32 bg-gray-50"><p className="text-gray-500">로딩 중...</p></div>;
  if (error || !sermon) return (
    <div className="flex flex-col items-center justify-center py-32 bg-gray-50">
      <p className="text-red-500 mb-4">{error || '오류'}</p>
      <button onClick={() => router.push('/home')} className="text-blue-600">홈으로</button>
    </div>
  );

  const dateStr = new Date(sermon.targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const startEdit = (key: string, val: string) => { setEditingKey(key); setEditVal(val); };

  const saveEdit = async () => {
    if (!sermon) return;
    setSaving(true);
    try {
      const d: any = {};
      if (editingKey === 'title') d.title = editVal;
      else if (editingKey === 'summary') d.summary = editVal;
      else if (editingKey === 'introduction') d.introduction = editVal;
      else if (editingKey === 'application') d.application = editVal;
      else if (editingKey === 'conclusion') d.conclusion = editVal;
      else if (editingKey.startsWith('outline_')) {
        const i = parseInt(editingKey.split('_')[1]);
        const o = [...sermon.outline]; o[i] = { ...o[i], content: editVal }; d.outline = o;
      }
      const r = await api.put(`/sermons/${sermon.id}`, d);
      setSermon(r.data); setEditingKey('');
    } catch { toast('error', '저장에 실패했습니다'); }
    finally { setSaving(false); }
  };

  const handleRegen = async () => {
    if (!sermon || !regenFeedback.trim() || reviewLoading) return;
    setRegenLoading(true);
    try {
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, { feedback: regenFeedback, targetSection: regenSection });
      setSermon(r.data); setRegenFeedback(''); setRegenOpen(false);
    } catch (e: any) { toast('error', e?.response?.data?.message || '재생성에 실패했습니다'); }
    finally { setRegenLoading(false); }
  };

  const handleEnrich = async (idx: number) => {
    if (!sermon) return;
    const key = `outline_${idx}`;
    setEnrichLoading(key);
    setEnrichSec(0);
    const timer = setInterval(() => setEnrichSec(s => s + 1), 1000);
    try {
      const pt = sermon.outline[idx];
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, {
        feedback: `"${pt.title}" 대지에 실생활 예화, 역사적 사례, 현재 사회 상황과 연결되는 구체적인 이야기를 추가해주세요. 본문 "${sermon.scripture}"과 연결되어야 합니다.`,
        targetSection: `OUTLINE_${idx + 1}`,
      });
      setSermon(r.data);
    } catch (e: any) { toast('error', e?.response?.data?.message || '예화 추가에 실패했습니다'); }
    finally { clearInterval(timer); setEnrichLoading(''); setEnrichSec(0); }
  };

  const handlePptPrompt = () => {
    if (!sermon) return;

    // 예배 유형별 슬라이드 수 설정
    const SLIDE_CONFIG: Record<string, { total: number; outlineSlides: number; desc: string }> = {
      SUNDAY: { total: 12, outlineSlides: 4, desc: '대예배 (10~12장)' },
      SPECIAL: { total: 12, outlineSlides: 4, desc: '특별예배 (10~12장)' },
      WEDNESDAY: { total: 8, outlineSlides: 2, desc: '수요예배 (8장)' },
      FRIDAY: { total: 6, outlineSlides: 1, desc: '금요예배 (6장)' },
      DAWN: { total: 6, outlineSlides: 1, desc: '새벽예배 (6장)' },
    };
    const config = SLIDE_CONFIG[sermon.worshipType] || SLIDE_CONFIG.SUNDAY;

    // 대예배/특별예배: 대지별로 핵심내용 + 예화/적용을 분리하여 여러 슬라이드
    // 수요예배: 대지별 1~2장씩 핵심 중심으로
    // 금요/새벽: 대지 전체를 압축하여 핵심 키워드 중심
    let slideStructure = '';

    if (sermon.worshipType === 'SUNDAY' || sermon.worshipType === 'SPECIAL') {
      slideStructure = `총 10~12장의 슬라이드로 구성해주세요.
1. 표지: 설교 제목 + 성경 본문 + 날짜
2. 성경 본문: 본문 말씀 전문 표시 (큰 글씨, 경건한 배경)
3. 서론 핵심: 서론의 핵심 질문 또는 도입 문장 1~2줄
${sermon.outline.map((p, i) => {
  const base = 4 + i * 2;
  return `${base}. 대지 ${p.point} - "${p.title}" 핵심 메시지 (키워드 + 핵심 한 줄)
${base + 1}. 대지 ${p.point} - 예화/적용 (구체적 이야기나 실생활 적용 포인트)`;
}).join('\n')}
${4 + sermon.outline.length * 2}. 적용: 이번 주 구체적 실천 포인트 3가지 (번호 목록)
${5 + sermon.outline.length * 2}. 결론: 핵심 한 줄 메시지 + 성경 본문 재인용
${6 + sermon.outline.length * 2}. 마무리: 축도 또는 기도문 (선택)

★ 중요: 청중이 메시지를 따라가기 쉽도록 각 슬라이드에 텍스트는 3줄 이내, 핵심 키워드를 크게 배치하세요.`;
    } else if (sermon.worshipType === 'WEDNESDAY') {
      slideStructure = `총 8장의 슬라이드로 구성해주세요.
1. 표지: 설교 제목 + 성경 본문
2. 성경 본문: 본문 말씀 (핵심 구절 강조 표시)
3. 서론: 핵심 도입 메시지 1~2줄
${sermon.outline.map((p, i) => `${4 + i}. 대지 ${p.point} - "${p.title}": 핵심 메시지 + 적용 포인트 (한 슬라이드에 압축)`).join('\n')}
${4 + sermon.outline.length}. 적용: 이번 주 실천 포인트 2~3가지
${5 + sermon.outline.length}. 마무리: 핵심 한 줄 + 기도 요청

★ 수요예배는 핵심 전달 중심으로 간결하게 구성하세요.`;
    } else {
      slideStructure = `총 6장의 슬라이드로 간결하게 구성해주세요.
1. 표지: 설교 제목 + 성경 본문
2. 성경 본문: 핵심 구절 1~2절만 크게 표시
3. 핵심 메시지 1: 대지들의 핵심을 1~2개 키워드로 압축
4. 핵심 메시지 2: 나머지 대지 핵심 + 예화 한 줄
5. 적용: 오늘 하루 실천 포인트 1~2가지
6. 마무리: 핵심 한 줄 + 기도

★ ${sermon.worshipType === 'DAWN' ? '새벽예배는 짧고 강렬하게, 하루를 여는 메시지 중심으로' : '금요예배는 한 주를 정리하는 위로와 소망 중심으로'} 구성하세요.`;
    }

    const prompt = `아래 설교 내용을 기반으로 ${WL[sermon.worshipType] || sermon.worshipType}용 PPT 슬라이드를 만들어주세요.

[설교 정보]
- 제목: ${sermon.title}
- 성경 본문: ${sermon.scripture}
- 예배: ${WL[sermon.worshipType] || sermon.worshipType}
- 날짜: ${dateStr}

[슬라이드 구성 — ${config.desc}]
${slideStructure}

[설교 본문]

[서론]
${sermon.introduction}

${sermon.outline.map(p => `[대지 ${p.point}: ${p.title}]\n${p.content}`).join('\n\n')}

[적용]
${sermon.application}

[결론]
${sermon.conclusion}

[디자인 요청]
- 깔끔하고 차분한 기독교 느낌의 디자인
- 각 슬라이드에 주제에 맞는 배경 이미지 포함
- 텍스트는 핵심 키워드 중심으로 최소화 (한 슬라이드에 3줄 이내)
- 핵심 키워드는 크고 굵게, 보조 설명은 작게 배치
- 배경은 밝고 따뜻한 톤 (어둡지 않게)
- 성경 본문 인용 시 구절 번호 함께 표기
- 청중이 설교 내용을 시각적으로 따라갈 수 있도록 구성`;

    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PPT_프롬프트_${sermon.title}.txt`;
    a.click();
    logUsage('ppt_download', { sermonId: sermon.id, worshipType: sermon.worshipType });
  };

  const handlePdf = async () => {
    try {
      const { data } = await api.get(`/sermons/${sermon.id}/pdf-token`);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      window.open(`${baseUrl}/sermons/${sermon.id}/pdf?sig=${data.sig}&exp=${data.exp}`, '_blank');
    } catch { toast('error', 'PDF를 열 수 없습니다'); }
  };

  const handleExportPdf = async () => {
    try {
      const { data } = await api.get(`/sermons/${sermon.id}/pdf-token`);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const url = `${baseUrl}/sermons/${sermon.id}/pdf?sig=${data.sig}&exp=${data.exp}`;
      const w = window.open(url, '_blank');
      if (w) {
        setTimeout(() => { try { w.print(); } catch {} }, 2000);
      }
    } catch { toast('error', 'PDF를 열 수 없습니다'); }
    logUsage('pdf_view', { sermonId: sermon.id });
  };

  // 사용 로그 기록
  const logUsage = (action: string, metadata?: any) => {
    api.post('/feedback/log', { action, metadata }).catch(() => {});
  };

  const handleSermonFeedback = async () => {
    if (!feedbackRating) return;
    try {
      await api.post('/feedback', {
        category: 'sermon',
        rating: feedbackRating,
        comment: feedbackText || null,
        metadata: { sermonId: sermon.id, worshipType: sermon.worshipType },
      });
      setFeedbackSent(true);
      setTimeout(() => { setFeedbackOpen(false); setFeedbackSent(false); setFeedbackRating(''); setFeedbackText(''); }, 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!sermon) return;
    const shareText = `[${WL[sermon.worshipType] || sermon.worshipType}] ${sermon.title}\n📖 ${sermon.scripture}\n📅 ${dateStr}\n\n${sermon.summary}`;

    // Web Share API 지원 시 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({
          title: sermon.title,
          text: shareText,
        });
        return;
      } catch {}
    }

    // 클립보드 복사 (PC)
    try {
      await navigator.clipboard.writeText(shareText);
      toast('success', '설교 요약이 클립보드에 복사되었습니다');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('success', '설교 요약이 클립보드에 복사되었습니다');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/sermons/${sermon.id}`, {
        title: sermon.title, summary: sermon.summary, introduction: sermon.introduction,
        outline: sermon.outline, application: sermon.application, conclusion: sermon.conclusion,
      });
      toast('success', '저장되었습니다');
      localStorage.removeItem(`sermon_draft_${sermon.id}`);
      setAutoSaveStatus('saved');
    } catch { toast('error', '저장에 실패했습니다'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/sermons/${sermon.id}`); toast('success', '삭제되었습니다'); router.push('/sermons'); } catch { toast('error', '삭제에 실패했습니다'); }
  };

  const handleFinalReview = async () => {
    if (!sermon || regenLoading) return;
    const before = { ...sermon };
    setReviewLoading(true);
    setReviewSec(0);
    const timer = setInterval(() => setReviewSec(s => s + 1), 1000);
    try {
      // 먼저 현재 상태 저장
      await api.put(`/sermons/${sermon.id}`, {
        title: sermon.title, summary: sermon.summary, introduction: sermon.introduction,
        outline: sermon.outline, application: sermon.application, conclusion: sermon.conclusion,
      });
      // AI 검토 실행
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, {
        feedback: '전체 설교를 최종 검토해주세요. 전달력, 구조, 자연스러움을 개선하고 주석보다 강단 전달 중심으로 다듬어주세요. 예화와 실생활 적용을 강화해주세요.',
        targetSection: 'FULL',
      });
      const after = r.data;
      // 변경 사항 비교
      const changes: string[] = [];
      if (before.title !== after.title) changes.push('제목이 수정되었습니다');
      if (before.introduction !== after.introduction) changes.push('서론이 개선되었습니다');
      before.outline.forEach((o: any, i: number) => {
        if (after.outline[i] && o.content !== after.outline[i].content) changes.push(`대지 ${i + 1} "${o.title}"이 수정되었습니다`);
      });
      if (before.application !== after.application) changes.push('적용이 개선되었습니다');
      if (before.conclusion !== after.conclusion) changes.push('결론이 수정되었습니다');
      if (changes.length === 0) changes.push('전체적인 문체와 표현이 다듬어졌습니다');
      setSermon(after);
      setReviewResult({ before, after, changes });
    } catch (e: any) { toast('error', e?.response?.data?.message || 'AI 검토에 실패했습니다'); }
    finally { clearInterval(timer); setReviewLoading(false); setReviewSec(0); }
  };

  const Section = ({ k, label, text, bg = '', enrich = false }: { k: string; label: string; text: string; bg?: string; enrich?: boolean }) => (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {label && <h2 className="text-sm font-bold text-[#0F1A2E] uppercase tracking-wider">{label}</h2>}
        {enrich && (
          <button onClick={() => handleEnrich(parseInt(k.split('_')[1]))} disabled={!!enrichLoading}
            className="text-xs text-[#0F1A2E] px-3 py-1.5 bg-[#FFF8E7] border border-[#C9A84C]/30 rounded-xl hover:bg-[#C9A84C]/20 disabled:opacity-50 flex items-center gap-1.5 font-medium transition-colors">
            {enrichLoading === k ? (
              <><span className="w-3 h-3 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" /> 적용중 {enrichSec}초</>
            ) : (
              <><svg className="w-3.5 h-3.5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> 예화 추가</>
            )}
          </button>
        )}
      </div>
      {editingKey === k ? (
        <div className="space-y-2">
          <textarea className="input text-[15px] leading-[1.9] resize-none" rows={8} value={editVal} onChange={e => setEditVal(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? '저장중...' : '저장'}</button>
            <button onClick={() => setEditingKey('')} className="btn-secondary px-4 py-2 text-sm">취소</button>
          </div>
        </div>
      ) : (
        <div onClick={() => startEdit(k, text)} className={`${bg || 'bg-white'} card p-4 sm:p-5 cursor-pointer group`}>
          <p className="text-gray-700 text-[15px] leading-[1.9] whitespace-pre-line">{text}</p>
          <p className="text-[10px] text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 편집</p>
        </div>
      )}
    </section>
  );

  return (
    <div className="pb-8">
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-3 sticky top-0 z-10 relative overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.05]">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#C9A84C"><path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z"/></svg>
        </div>
        <div className="max-w-3xl mx-auto flex items-center justify-between relative">
          <button onClick={() => router.push('/sermons')} className="text-[#8B9DC3] text-sm hover:text-white">← 목록</button>
          <div className="text-center">
            <span className="text-xs sm:text-sm text-[#C9A84C]">{WL[sermon.worshipType]} · {dateStr}</span>
            {autoSaveStatus === 'saved' && <p className="text-[10px] text-[#5A6F8C]">자동 저장됨</p>}
          </div>
          <HelpButton pageKey="sermonDetail" steps={HELP_DATA.sermonDetail} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:flex lg:gap-8">
          {/* ═══ 좌측: 설교 본문 (읽기 영역) ═══ */}
          <main className="lg:flex-1 lg:max-w-3xl">
            {/* 성경 본문 */}
            <div className="bg-[#0F1A2E] rounded-2xl p-5 sm:p-6 mb-6">
              <span className="text-[#C9A84C] font-semibold text-sm">📖 {sermon.scripture}</span>
              {sermon.scriptureText ? (
                <div className="text-sm text-[#D1D5DB] leading-[1.9] whitespace-pre-line border-l-2 border-[#C9A84C]/40 pl-4 mt-3">{sermon.scriptureText}</div>
              ) : (
                <p className="text-sm text-[#5A6F8C] italic mt-2">성경 원문은 새로 생성한 설교에서 표시됩니다.</p>
              )}
            </div>

            {/* 제목 */}
            {editingKey === 'title' ? (
              <div className="mb-6 space-y-2">
                <input className="input text-2xl font-bold p-3" value={editVal} onChange={e => setEditVal(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="btn-primary px-4 py-2 text-sm">{saving ? '저장중...' : '저장'}</button>
                  <button onClick={() => setEditingKey('')} className="btn-secondary px-4 py-2 text-sm">취소</button>
                </div>
              </div>
            ) : (
              <h1 onClick={() => startEdit('title', sermon.title)} className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-6 cursor-pointer hover:text-[#C9A84C] transition-colors">{sermon.title}</h1>
            )}

            <Section k="summary" label="" text={sermon.summary} />
            <Section k="introduction" label="서론" text={sermon.introduction} />
            {sermon.outline.map((p, i) => <Section key={i} k={`outline_${i}`} label={`${p.point}. ${p.title}`} text={p.content} enrich={true} />)}
            <Section k="application" label="적용" text={sermon.application} bg="bg-amber-50/50 border-amber-100" />
            <Section k="conclusion" label="결론" text={sermon.conclusion} />

        {/* 참고자료 */}
        {sermon.citations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              참고자료
            </h2>
            <div className="bg-[#FAFAF8] rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600">
                {sermon.citations[0].author}, &ldquo;{sermon.citations[0].title}&rdquo;
                {sermon.citations.length > 1 && <span className="text-gray-400"> 등 {sermon.citations.length}건 참고</span>}
              </p>
            </div>
          </section>
        )}
          </main>

          {/* ═══ 우측: 액션 패널 (데스크톱에서 sticky) ═══ */}
          <aside className="lg:w-[280px] lg:flex-shrink-0 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-16 space-y-4">

        {/* ── 저장 ── */}
        <div className="card p-4">
          <button onClick={handleSave} disabled={saving} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {/* ── 내보내기 ── */}
        <div className="card p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">내보내기</p>
          <div className="space-y-2">
            <button onClick={handlePptPrompt} className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              PPT 프롬프트
            </button>
            <button onClick={handleExportPdf} className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              PDF 저장 및 보기
            </button>
            <button onClick={handleShare} className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              공유
            </button>
          </div>
        </div>

        {/* ── AI 도구 ── */}
        <div className="card p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">AI 도구</p>
          {/* AI 최종검토 */}
          {reviewLoading ? (
            <div className="py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                <span className="text-xs font-semibold text-[#C9A84C]">검토 중...</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div className="bg-[#C9A84C] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(95, (reviewSec / 60) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-gray-400">{reviewSec}초 경과</p>
            </div>
          ) : (
            <button onClick={handleFinalReview} disabled={sermon.regenerationCount >= 5 || regenLoading}
              className="btn-gold w-full py-2.5 text-xs flex items-center justify-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              AI 최종검토
            </button>
          )}
          {/* AI 수정 요청 */}
          <button onClick={() => setRegenOpen(!regenOpen)} className="w-full py-2.5 btn-secondary text-xs flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            수정 요청 {sermon.regenerationCount > 0 && <span className="text-[#C9A84C]">({sermon.regenerationCount}/5)</span>}
          </button>
          {regenOpen && (
            <div className="mt-3 space-y-2">
              <select value={regenSection} onChange={e => setRegenSection(e.target.value)} className="input text-xs py-2">
                <option value="FULL">전체</option><option value="INTRODUCTION">서론</option>
                <option value="OUTLINE_1">대지 1</option><option value="OUTLINE_2">대지 2</option><option value="OUTLINE_3">대지 3</option>
                <option value="APPLICATION">적용</option><option value="CONCLUSION">결론</option>
              </select>
              <textarea value={regenFeedback} onChange={e => setRegenFeedback(e.target.value)} className="input text-xs resize-none" rows={2} maxLength={500} placeholder="예: 결론을 더 따뜻하게" />
              <button onClick={handleRegen} disabled={regenLoading || reviewLoading || !regenFeedback.trim() || sermon.regenerationCount >= 5}
                className="btn-primary w-full py-2 text-xs">
                {regenLoading ? '재생성 중...' : '재생성'}
              </button>
            </div>
          )}
        </div>

        {/* AI 검토 결과 */}
        {reviewResult && (
          <div className="card p-4 border-[#C9A84C]/30">
            <p className="text-xs font-bold text-[#0F1A2E] mb-2">검토 결과</p>
            <div className="space-y-1 mb-3">
              {reviewResult.changes.map((c, i) => (
                <p key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                  <span className="text-[#C9A84C] mt-0.5">✓</span> {c}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSermon(reviewResult.before as any); setReviewResult(null); }}
                className="btn-secondary flex-1 py-2 text-[11px]">되돌리기</button>
              <button onClick={() => setReviewResult(null)}
                className="btn-primary flex-1 py-2 text-[11px]">유지</button>
            </div>
          </div>
        )}

        {/* ── 피드백 ── */}
        {!feedbackOpen && !feedbackSent && (
          <div className="card p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">피드백</p>
            <div className="flex gap-2">
              {[
                { val: 'good', emoji: '👍' },
                { val: 'neutral', emoji: '😐' },
                { val: 'bad', emoji: '📝' },
              ].map(r => (
                <button key={r.val} onClick={() => { setFeedbackRating(r.val); setFeedbackOpen(true); }}
                  className="flex-1 py-2.5 rounded-xl text-lg bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.95]">
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {feedbackOpen && (
          <div className="card p-4">
            {feedbackSent ? (
              <p className="text-xs text-center text-gray-500 py-2">감사합니다 🙏</p>
            ) : (
              <>
                <div className="flex gap-1.5 mb-2">
                  {[
                    { val: 'good', label: '만족' },
                    { val: 'neutral', label: '보통' },
                    { val: 'bad', label: '불만족' },
                  ].map(r => (
                    <button key={r.val} onClick={() => setFeedbackRating(r.val)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${feedbackRating === r.val ? 'bg-[#0F1A2E] text-[#C9A84C]' : 'bg-gray-50 text-gray-500'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea className="input text-xs resize-none mb-2" rows={2} maxLength={500} placeholder="의견을 남겨주세요" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => { setFeedbackOpen(false); setFeedbackRating(''); }} className="btn-secondary flex-1 py-2 text-xs">취소</button>
                  <button onClick={handleSermonFeedback} className="btn-gold flex-1 py-2 text-xs">보내기</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 하단 네비 ── */}
        <div className="space-y-2">
          <button onClick={() => router.push('/sermons/new')} className="btn-gold w-full py-3 text-sm">새 설교</button>
          <div className="flex gap-2">
            <button onClick={() => router.push('/home')} className="btn-secondary flex-1 py-2.5 text-xs">홈</button>
            <button onClick={() => setShowDelete(true)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-all">삭제</button>
          </div>
        </div>

            </div>{/* sticky wrapper end */}
          </aside>{/* aside end */}
        </div>{/* flex end */}
      </div>{/* max-w container end */}

      <PageHelp pageKey="sermonDetail" steps={HELP_DATA.sermonDetail} />

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-2">삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-4">복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white">삭제</button>
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 rounded-lg bg-gray-100">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
