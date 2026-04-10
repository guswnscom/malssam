'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface ChurchData {
  church: { id: string; name: string; sizeCategory: string };
  profile: { sermonStyle: string; congregationType: string; worshipTypes: string[] };
  subscription: { plan: string; status: string; trialEnd: string; trialDaysLeft: number };
  membership: { role: string };
  members: Array<{ id: string; name: string; role: string }>;
}

interface SermonItem {
  id: string; title: string; scripture: string; worshipType: string;
  targetDate: string; authorName: string; createdAt: string;
}

const WORSHIP_LABEL: Record<string, string> = {
  SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
  DAWN: '새벽예배', SPECIAL: '특별예배',
};
const ROLE_LABEL: Record<string, string> = {
  CHURCH_ADMIN: '관리자', SENIOR_PASTOR: '담임목사',
  ASSOC_PASTOR: '부목사', MINISTER: '전도사',
};

// 절기 데이터 (2026년 기준, 라이트 버전)
interface ChurchEvent {
  date: string; label: string; type: string; scripture?: string;
}

function getUpcomingEvents(): ChurchEvent[] {
  const events: ChurchEvent[] = [
    { date: '2026-01-01', label: '신년', type: 'season', scripture: '여호수아 1:9' },
    { date: '2026-02-18', label: '사순절 시작', type: 'liturgy', scripture: '이사야 53:3-5' },
    { date: '2026-04-05', label: '부활절', type: 'liturgy', scripture: '고린도전서 15:3-8' },
    { date: '2026-05-08', label: '어버이주일', type: 'season', scripture: '출애굽기 20:12' },
    { date: '2026-05-24', label: '성령강림절', type: 'liturgy', scripture: '사도행전 2:1-4' },
    { date: '2026-06-25', label: '6.25 기념주일', type: 'season', scripture: '시편 46:1-3' },
    { date: '2026-08-15', label: '광복절', type: 'season', scripture: '갈라디아서 5:1' },
    { date: '2026-09-06', label: '추석', type: 'season', scripture: '시편 126:1-6' },
    { date: '2026-10-31', label: '종교개혁주일', type: 'liturgy', scripture: '로마서 1:17' },
    { date: '2026-11-15', label: '수능 주간', type: 'season', scripture: '잠언 3:5-6' },
    { date: '2026-11-22', label: '추수감사절', type: 'liturgy', scripture: '시편 100편' },
    { date: '2026-11-29', label: '대림절 시작', type: 'liturgy', scripture: '이사야 9:6' },
    { date: '2026-12-25', label: '성탄절', type: 'liturgy', scripture: '누가복음 2:10-14' },
  ];

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return events.filter(e => {
    const d = new Date(e.date);
    return d >= now && d <= twoWeeksLater;
  });
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [churchData, setChurchData] = useState<ChurchData | null>(null);
  const [recentSermons, setRecentSermons] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }

        const meRes = await api.get('/auth/me');
        if (!meRes.data.churchId) { router.push('/onboarding/church'); return; }

        const [churchRes, sermonsRes] = await Promise.all([
          api.get('/churches/me'),
          api.get('/sermons').catch(() => ({ data: [] })),
        ]);
        setChurchData(churchRes.data);
        setRecentSermons(sermonsRes.data.slice(0, 5));
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    useAuthStore.getState().clearAuth();
    router.push('/login');
  };

  if (loading) return <div className="flex items-center justify-center py-32"><p className="text-gray-500">로딩 중...</p></div>;
  if (!churchData) return null;

  const { church, subscription, membership } = churchData;
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 상단 바 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{church.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{ROLE_LABEL[membership.role] || membership.role}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {subscription.status === 'trial' && (
              <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                무료체험 D-{subscription.trialDaysLeft}
              </span>
            )}
            {subscription.status === 'active' && (
              <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                구독 중
              </span>
            )}
            <button onClick={handleLogout} className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* 구독 만료 경고 */}
        {subscription.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">무료체험이 종료되었습니다</p>
            <p className="text-red-600 text-sm mt-1">설교 생성이 제한됩니다.</p>
            {membership.role === 'CHURCH_ADMIN' && (
              <button onClick={() => router.push('/billing')} className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                구독 시작하기
              </button>
            )}
          </div>
        )}

        {/* 절기/이벤트 알림 */}
        {upcomingEvents.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">📅 다가오는 교회 일정</h3>
            <div className="flex flex-wrap gap-2">
              {upcomingEvents.map((e, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (e.scripture) {
                      // 설교 생성 페이지로 이동 (본문을 URL 파라미터로 전달)
                      router.push(`/sermons/new?scripture=${encodeURIComponent(e.scripture)}&hint=${encodeURIComponent(e.label)}`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-sm hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                >
                  <span className="text-amber-600 font-medium">{new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-gray-700">{e.label}</span>
                  {e.scripture && <span className="text-xs text-amber-500 ml-1">📖</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">클릭하면 해당 절기에 맞는 설교를 바로 준비할 수 있어요</p>
          </div>
        )}

        {/* 이번주 예배 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">이번주 예배</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {churchData.profile.worshipTypes.map((type) => {
              // 해당 예배 유형의 최근 설교 찾기
              const matchingSermon = recentSermons.find(s => s.worshipType === type);
              const WORSHIP_DAY: Record<string, number> = { SUNDAY: 0, WEDNESDAY: 3, FRIDAY: 5, DAWN: 1, SPECIAL: 6 };
              const today = new Date();
              const todayDay = today.getDay();
              const worshipDay = WORSHIP_DAY[type] ?? 0;
              const isPast = todayDay > worshipDay && type !== 'DAWN';
              const isToday = todayDay === worshipDay;

              let statusMsg = '';
              let statusColor = 'text-gray-500';
              if (matchingSermon) {
                statusMsg = '✅ 작성됨';
                statusColor = 'text-green-600';
              } else if (isToday) {
                statusMsg = `목사님, 오늘 ${WORSHIP_LABEL[type]}가 있습니다. 설교를 준비해주세요!`;
                statusColor = 'text-red-500 font-medium';
              } else if (isPast) {
                statusMsg = `돌아오는 ${WORSHIP_LABEL[type]} 설교 작성이 필요합니다`;
                statusColor = 'text-amber-600';
              } else {
                statusMsg = '미작성';
              }

              return (
                <div key={type} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{WORSHIP_LABEL[type] || type}</h3>
                      <p className={`text-xs sm:text-sm mt-1 ${statusColor}`}>{statusMsg}</p>
                    </div>
                    {matchingSermon ? (
                      <button
                        onClick={() => router.push(`/sermons/${matchingSermon.id}`)}
                        className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0"
                      >
                        보기
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // 다음 해당 요일 계산
                          const now = new Date();
                          let daysUntil = worshipDay - now.getDay();
                          if (daysUntil <= 0) daysUntil += 7;
                          const nextDate = new Date(now.getTime() + daysUntil * 86400000);
                          const dateStr2 = nextDate.toISOString().split('T')[0];
                          router.push(`/sermons/new?worshipType=${type}&date=${dateStr2}`);
                        }}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        설교 만들기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 최근 설교 */}
        {recentSermons.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">최근 설교</h2>
              <button onClick={() => router.push('/sermons')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                전체 보기 →
              </button>
            </div>
            <div className="space-y-3">
              {recentSermons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/sermons/${s.id}`)}
                  className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{s.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">📖 {s.scripture}</p>
                    </div>
                    <span className="flex-shrink-0 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {WORSHIP_LABEL[s.worshipType] || s.worshipType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(s.targetDate).toLocaleDateString('ko-KR')}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 빠른 작업 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">빠른 작업</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => router.push('/sermons/new')} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-1">✍️</span>
              <span className="text-sm font-medium text-gray-700">새 설교</span>
            </button>
            <button onClick={() => router.push('/sermons')} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-1">📋</span>
              <span className="text-sm font-medium text-gray-700">설교 목록</span>
            </button>
            <button onClick={() => router.push('/sermons/analyze')} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-2xl block mb-1">🔍</span>
              <span className="text-sm font-medium text-gray-700">설교 분석</span>
            </button>
            {membership.role === 'CHURCH_ADMIN' && (
              <button onClick={() => router.push('/billing')} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                <span className="text-2xl block mb-1">💳</span>
                <span className="text-sm font-medium text-gray-700">결제 관리</span>
              </button>
            )}
          </div>
        </section>

        {/* 교회 정보 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">교회 정보</h2>
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">요금제:</span> <span className="ml-1 font-medium">{subscription.plan === 'SEED' ? '새싹' : subscription.plan === 'GROWTH' ? '성장' : '열매'}</span></div>
              <div><span className="text-gray-500">멤버:</span> <span className="ml-1 font-medium">{churchData.members.length}명</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
