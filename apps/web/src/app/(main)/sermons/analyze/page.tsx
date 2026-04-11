'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface AnalysisResult {
  deliveryLabel: string;
  deliveryScore: string;
  structureEval: string;
  suggestions: string[];
}

interface ImprovedSermon {
  title: string;
  scripture: string;
  summary: string;
  introduction: string;
  outline: Array<{ point: number; title: string; content: string }>;
  application: string;
  conclusion: string;
  improvements: string[];
}

export default function SermonAnalyzePage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [improvingLoading, setImprovingLoading] = useState(false);
  const [improvedSermon, setImprovedSermon] = useState<ImprovedSermon | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    setUploadedFileName(file.name);

    // TXT는 클라이언트에서 직접 처리
    if (file.name.endsWith('.txt') || file.type === 'text/plain') {
      setText(await file.text());
      setUploading(false);
      return;
    }

    // PDF, Word, 한글 등은 서버에서 파싱
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/sermons/analyze/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText(data.text);
    } catch (err: any) {
      setError(err.response?.data?.message || '파일 처리에 실패했습니다');
      setUploadedFileName('');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (text.trim().length < 100) { setError('최소 100자 이상 입력해주세요'); return; }
    setError(''); setLoading(true); setResult(null); setImprovedSermon(null); setSavedId(null);
    try {
      const { data } = await api.post('/sermons/analyze', { text });
      setResult(data);
    } catch (err: any) { setError(err.response?.data?.message || '분석 실패'); }
    finally { setLoading(false); }
  };

  const handleImprove = async () => {
    if (!result) return;
    setImprovingLoading(true);
    try {
      const { data } = await api.post('/sermons/analyze/improve', { originalText: text, suggestions: result.suggestions });
      setImprovedSermon(data);
    } catch (err: any) { toast('error', err.response?.data?.message || '개선에 실패했습니다'); }
    finally { setImprovingLoading(false); }
  };

  const handleSave = async () => {
    if (!improvedSermon) return;
    try {
      const { data } = await api.post('/sermons/save-improved', improvedSermon);
      setSavedId(data.id);
      toast('success', '저장되었습니다');
    } catch { toast('error', '저장에 실패했습니다'); }
  };

  const handlePpt = async () => {
    if (!savedId) { toast('info', '먼저 저장해주세요'); return; }
    const res = await api.get(`/sermons/${savedId}/ppt`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([res.data]));
    a.download = `개선_${improvedSermon?.title}.pptx`; a.click();
  };

  const handlePdf = () => {
    if (!savedId) { toast('info', '먼저 저장해주세요'); return; }
    const token = localStorage.getItem('accessToken');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/sermons/${savedId}/pdf?token=${token}`, '_blank');
  };

  const scoreColor: Record<string, string> = {
    '좋음': 'bg-green-50 text-green-700 border-green-200',
    '보통': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    '약함': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/home')} className="text-gray-500 hover:text-gray-700">← 홈</button>
          <h1 className="text-lg font-semibold">설교 분석 & 개선</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 입력 영역 */}
        {!improvedSermon && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">설교문 입력</h2>
            <p className="text-sm text-gray-500 mb-4">설교 원고를 붙여넣거나 파일을 업로드하세요 (PDF, Word, 텍스트 지원)</p>

            <div className="flex gap-2 mb-3">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50">
                {uploading ? '📄 업로드 중...' : '📄 파일 업로드'}
              </button>
              <input ref={fileInputRef} type="file"
                accept=".txt,.pdf,.docx,.doc,.hwp,.hwpx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileUpload} className="hidden" />
              {uploadedFileName && (
                <span className="text-xs text-green-600 self-center">✓ {uploadedFileName}</span>
              )}
            </div>

            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="설교문 전체를 여기에 붙여넣으세요 (최소 100자)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
              rows={8} />

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">{text.length}자</span>
              <button onClick={handleAnalyze} disabled={loading || text.length < 100}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                {loading ? '분석 중...' : '🔍 분석하기'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* 분석 결과 */}
        {result && !improvedSermon && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">전달력</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${scoreColor[result.deliveryLabel] || ''}`}>
                  {result.deliveryLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600">{result.deliveryScore}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-2">구조</h3>
              <p className="text-sm text-gray-600">{result.structureEval}</p>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <h3 className="font-semibold text-blue-900 mb-3">💡 개선 제안</h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">{i + 1}.</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={handleImprove} disabled={improvingLoading}
              className="w-full py-4 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300">
              {improvingLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI가 개선된 설교를 작성 중...
                </span>
              ) : '✨ AI 개선된 설교 보기'}
            </button>
          </div>
        )}

        {/* 개선된 설교 */}
        {improvedSermon && (
          <div className="space-y-4">
            {/* 개선 요약 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-semibold text-green-900 mb-3">✅ 개선된 부분</h3>
              <ul className="space-y-1.5">
                {(improvedSermon.improvements || []).map((s, i) => (
                  <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* 개선된 설교 본문 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="text-sm text-blue-600 font-medium mb-2">📖 {improvedSermon.scripture}</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{improvedSermon.title}</h2>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-5">
                <p className="text-sm text-gray-700">{improvedSermon.summary}</p>
              </div>

              <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">서론</h3>
                  <p className="whitespace-pre-line">{improvedSermon.introduction}</p>
                </div>
                {improvedSermon.outline.map((p) => (
                  <div key={p.point}>
                    <h3 className="font-semibold text-gray-900 mb-2 text-base flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{p.point}</span>
                      {p.title}
                    </h3>
                    <p className="whitespace-pre-line">{p.content}</p>
                  </div>
                ))}
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">적용</h3>
                  <p className="whitespace-pre-line">{improvedSermon.application}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">결론</h3>
                  <p className="whitespace-pre-line">{improvedSermon.conclusion}</p>
                </div>
              </div>
            </div>

            {/* 액션 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={handleSave} disabled={!!savedId}
                className={`py-3 rounded-xl text-sm font-semibold ${savedId ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                {savedId ? '✓ 저장됨' : '💾 저장'}
              </button>
              <button onClick={handlePpt}
                className="py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700">
                PPT
              </button>
              <button onClick={handlePdf}
                className="py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
                PDF
              </button>
              <button onClick={() => { setImprovedSermon(null); setResult(null); setText(''); setSavedId(null); }}
                className="py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                새 분석
              </button>
            </div>

            {savedId && (
              <button onClick={() => router.push(`/sermons/${savedId}`)}
                className="w-full py-3 rounded-xl text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50">
                저장된 설교 보러가기 →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
