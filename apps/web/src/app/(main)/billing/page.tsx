'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

const PLANS = [
  { key: 'FREE', label: '무료', price: '0원', desc: '5편', features: ['설교 생성 5편', 'PDF 출력', '설교 분석'], color: 'border-gray-200', badge: '' },
  { key: 'SEED', label: '새싹', price: '5만원', desc: '5편', features: ['설교 생성 5편', 'PDF 출력', '설교 분석', 'PPT 프롬프트'], color: 'border-[#C9A84C]/40', badge: '' },
  { key: 'GROWTH', label: '성장', price: '10만원', desc: '10편', features: ['설교 생성 10편', 'PDF 출력', '설교 분석', 'PPT 프롬프트', 'AI 최종검토'], color: 'border-[#3B82F6]/40', badge: '추천' },
  { key: 'STANDARD', label: '표준', price: '20만원', desc: '20편', features: ['설교 생성 20편', 'PDF 출력', '설교 분석', 'PPT 프롬프트', 'AI 최종검토', '우선 지원'], color: 'border-[#8B5CF6]/40', badge: '' },
];

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feedbackPlan, setFeedbackPlan] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async () => {
    if (!feedbackRating) { toast('info', '만족도를 선택해주세요'); return; }
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        category: 'pricing',
        rating: feedbackRating,
        comment: feedbackText || null,
        metadata: { plan: feedbackPlan },
      });
      setSubmitted(true);
      setTimeout(() => { setFeedbackPlan(''); setSubmitted(false); setFeedbackText(''); setFeedbackRating(''); }, 2000);
    } catch { toast('error', '피드백 전송에 실패했습니다'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #C9A84C 0%, transparent 50%)' }} />
        <div className="max-w-3xl mx-auto flex items-center justify-between relative">
          <button onClick={() => router.push('/home')} className="text-[#8B9DC3] hover:text-white text-sm">← 홈</button>
          <h1 className="text-lg font-semibold text-white">요금제 안내</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 베타 안내 */}
        <div className="bg-gradient-to-r from-[#0F1A2E] to-[#1B2D4A] rounded-2xl p-5 text-center">
          <span className="inline-block bg-[#C9A84C] text-[#0F1A2E] text-xs font-bold px-3 py-1 rounded-full mb-3">BETA</span>
          <h2 className="text-white font-bold text-lg mb-1">현재 베타 테스트 기간입니다</h2>
          <p className="text-[#8B9DC3] text-sm">모든 기능을 무료로 사용하실 수 있습니다. 아래 요금제에 대한 의견을 남겨주세요.</p>
        </div>

        {/* 요금제 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map(plan => (
            <div key={plan.key} className={`bg-white rounded-2xl border-2 ${plan.color} p-5 relative`}>
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 bg-[#3B82F6] text-white text-xs font-bold px-3 py-0.5 rounded-full">{plan.badge}</span>
              )}
              <h3 className="font-bold text-lg text-[#0F1A2E]">{plan.label}</h3>
              <div className="flex items-baseline gap-1 mt-1 mb-3">
                <span className="text-2xl font-bold text-[#0F1A2E]">{plan.price}</span>
                {plan.key !== 'FREE' && <span className="text-xs text-gray-400">/ {plan.desc}</span>}
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#C9A84C] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setFeedbackPlan(plan.key); setSubmitted(false); setFeedbackText(''); setFeedbackRating(''); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#0F1A2E] text-[#C9A84C] hover:bg-[#1B2D4A] transition-colors"
              >
                이 요금제 어떠신가요?
              </button>
            </div>
          ))}
        </div>

        {/* 피드백 모달 */}
        {feedbackPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {submitted ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">감사합니다!</h3>
                  <p className="text-sm text-gray-500 mt-1">소중한 의견이 제품 개선에 반영됩니다</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg text-[#0F1A2E] mb-1">
                    {PLANS.find(p => p.key === feedbackPlan)?.label} 요금제 의견
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">이 요금제에 대해 어떻게 생각하시나요?</p>

                  <div className="flex gap-3 mb-4">
                    {[
                      { val: 'good', emoji: '👍', label: '적절해요' },
                      { val: 'neutral', emoji: '😐', label: '보통이에요' },
                      { val: 'bad', emoji: '👎', label: '비싸요' },
                    ].map(r => (
                      <button key={r.val} onClick={() => setFeedbackRating(r.val)}
                        className={`flex-1 py-3 rounded-xl text-center transition-all ${feedbackRating === r.val ? 'bg-[#0F1A2E] text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        <div className="text-2xl mb-1">{r.emoji}</div>
                        <div className="text-xs font-medium">{r.label}</div>
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm resize-none"
                    rows={3} maxLength={500}
                    placeholder="추가 의견이 있으시면 자유롭게 남겨주세요 (선택)"
                    value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  />

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setFeedbackPlan('')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                      취소
                    </button>
                    <button onClick={handleFeedback} disabled={submitting || !feedbackRating}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#C9A84C] text-[#0F1A2E] hover:bg-[#D4B85C] disabled:bg-gray-300">
                      {submitting ? '전송 중...' : '의견 보내기'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
