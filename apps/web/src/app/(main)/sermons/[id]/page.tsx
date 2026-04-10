'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

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
  const [enrichLoading, setEnrichLoading] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ before: SermonData; after: SermonData; changes: string[] } | null>(null);
  const [reviewSec, setReviewSec] = useState(0);
  const [enrichSec, setEnrichSec] = useState(0);

  const sid = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  useEffect(() => {
    if (!sid) { setError('ID 없음'); setLoading(false); return; }
    api.get(`/sermons/${sid}`)
      .then(r => setSermon(r.data))
      .catch(e => setError(e?.response?.data?.message || '설교를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [sid]);

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
    } catch { alert('저장 실패'); }
    finally { setSaving(false); }
  };

  const handleRegen = async () => {
    if (!sermon || !regenFeedback.trim()) return;
    setRegenLoading(true);
    try {
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, { feedback: regenFeedback, targetSection: regenSection });
      setSermon(r.data); setRegenFeedback(''); setRegenOpen(false);
    } catch (e: any) { alert(e?.response?.data?.message || '재생성 실패'); }
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
    } catch (e: any) { alert(e?.response?.data?.message || '예화 추가 실패'); }
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
  };

  const handlePdf = () => {
    const t = localStorage.getItem('accessToken');
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/sermons/${sermon.id}/pdf?token=${t}`, '_blank');
  };

  const handleExportPdf = async () => {
    // PDF를 다운로드 가능한 형태로 저장
    const t = localStorage.getItem('accessToken');
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/sermons/${sermon.id}/pdf?token=${t}`;
    // 새 창에서 열어서 인쇄/저장 가능하게
    const w = window.open(url, '_blank');
    if (w) {
      // 페이지 로드 후 인쇄 다이얼로그 자동 실행 (PDF 저장 가능)
      setTimeout(() => { try { w.print(); } catch {} }, 2000);
    }
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
      alert('설교 요약이 클립보드에 복사되었습니다. 메신저나 이메일에 붙여넣기 하세요.');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('설교 요약이 클립보드에 복사되었습니다.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/sermons/${sermon.id}`, {
        title: sermon.title, summary: sermon.summary, introduction: sermon.introduction,
        outline: sermon.outline, application: sermon.application, conclusion: sermon.conclusion,
      });
      alert('저장되었습니다');
    } catch { alert('저장 실패'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/sermons/${sermon.id}`); router.push('/sermons'); } catch { alert('삭제 실패'); }
  };

  const handleFinalReview = async () => {
    if (!sermon) return;
    const before = { ...sermon };
    setRegenLoading(true);
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
    } catch (e: any) { alert(e?.response?.data?.message || 'AI 검토 실패'); }
    finally { clearInterval(timer); setRegenLoading(false); setReviewSec(0); }
  };

  const Section = ({ k, label, text, bg = '', enrich = false }: { k: string; label: string; text: string; bg?: string; enrich?: boolean }) => (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{label}</h2>
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
          <textarea className="w-full p-4 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" rows={8} value={editVal} onChange={e => setEditVal(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:bg-blue-300">{saving ? '저장중...' : '저장'}</button>
            <button onClick={() => setEditingKey('')} className="text-gray-500 px-4 py-2 text-sm">취소</button>
          </div>
        </div>
      ) : (
        <div onClick={() => startEdit(k, text)} className={`${bg || 'bg-white'} rounded-2xl border border-gray-100 p-4 sm:p-5 cursor-pointer hover:border-[#C9A84C]/30 hover:shadow-sm transition-all group`}>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{text}</p>
          <p className="text-xs text-gray-300 mt-2 opacity-0 group-hover:opacity-100">클릭하여 편집</p>
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
          <span className="text-xs sm:text-sm text-[#C9A84C]">{WL[sermon.worshipType]} · {dateStr}</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* 성경 본문 */}
        <div className="bg-[#0F1A2E] rounded-2xl p-5 sm:p-6 mb-6">
          <span className="text-[#C9A84C] font-semibold text-sm">📖 {sermon.scripture}</span>
          {sermon.scriptureText ? (
            <div className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line border-l-2 border-[#C9A84C]/40 pl-3 mt-3">{sermon.scriptureText}</div>
          ) : (
            <p className="text-sm text-[#5A6F8C] italic mt-2">성경 원문은 새로 생성한 설교에서 표시됩니다.</p>
          )}
        </div>

        {/* 제목 */}
        {editingKey === 'title' ? (
          <div className="mb-4 space-y-2">
            <input className="w-full text-2xl font-bold p-2 border border-blue-300 rounded-lg" value={editVal} onChange={e => setEditVal(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">저장</button>
              <button onClick={() => setEditingKey('')} className="text-gray-500 px-4 py-2 text-sm">취소</button>
            </div>
          </div>
        ) : (
          <h1 onClick={() => startEdit('title', sermon.title)} className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-blue-800">{sermon.title}</h1>
        )}

        <Section k="summary" label="" text={sermon.summary} />
        <Section k="introduction" label="서론" text={sermon.introduction} />
        {sermon.outline.map((p, i) => <Section key={i} k={`outline_${i}`} label={`${p.point}. ${p.title}`} text={p.content} enrich={true} />)}
        <Section k="application" label="적용" text={sermon.application} bg="bg-amber-50 border-amber-100" />
        <Section k="conclusion" label="결론" text={sermon.conclusion} />

        {/* 참고자료 */}
        {sermon.citations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              참고자료
            </h2>
            <div className="bg-[#FAFAF8] rounded-2xl p-4 space-y-2 border border-gray-100">
              {sermon.citations.map(c => (
                <div key={c.id} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="bg-[#0F1A2E] text-[#C9A84C] text-[10px] px-2 py-0.5 rounded-lg font-medium flex-shrink-0 mt-0.5">{c.type === 'REFERENCE' ? '참고' : '배경'}</span>
                  {c.author}, &ldquo;{c.title}&rdquo;
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI 수정 요청 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
          <button onClick={() => setRegenOpen(!regenOpen)} className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              AI 수정 요청 {sermon.regenerationCount > 0 && <span className="text-[#C9A84C] text-xs">({sermon.regenerationCount}/5)</span>}
            </span>
            <span className="text-gray-400 text-xs">{regenOpen ? '닫기' : '열기'}</span>
          </button>
          {regenOpen && (
            <div className="mt-4 space-y-3">
              <select value={regenSection} onChange={e => setRegenSection(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm">
                <option value="FULL">전체</option><option value="INTRODUCTION">서론</option>
                <option value="OUTLINE_1">대지 1</option><option value="OUTLINE_2">대지 2</option><option value="OUTLINE_3">대지 3</option>
                <option value="APPLICATION">적용</option><option value="CONCLUSION">결론</option>
              </select>
              <textarea value={regenFeedback} onChange={e => setRegenFeedback(e.target.value)} className="w-full px-3 py-3 rounded-lg border text-sm resize-none" rows={3} maxLength={500} placeholder="예: 결론을 더 따뜻하게" />
              <button onClick={handleRegen} disabled={regenLoading || !regenFeedback.trim() || sermon.regenerationCount >= 5}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:bg-blue-300">
                {regenLoading ? '재생성 중...' : '재생성'}
              </button>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            <button onClick={handleSave} disabled={saving} className="py-2.5 rounded-xl text-sm font-semibold bg-[#0F1A2E] text-white hover:bg-[#1B2D4A] disabled:bg-gray-300">
              {saving ? '저장중...' : '💾 저장'}
            </button>
            <button onClick={handlePptPrompt} className="py-2.5 rounded-xl text-sm font-semibold bg-[#C9A84C] text-[#0F1A2E] hover:bg-[#D4B85C]" title="Gemini/GPT에서 PPT를 만드세요">PPT 프롬프트</button>
            <button onClick={handlePdf} className="py-2.5 rounded-xl text-sm font-semibold bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE] border border-[#BFDBFE]">PDF 보기</button>
            <button onClick={handleExportPdf} className="py-2.5 rounded-xl text-sm font-semibold bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] border border-[#A7F3D0]">📥 PDF 저장</button>
            <button onClick={handleShare} className="py-2.5 rounded-xl text-sm font-semibold bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE] border border-[#C4B5FD]">📤 공유</button>
            <button onClick={() => setShowDelete(true)} className="py-2.5 rounded-xl text-sm font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]">삭제</button>
          </div>
          {regenLoading ? (
            <div className="w-full py-4 rounded-lg bg-purple-50 border border-purple-200 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-6 h-6 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-sm font-semibold text-purple-700">AI가 검토 중입니다...</span>
              </div>
              <div className="w-48 mx-auto bg-purple-200 rounded-full h-2 mb-1">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(95, (reviewSec / 60) * 100)}%` }} />
              </div>
              <p className="text-xs text-purple-500">경과: {reviewSec}초 | 평균 30~60초</p>
            </div>
          ) : (
            <button onClick={handleFinalReview} disabled={sermon.regenerationCount >= 5}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#0F1A2E] text-[#C9A84C] hover:bg-[#1B2D4A] disabled:bg-gray-300 disabled:text-gray-500 border border-[#C9A84C]/30">
              🔍 AI 최종검토
            </button>
          )}
        </div>

        {/* AI 검토 비교 결과 */}
        {reviewResult && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-purple-900 mb-3">🔍 AI 최종검토 결과</h3>
            <div className="space-y-2 mb-4">
              {reviewResult.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-purple-800">
                  <span className="text-purple-500 flex-shrink-0">✓</span> {c}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSermon(reviewResult.before as any); setReviewResult(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-purple-300 text-purple-700 hover:bg-purple-100">
                ↩ 수정 전 버전으로 되돌리기
              </button>
              <button onClick={() => setReviewResult(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">
                ✓ 수정 후 버전 유지
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push('/sermons/new')} className="flex-1 py-3 rounded-xl font-semibold bg-[#C9A84C] text-[#0F1A2E] hover:bg-[#D4B85C]">새 설교</button>
          <button onClick={() => router.push('/home')} className="px-6 py-3 rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50">홈</button>
        </div>
      </main>

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
