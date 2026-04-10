'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const WORSHIP_TYPES = [
  { value: 'SUNDAY', label: '주일예배', icon: '✝', color: 'from-[#C9A84C] to-[#8B6914]' },
  { value: 'WEDNESDAY', label: '수요예배', icon: '📖', color: 'from-[#3B82F6] to-[#1D4ED8]' },
  { value: 'FRIDAY', label: '금요예배', icon: '🙏', color: 'from-[#8B5CF6] to-[#6D28D9]' },
  { value: 'DAWN', label: '새벽예배', icon: '🕊', color: 'from-[#F59E0B] to-[#D97706]' },
  { value: 'SPECIAL', label: '특별예배', icon: '✦', color: 'from-[#EC4899] to-[#BE185D]' },
];

const DEPTHS = [
  { value: 'BRIEF', label: '간결' },
  { value: 'MODERATE', label: '보통' },
  { value: 'DEEP', label: '심층' },
];

const AUDIENCES = [
  { value: 'ALL', label: '전체' },
  { value: 'YOUTH', label: '청년' },
  { value: 'ADULT', label: '장년' },
];

export default function NewSermonPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">로딩 중...</p></div>}>
      <NewSermonPage />
    </Suspense>
  );
}

function NewSermonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const [form, setForm] = useState({
    worshipType: '',
    targetDate: new Date().toISOString().split('T')[0],
    scripture: '',
    depth: 'MODERATE',
    targetAudience: 'ALL',
    specialInstruction: '',
  });

  // URL 파라미터 처리 - 마운트 시 1회만
  useEffect(() => {
    try {
      const scriptureParam = searchParams.get('scripture');
      const hintParam = searchParams.get('hint');
      const worshipParam = searchParams.get('worshipType');
      const dateParam = searchParams.get('date');

      if (scriptureParam) {
        setForm(prev => ({ ...prev, scripture: scriptureParam }));
        setStep(2);
      }
      if (hintParam) {
        setHint(hintParam);
        setForm(prev => ({ ...prev, specialInstruction: `${hintParam} 관련 설교` }));
      }
      // 홈에서 예배 유형 선택해서 온 경우 → Step 1 건너뛰기
      if (worshipParam) {
        setForm(prev => ({
          ...prev,
          worshipType: worshipParam,
          ...(dateParam ? { targetDate: dateParam } : {}),
        }));
        if (!scriptureParam) setStep(2); // 본문 입력 단계로 바로 이동
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canNext = () => {
    if (step === 1) return form.worshipType !== '';
    if (step === 2) return form.scripture.trim() !== '';
    return true;
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/sermons/generate', {
        worshipType: form.worshipType,
        targetDate: form.targetDate,
        scripture: form.scripture,
        depth: form.depth,
        targetAudience: form.targetAudience,
        specialInstruction: form.specialInstruction || undefined,
      });

      router.push(`/sermons/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '설교 생성에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  // 로딩 시간 추적
  const [loadingSec, setLoadingSec] = useState(0);
  useEffect(() => {
    if (!loading) { setLoadingSec(0); return; }
    const timer = setInterval(() => setLoadingSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  if (loading) {
    // 예상 시간: 30~90초, 프로그레스는 시간 기반 추정
    const estimatedTotal = 60; // 평균 60초
    const progress = Math.min(95, Math.round((loadingSec / estimatedTotal) * 100));

    let statusMsg = '';
    let statusColor = 'text-gray-500';
    if (loadingSec < 15) { statusMsg = '본문을 분석하고 있습니다...'; }
    else if (loadingSec < 30) { statusMsg = '설교 구조를 설계하고 있습니다...'; }
    else if (loadingSec < 60) { statusMsg = '심화된 내용을 교리에 맞게 검토하며 초안을 작성하고 있습니다...'; statusColor = 'text-blue-600'; }
    else if (loadingSec < 120) { statusMsg = '깊이 있는 설교를 위해 더 자세히 검토 중입니다. 곧 완성됩니다...'; statusColor = 'text-amber-600'; }
    else { statusMsg = '거의 완성되었습니다. 조금만 더 기다려주세요...'; statusColor = 'text-amber-600'; }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            AI가 설교를 준비하고 있습니다
          </h2>

          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>{progress}%</span>
            <span>평균 30~60초 소요</span>
          </div>

          <p className={`text-sm ${statusColor}`}>{statusMsg}</p>

          <p className="text-xs text-gray-400 mt-4">경과 시간: {loadingSec}초</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 상단 */}
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-4 relative overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.05]">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#C9A84C"><path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z"/></svg>
        </div>
        <div className="max-w-2xl mx-auto flex items-center justify-between relative">
          <button onClick={() => router.push('/home')} className="text-[#8B9DC3] hover:text-white">
            ← 홈
          </button>
          <h1 className="text-lg font-semibold text-white">새 설교 만들기</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* 안내문 */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-[#0F1A2E] rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-xs text-[#8B9DC3] leading-relaxed">이 도구는 목사님의 설교 준비를 돕는 AI 보조 도구입니다. 최종 설교문은 반드시 직접 검토하시고 수정하여 사용해주세요.</p>
        </div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`w-8 sm:w-16 h-0.5 ${s < step ? 'bg-blue-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-8">
        {/* Step 1: 예배 선택 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">예배를 선택하세요</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {WORSHIP_TYPES.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setForm({ ...form, worshipType: w.value })}
                  className={`p-5 rounded-2xl text-center transition-all ${
                    form.worshipType === w.value
                      ? 'bg-[#0F1A2E] border-2 border-[#C9A84C] shadow-lg'
                      : 'bg-white/80 border-2 border-gray-100 hover:border-[#C9A84C]/30 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 bg-gradient-to-br ${w.color} shadow-lg`}>
                    <span className="text-xl text-white">{w.icon}</span>
                  </div>
                  <span className={`text-sm font-semibold ${form.worshipType === w.value ? 'text-[#C9A84C]' : 'text-gray-700'}`}>{w.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2: 본문 입력 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">성경 본문을 입력하세요</h2>
            {hint && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                📅 <strong>{hint}</strong> 절기에 맞는 추천 본문이 입력되었습니다
              </div>
            )}
            <input
              type="text"
              className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              placeholder="예: 요한복음 3:16-18"
              value={form.scripture}
              onChange={(e) => setForm({ ...form, scripture: e.target.value })}
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-2">
              예: 창세기 1:1-5, 시편 23편, 로마서 8:28-30
            </p>
          </div>
        )}

        {/* Step 3: 방향 설정 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">설교 방향을 설정하세요</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">깊이</label>
              <div className="flex gap-3">
                {DEPTHS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setForm({ ...form, depth: d.value })}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                      form.depth === d.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대상</label>
              <div className="flex gap-3">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setForm({ ...form, targetAudience: a.value })}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                      form.targetAudience === a.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                특별 지시 <span className="text-gray-400">(선택)</span>
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
                maxLength={200}
                placeholder="예: 부활절 소망 중심으로, 위로하는 톤으로"
                value={form.specialInstruction}
                onChange={(e) => setForm({ ...form, specialInstruction: e.target.value })}
              />
              <p className="text-xs text-gray-400 text-right">
                {form.specialInstruction.length}/200
              </p>
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canNext()}
              className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              설교 생성하기
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
