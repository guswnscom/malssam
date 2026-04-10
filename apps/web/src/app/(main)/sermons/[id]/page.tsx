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
    try {
      const pt = sermon.outline[idx];
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, {
        feedback: `"${pt.title}" 대지에 실생활 예화, 역사적 사례, 현재 사회 상황과 연결되는 구체적인 이야기를 추가해주세요. 본문 "${sermon.scripture}"과 연결되어야 합니다.`,
        targetSection: `OUTLINE_${idx + 1}`,
      });
      setSermon(r.data);
    } catch (e: any) { alert(e?.response?.data?.message || '예화 추가 실패'); }
    finally { setEnrichLoading(''); }
  };

  const handlePpt = async () => {
    try {
      const r = await api.get(`/sermons/${sermon.id}/ppt`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([r.data]));
      a.download = `${sermon.title}.pptx`; a.click();
    } catch { alert('PPT 실패'); }
  };

  const handlePdf = () => {
    const t = localStorage.getItem('accessToken');
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/sermons/${sermon.id}/pdf?token=${t}`, '_blank');
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
    setRegenLoading(true);
    try {
      const r = await api.post(`/sermons/${sermon.id}/regenerate`, {
        feedback: '전체 설교를 최종 검토해주세요. 전달력, 구조, 자연스러움을 개선하고 주석보다 강단 전달 중심으로 다듬어주세요.',
        targetSection: 'FULL',
      });
      setSermon(r.data);
      alert('AI 최종검토 완료');
    } catch (e: any) { alert(e?.response?.data?.message || 'AI 검토 실패'); }
    finally { setRegenLoading(false); }
  };

  const Section = ({ k, label, text, bg = '', enrich = false }: { k: string; label: string; text: string; bg?: string; enrich?: boolean }) => (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{label}</h2>
        {enrich && (
          <button onClick={() => handleEnrich(parseInt(k.split('_')[1]))} disabled={enrichLoading === k}
            className="text-xs text-amber-600 px-2 py-1 border border-amber-200 rounded-lg hover:bg-amber-50 disabled:opacity-50">
            {enrichLoading === k ? '✨ 적용중...' : '✨ 예화 포함'}
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
        <div onClick={() => startEdit(k, text)} className={`${bg || 'bg-white'} rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-blue-200 transition-all group`}>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{text}</p>
          <p className="text-xs text-gray-300 mt-2 opacity-0 group-hover:opacity-100">클릭하여 편집</p>
        </div>
      )}
    </section>
  );

  return (
    <div className="bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/sermons')} className="text-gray-500 text-sm">← 목록</button>
          <span className="text-xs sm:text-sm text-gray-500">{WL[sermon.worshipType]} · {dateStr}</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* 성경 본문 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5 mb-5">
          <span className="text-blue-600 font-semibold text-sm">📖 {sermon.scripture}</span>
          {sermon.scriptureText ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line border-l-4 border-blue-300 pl-3 mt-2">{sermon.scriptureText}</div>
          ) : (
            <p className="text-sm text-gray-500 italic mt-1">성경 원문은 새로 생성한 설교에서 표시됩니다.</p>
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
            <h2 className="text-sm font-semibold text-gray-500 mb-2">참고자료</h2>
            <div className="bg-gray-100 rounded-xl p-4 space-y-1">
              {sermon.citations.map(c => (
                <div key={c.id} className="text-sm text-gray-600">
                  <span className="bg-gray-200 text-xs px-2 py-0.5 rounded mr-2">{c.type === 'REFERENCE' ? '참고' : '배경'}</span>
                  {c.author}, &ldquo;{c.title}&rdquo;
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI 수정 요청 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <button onClick={() => setRegenOpen(!regenOpen)} className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            <span>🔄 AI 수정 요청 {sermon.regenerationCount > 0 && `(${sermon.regenerationCount}/5)`}</span>
            <span className="text-gray-400">{regenOpen ? '닫기' : '열기'}</span>
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <button onClick={handleSave} disabled={saving} className="py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300">
              {saving ? '저장중...' : '💾 저장'}
            </button>
            <button onClick={handlePpt} className="py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700">PPT</button>
            <button onClick={handlePdf} className="py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">PDF</button>
            <button onClick={() => setShowDelete(true)} className="py-2.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50">삭제</button>
          </div>
          <button onClick={handleFinalReview} disabled={regenLoading || sermon.regenerationCount >= 5}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300">
            {regenLoading ? '🔍 검토중...' : '🔍 AI 최종검토'}
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push('/sermons/new')} className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700">새 설교</button>
          <button onClick={() => router.push('/home')} className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200">홈</button>
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
