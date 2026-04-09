'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface BillingStatus {
  plan: string;
  status: string;
  trialEnd: string;
  trialDaysLeft: number;
  monthlyPrice: number | null;
  cardLastFour: string | null;
  nextBillingDate: string | null;
}

const PLAN_INFO: Record<string, { label: string; price: string; features: string[] }> = {
  SEED: { label: '새싹', price: '월 5만원', features: ['목회자 3명', '설교 생성 월 20회', 'PDF 출력'] },
  GROWTH: { label: '성장', price: '월 10만원', features: ['목회자 5명', '설교 생성 월 50회', 'PDF 출력'] },
  FRUIT: { label: '열매', price: '월 18만원', features: ['목회자 10명', '설교 생성 무제한', 'PDF 출력'] },
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  trial: { text: '무료체험 중', color: 'bg-blue-100 text-blue-700' },
  active: { text: '구독 중', color: 'bg-green-100 text-green-700' },
  expired: { text: '만료됨', color: 'bg-red-100 text-red-700' },
  suspended: { text: '일시정지', color: 'bg-yellow-100 text-yellow-700' },
};

export default function BillingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/billing/status')
      .then(({ data }) => setBilling(data))
      .catch((err) => setError(err.response?.data?.message || '결제 정보를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = async () => {
    if (!confirm('구독을 시작하시겠습니까?\n(테스트 모드: 실제 결제 없이 즉시 활성화됩니다)')) return;
    setActivating(true);
    try {
      const { data } = await api.post('/billing/activate');
      setBilling((prev) => prev ? { ...prev, ...data } : prev);
      alert('구독이 시작되었습니다!');
    } catch (err: any) {
      alert(err.response?.data?.message || '구독 시작에 실패했습니다');
    } finally {
      setActivating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">로딩 중...</p></div>;

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={() => router.push('/home')} className="text-blue-600 hover:underline">홈으로</button>
    </div>
  );

  if (!billing) return null;

  const planInfo = PLAN_INFO[billing.plan] || PLAN_INFO.SEED;
  const statusInfo = STATUS_LABEL[billing.status] || STATUS_LABEL.trial;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/home')} className="text-gray-500 hover:text-gray-700">← 홈</button>
          <h1 className="text-lg font-semibold">결제 관리</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 현재 상태 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">구독 상태</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">요금제:</span>
              <span className="ml-2 font-semibold">{planInfo.label}</span>
            </div>
            <div>
              <span className="text-gray-500">가격:</span>
              <span className="ml-2 font-semibold">{planInfo.price}</span>
            </div>
            {billing.status === 'trial' && (
              <>
                <div>
                  <span className="text-gray-500">체험 종료:</span>
                  <span className="ml-2 font-medium">{new Date(billing.trialEnd).toLocaleDateString('ko-KR')}</span>
                </div>
                <div>
                  <span className="text-gray-500">남은 일수:</span>
                  <span className="ml-2 font-bold text-blue-600">D-{billing.trialDaysLeft}</span>
                </div>
              </>
            )}
            {billing.status === 'active' && (
              <>
                <div>
                  <span className="text-gray-500">결제 카드:</span>
                  <span className="ml-2 font-medium">**** {billing.cardLastFour}</span>
                </div>
                <div>
                  <span className="text-gray-500">다음 결제:</span>
                  <span className="ml-2 font-medium">
                    {billing.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString('ko-KR') : '-'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 만료 경고 */}
          {billing.status === 'expired' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">무료체험이 종료되었습니다.</p>
              <p className="text-red-600 text-sm mt-1">설교 생성 기능이 제한됩니다. 구독을 시작해주세요.</p>
            </div>
          )}
        </div>

        {/* 요금제 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">현재 요금제: {planInfo.label}</h2>
          <ul className="space-y-2">
            {planInfo.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* 결제 버튼 */}
        {(billing.status === 'trial' || billing.status === 'expired') && (
          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {activating ? '처리 중...' : billing.status === 'expired' ? '구독 시작하기' : '지금 구독 시작하기 (체험 후 자동 전환)'}
          </button>
        )}

        {billing.status === 'active' && (
          <div className="text-center text-sm text-gray-500">
            구독이 활성화되어 있습니다. 모든 기능을 사용할 수 있습니다.
          </div>
        )}
      </main>
    </div>
  );
}
