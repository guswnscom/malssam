'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const ACTION_LABEL: Record<string, string> = {
  sermon_generate: '설교 생성', sermon_regenerate: 'AI 수정', ppt_download: 'PPT 다운로드',
  pdf_view: 'PDF 조회', sermon_analyze: '설교 분석',
};
const RATING_LABEL: Record<string, string> = { good: '👍 만족', neutral: '😐 보통', bad: '👎 불만족' };
const CATEGORY_LABEL: Record<string, string> = { sermon: '설교', pricing: '요금제', general: '일반' };

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'feedbacks'>('overview');

  useEffect(() => {
    Promise.all([
      api.get('/feedback/admin/stats').catch(() => ({ data: null })),
      api.get('/feedback/admin/all').catch(() => ({ data: [] })),
    ]).then(([s, f]) => {
      setStats(s.data);
      setFeedbacks(f.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">로딩 중...</p></div>;

  return (
    <div className="min-h-screen">
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <button onClick={() => router.push('/home')} className="text-[#8B9DC3] hover:text-white text-sm">← 홈</button>
          <h1 className="text-lg font-semibold text-white">관리자 대시보드</h1>
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">ADMIN</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100">
          {([['overview', '전체 현황'], ['feedbacks', '피드백 목록']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-[#0F1A2E] text-[#C9A84C]' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <>
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-[#0F1A2E]">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">총 사용자</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-[#C9A84C]">{stats.totalSermons}</p>
                <p className="text-xs text-gray-500 mt-1">총 설교 수</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-[#3B82F6]">{stats.totalFeedbacks}</p>
                <p className="text-xs text-gray-500 mt-1">총 피드백</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-[#059669]">
                  {stats.totalFeedbacks > 0 ? Math.round(((stats.feedbackRatings?.good || 0) / stats.totalFeedbacks) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">만족도</p>
              </div>
            </div>

            {/* 피드백 만족도 분포 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-[#0F1A2E] mb-3">피드백 만족도</h3>
              <div className="space-y-2">
                {['good', 'neutral', 'bad'].map(rating => {
                  const count = stats.feedbackRatings?.[rating] || 0;
                  const pct = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm w-20">{RATING_LABEL[rating]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className={`h-3 rounded-full ${rating === 'good' ? 'bg-green-500' : rating === 'neutral' ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 이번 주 사용량 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-[#0F1A2E] mb-3">이번 주 사용량</h3>
              {Object.keys(stats.weeklyUsage || {}).length === 0 ? (
                <p className="text-sm text-gray-400">아직 사용 데이터가 없습니다</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.weeklyUsage as Record<string, number>).map(([action, count]) => (
                    <div key={action} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-[#0F1A2E]">{count}</p>
                      <p className="text-xs text-gray-500">{ACTION_LABEL[action] || action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 이번 달 사용량 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-[#0F1A2E] mb-3">이번 달 사용량</h3>
              {Object.keys(stats.monthlyUsage || {}).length === 0 ? (
                <p className="text-sm text-gray-400">아직 사용 데이터가 없습니다</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.monthlyUsage as Record<string, number>).map(([action, count]) => (
                    <div key={action} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-[#0F1A2E]">{count}</p>
                      <p className="text-xs text-gray-500">{ACTION_LABEL[action] || action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'feedbacks' && (
          <div className="space-y-3">
            {feedbacks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">아직 피드백이 없습니다</p>
              </div>
            ) : feedbacks.map((f: any) => (
              <div key={f.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                        f.rating === 'good' ? 'bg-green-100 text-green-700' :
                        f.rating === 'neutral' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{RATING_LABEL[f.rating] || f.rating}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                        {CATEGORY_LABEL[f.category] || f.category}
                      </span>
                    </div>
                    {f.comment && <p className="text-sm text-gray-700 mt-2">{f.comment}</p>}
                    {f.metadata && (
                      <p className="text-xs text-gray-400 mt-1">
                        {f.metadata.plan && `요금제: ${f.metadata.plan}`}
                        {f.metadata.worshipType && `예배: ${f.metadata.worshipType}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{f.userName}</p>
                    <p className="text-[10px] text-gray-400">{f.userEmail}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(f.createdAt).toLocaleDateString('ko-KR')} {new Date(f.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
