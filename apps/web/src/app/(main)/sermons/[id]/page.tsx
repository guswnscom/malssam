'use client';

import { useEffect, useState, useCallback } from 'react';
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

const WORSHIP_LABEL: Record<string, string> = {
  SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배', DAWN: '새벽예배', SPECIAL: '특별예배',
};
const SECTIONS = [
  { value: 'FULL', label: '전체' },
  { value: 'INTRODUCTION', label: '서론' },
  { value: 'OUTLINE_1', label: '대지 1' },
  { value: 'OUTLINE_2', label: '대지 2' },
  { value: 'OUTLINE_3', label: '대지 3' },
  { value: 'APPLICATION', label: '적용' },
  { value: 'CONCLUSION', label: '결론' },
];

export default function SermonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [sermon, setSermon] = useState<SermonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 재생성
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [regenSection, setRegenSection] = useState('FULL');
  const [regenLoading, setRegenLoading] = useState(false);

  // 삭제
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    api.get(`/sermons/${params.id}`).then(({ data }) => setSermon(data))
      .catch((err) => setError(err.response?.data?.message || '설교를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const startEdit = (section: string, currentValue: string) => {
    setEditingSection(section);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!sermon || !editingSection) return;
    setSaving(true);
    try {
      const updateData: any = {};
      if (editingSection === 'title') updateData.title = editValue;
      else if (editingSection === 'summary') updateData.summary = editValue;
      else if (editingSection === 'introduction') updateData.introduction = editValue;
      else if (editingSection === 'application') updateData.application = editValue;
      else if (editingSection === 'conclusion') updateData.conclusion = editValue;
      else if (editingSection.startsWith('outline_')) {
        const idx = parseInt(editingSection.split('_')[1]);
        const newOutline = [...sermon.outline];
        newOutline[idx] = { ...newOutline[idx], content: editValue };
        updateData.outline = newOutline;
      }
      const { data } = await api.put(`/sermons/${sermon.id}`, updateData);
      setSermon(data);
      setEditingSection(null);
      setSaved(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!sermon || !regenFeedback.trim()) return;
    setRegenLoading(true);
    try {
      const { data } = await api.post(`/sermons/${sermon.id}/regenerate`, {
        feedback: regenFeedback,
        targetSection: regenSection,
      });
      setSermon(data);
      setRegenFeedback('');
      setRegenOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '재생성에 실패했습니다');
    } finally {
      setRegenLoading(false);
    }
  };

  const handlePdf = () => {
    if (!sermon) return;
    const token = localStorage.getItem('accessToken');
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/sermons/${sermon.id}/pdf?token=${token}`,
      '_blank',
    );
  };

  const handlePpt = async () => {
    if (!sermon) return;
    try {
      const response = await api.get(`/sermons/${sermon.id}/ppt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `설교_${sermon.title}.pptx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('PPT 생성에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!sermon) return;
    try {
      await api.delete(`/sermons/${sermon.id}`);
      router.push('/sermons');
    } catch {
      alert('삭제에 실패했습니다');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><p className="text-gray-500">로딩 중...</p></div>;
  if (error || !sermon) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-red-500 mb-4">{error || '설교를 찾을 수 없습니다'}</p>
      <button onClick={() => router.push('/home')} className="text-blue-600 hover:underline">홈으로</button>
    </div>
  );

  const dateStr = new Date(sermon.targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 편집 가능 섹션 컴포넌트
  const EditableSection = ({ sectionKey, label, content, color = 'blue' }: { sectionKey: string; label: string; content: string; color?: string }) => {
    const isEditing = editingSection === sectionKey;
    const bgColors: Record<string, string> = { blue: 'bg-white', amber: 'bg-amber-50 border-amber-100', green: 'bg-white' };
    return (
      <section className="mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{label}</h2>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full p-4 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
              rows={8} value={editValue} onChange={(e) => setEditValue(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditingSection(null)} className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">취소</button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => startEdit(sectionKey, content)}
            className={`${bgColors[color] || 'bg-white'} rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group`}
          >
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{content}</p>
            <p className="text-xs text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 편집</p>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="bg-gray-50 pb-8">
      {/* 상단 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/sermons')} className="text-gray-500 hover:text-gray-700 text-sm">← 목록</button>
          <span className="text-xs sm:text-sm text-gray-500">{WORSHIP_LABEL[sermon.worshipType]} · {dateStr}</span>
          <div className="flex gap-2 items-center">
            <button
              onClick={async () => {
                if (!sermon) return;
                setSaving(true);
                try {
                  await api.put(`/sermons/${sermon.id}`, {
                    title: sermon.title, summary: sermon.summary,
                    introduction: sermon.introduction, outline: sermon.outline,
                    application: sermon.application, conclusion: sermon.conclusion,
                  });
                  setSaved(true);
                  alert('저장되었습니다');
                } catch { alert('저장 실패'); } finally { setSaving(false); }
              }}
              disabled={saving}
              className="text-xs sm:text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium disabled:bg-green-300"
            >
              {saving ? '저장 중...' : '💾 저장'}
            </button>
            <button onClick={handlePpt} className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">PPT</button>
            <button onClick={handlePdf} className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">PDF</button>
            <button onClick={() => setDeleteConfirm(true)} className="text-xs sm:text-sm text-red-400 hover:text-red-600">삭제</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* 성경 본문 표시 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold text-sm">📖 {sermon.scripture}</span>
          </div>
          {sermon.scriptureText ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line border-l-4 border-blue-300 pl-3 mt-2">
              {sermon.scriptureText}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic leading-relaxed">
              성경 원문은 새로 생성한 설교에서 표시됩니다.
            </p>
          )}
        </div>

        {/* 제목 (편집 가능) */}
        {editingSection === 'title' ? (
          <div className="mb-4 space-y-2">
            <input className="w-full text-2xl font-bold p-2 border border-blue-300 rounded-lg outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">{saving ? '저장 중...' : '저장'}</button>
              <button onClick={() => setEditingSection(null)} className="text-gray-500 px-4 py-2 text-sm">취소</button>
            </div>
          </div>
        ) : (
          <h1
            onClick={() => startEdit('title', sermon.title)}
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-blue-800 transition-colors"
          >
            {sermon.title}
          </h1>
        )}

        {/* 요약 */}
        <EditableSection sectionKey="summary" label="" content={sermon.summary} />

        {/* 서론 */}
        <EditableSection sectionKey="introduction" label="서론" content={sermon.introduction} />

        {/* 대지 */}
        {sermon.outline.map((point, idx) => (
          <EditableSection
            key={idx}
            sectionKey={`outline_${idx}`}
            label={`${point.point}. ${point.title}`}
            content={point.content}
          />
        ))}

        {/* 적용 */}
        <EditableSection sectionKey="application" label="적용" content={sermon.application} color="amber" />

        {/* 결론 */}
        <EditableSection sectionKey="conclusion" label="결론" content={sermon.conclusion} color="green" />

        {/* 참고자료 */}
        {sermon.citations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">참고자료</h2>
            <div className="bg-gray-100 rounded-xl p-4 space-y-1">
              {sermon.citations.map((c) => (
                <div key={c.id} className="text-sm text-gray-600">
                  <span className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded mr-2">{c.type === 'REFERENCE' ? '참고' : '배경'}</span>
                  {c.author}, &ldquo;{c.title}&rdquo;
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 재생성 패널 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <button onClick={() => setRegenOpen(!regenOpen)} className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            <span>🔄 AI 수정 요청 {sermon.regenerationCount > 0 && `(${sermon.regenerationCount}/5)`}</span>
            <span className="text-gray-400">{regenOpen ? '닫기' : '열기'}</span>
          </button>
          {regenOpen && (
            <div className="mt-4 space-y-3">
              <select
                value={regenSection} onChange={(e) => setRegenSection(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <textarea
                value={regenFeedback} onChange={(e) => setRegenFeedback(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3} maxLength={500}
                placeholder="예: 결론을 더 따뜻하고 위로하는 톤으로 바꿔줘"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{regenFeedback.length}/500</span>
                <button
                  onClick={handleRegenerate}
                  disabled={regenLoading || !regenFeedback.trim() || sermon.regenerationCount >= 5}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {regenLoading ? '재생성 중...' : '재생성'}
                </button>
              </div>
              {sermon.regenerationCount >= 5 && (
                <p className="text-xs text-red-500">재생성 한도(5회)에 도달했습니다. 직접 편집을 이용해주세요.</p>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/sermons/new')} className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700">새 설교 만들기</button>
          <button onClick={() => router.push('/home')} className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200">홈</button>
        </div>
      </main>

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-2">설교를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-4">삭제된 설교는 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">삭제</button>
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
