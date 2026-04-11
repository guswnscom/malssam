'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  const [usageStats, setUsageStats] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<Array<{ id: string; title: string; date: string; eventType: string; description?: string; reminderDays?: number[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }

        const meRes = await api.get('/auth/me');
        if (!meRes.data.churchId) { router.push('/onboarding/church'); return; }

        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();
        const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
        const nextYear = thisMonth === 12 ? thisYear + 1 : thisYear;

        const [churchRes, sermonsRes, statsRes, eventsThisRes, eventsNextRes] = await Promise.all([
          api.get('/churches/me'),
          api.get('/sermons').catch(() => ({ data: [] })),
          api.get('/feedback/stats').catch(() => ({ data: null })),
          api.get(`/calendar/events?year=${thisYear}&month=${thisMonth}`).catch(() => ({ data: { events: [] } })),
          api.get(`/calendar/events?year=${nextYear}&month=${nextMonth}`).catch(() => ({ data: { events: [] } })),
        ]);
        setChurchData(churchRes.data);
        setRecentSermons(sermonsRes.data.slice(0, 5));
        setUsageStats(statsRes.data);

        // 일정 필터: 오늘~30일 이내, 가까운 순 정렬
        const evThisData = eventsThisRes.data?.events || eventsThisRes.data || [];
        const evNextData = eventsNextRes.data?.events || eventsNextRes.data || [];
        const allEvents = [...(Array.isArray(evThisData) ? evThisData : []), ...(Array.isArray(evNextData) ? evNextData : [])];
        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        const upcoming = allEvents
          .filter((e: any) => {
            if (e.isLiturgical) return false;
            const eventDate = new Date(e.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= todayDate;
          })
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);
        setMyEvents(upcoming);
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

  const TAG_COLORS: Record<string, string> = {
    SUNDAY: 'bg-[#C9A84C] text-white',
    WEDNESDAY: 'bg-[#3B82F6] text-white',
    FRIDAY: 'bg-[#8B5CF6] text-white',
    DAWN: 'bg-[#F59E0B] text-white',
    SPECIAL: 'bg-[#EC4899] text-white',
  };

  return (
    <div className="min-h-screen">
      {/* 상단 바 */}
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-5 sm:py-6 relative overflow-hidden">
        {/* 골드 광선 — 십자가 뒤 빛 퍼짐 효과 */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 40%, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 30%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 30% 60% at 50% 40%, rgba(255,248,230,0.08) 0%, transparent 50%)' }} />
        {/* 중앙 십자가 — 골드 글로우 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 15px rgba(201,168,76,0.4)) drop-shadow(0 0 30px rgba(201,168,76,0.2))' }}>
            <rect x="44" y="8" width="12" height="84" rx="1.5" fill="#C9A84C" opacity="0.7"/>
            <rect x="18" y="32" width="64" height="12" rx="1.5" fill="#C9A84C" opacity="0.7"/>
          </svg>
        </div>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">{church.name}</h1>
            <p className="text-xs sm:text-sm text-[#8B9DC3]">
              {(() => {
                // authStore 또는 churchData.members에서 유저 이름 찾기
                const me = useAuthStore.getState().user;
                let displayName = '';
                if (me?.name) {
                  const parts = me.name.split('|');
                  displayName = `${parts[0]} ${parts[1] || '목사'}님`;
                } else {
                  // members에서 현재 유저 찾기
                  const currentMember = churchData.members.find(m => m.role === membership.role);
                  if (currentMember?.name) {
                    const parts = currentMember.name.split('|');
                    displayName = `${parts[0]} ${parts[1] || '목사'}님`;
                  }
                }
                return displayName || ROLE_LABEL[membership.role] || membership.role;
              })()}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="bg-[#C9A84C]/20 text-[#C9A84C] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border border-[#C9A84C]/30">
              BETA
            </span>
            <button onClick={handleLogout} className="text-xs sm:text-sm text-[#5A6F8C] hover:text-white">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* 베타 테스트 안내 */}
        <div className="bg-gradient-to-r from-[#0F1A2E] to-[#1B2D4A] rounded-2xl p-4 flex items-center gap-3">
          <span className="bg-[#C9A84C] text-[#0F1A2E] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">BETA</span>
          <p className="text-sm text-[#8B9DC3]">현재 모든 기능이 <span className="text-[#C9A84C] font-semibold">무료</span>로 제공되고 있습니다. 사용 후 피드백을 남겨주시면 제품 개선에 큰 도움이 됩니다.</p>
        </div>

        {/* 절기/이벤트 알림 */}
        {upcomingEvents.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl" style={{ background: '#4A3525' }}>
            {/* 배경 이미지 — 중앙 정렬, 전체 커버 */}
            <div className="absolute inset-0">
              <Image src="/images/calendar-banner.png" alt="교회 일정" fill className="object-cover object-center scale-110" priority sizes="(max-width: 768px) 100vw, 800px" />
            </div>
            {/* 전체를 감싸는 나무색 오버레이 — 이미지 경계를 숨김 */}
            <div className="absolute inset-0 bg-[#4A3525]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A3525]/90 via-[#4A3525]/50 to-[#4A3525]/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#3B2510]/20 via-transparent to-[#3B2510]/30" />
            {/* 모서리 비네팅 */}
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 40px rgba(58,37,21,0.5)' }} />
            {/* 콘텐츠 */}
            <div className="relative p-6 sm:p-7 z-10 flex flex-col justify-center min-h-[160px] sm:min-h-[170px]">
              <h3 className="text-xl sm:text-2xl font-bold text-[#E8D5A8] mb-3 sm:mb-4" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                다가오는 교회 일정
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {upcomingEvents.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (e.scripture) {
                        router.push(`/sermons/new?scripture=${encodeURIComponent(e.scripture)}&hint=${encodeURIComponent(e.label)}`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#2A2018]/80 backdrop-blur-sm px-3.5 py-2 rounded-xl text-sm hover:bg-[#2A2018] transition-all cursor-pointer border border-white/10"
                  >
                    <span className="text-[#E8D5A8] font-semibold">{new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-white/90">{e.label}</span>
                    {e.scripture && <span className="text-xs text-[#E8D5A8] ml-0.5">📖</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50">클릭하시면 해당 절기에 맞는 설교를 바로 준비할 수 있습니다</p>
            </div>
          </div>
        )}

        {/* 나의 다가오는 일정 */}
        {myEvents.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-[#0F1A2E] p-4">
            <div className="absolute inset-0 opacity-[0.03]" style={{ background: 'radial-gradient(circle at 90% 50%, #C9A84C 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <h3 className="text-xs font-semibold text-[#8B9DC3] mb-2.5 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {(() => {
                  const me = useAuthStore.getState().user;
                  if (me?.name) {
                    const parts = me.name.split('|');
                    return `${parts[0]} ${parts[1] || '목사'}님 다가오는 일정`;
                  }
                  return '다가오는 일정';
                })()}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {myEvents.map((ev) => {
                  const d = new Date(ev.date);
                  const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <button key={ev.id} onClick={() => router.push('/calendar')}
                      className="flex-shrink-0 bg-[#1B2D4A] rounded-xl p-3 min-w-[140px] text-left hover:bg-[#243B5C] transition-all border border-white/5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#C9A84C] text-xs font-semibold">
                          {d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          daysLeft <= 1 ? 'bg-red-500/20 text-red-400' : daysLeft <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-[#8B9DC3]'
                        }`}>
                          {daysLeft === 0 ? '오늘' : daysLeft === 1 ? '내일' : `D-${daysLeft}`}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                      {ev.description && <p className="text-[10px] text-[#5A6F8C] truncate mt-0.5">{ev.description}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 이번주 예배 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />이번주 예배</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 순서: 주일→수요→금요→새벽→특별 */}
            {['SUNDAY','WEDNESDAY','FRIDAY','DAWN','SPECIAL'].filter(t => churchData.profile.worshipTypes.includes(t)).map((type) => {
              const WORSHIP_DAY: Record<string, number> = { SUNDAY: 0, WEDNESDAY: 3, FRIDAY: 5, DAWN: 1, SPECIAL: 6 };
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayDay = today.getDay();
              const worshipDay = WORSHIP_DAY[type] ?? 0;

              // 다음 예배 날짜 계산
              let daysUntil = worshipDay - todayDay;
              if (type === 'DAWN') {
                // 새벽예배: 항상 내일 (매일)
                daysUntil = 1;
              } else if (daysUntil <= 0) {
                // 오늘이거나 지났으면 다음 주
                daysUntil += 7;
              }
              const nextWorshipDate = new Date(today.getTime() + daysUntil * 86400000);
              const nextDateStr = nextWorshipDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
              const nextDayName = nextWorshipDate.toLocaleDateString('ko-KR', { weekday: 'short' });

              // 해당 예배 설교 매칭: 다음 예배 날짜와 같은 날짜의 설교만
              const matchingSermon = recentSermons.find(s => {
                if (s.worshipType !== type) return false;
                const sermonDate = new Date(s.targetDate);
                sermonDate.setHours(0, 0, 0, 0);
                // 새벽예배: 오늘 날짜 설교만 매칭
                if (type === 'DAWN') {
                  return sermonDate.getTime() === today.getTime();
                }
                // 다른 예배: 다음 예배 날짜와 매칭
                return sermonDate.getTime() === nextWorshipDate.getTime();
              });

              let statusMsg = '';
              let statusColor = 'text-gray-400';
              if (matchingSermon) {
                statusMsg = '✓ 준비 완료';
                statusColor = 'text-[#0F1A2E]';
              } else if (daysUntil <= 1) {
                statusMsg = type === 'DAWN' ? '⏰ 내일 새벽예배' : '⏰ 설교 준비가 필요합니다';
                statusColor = 'text-[#C9A84C] font-medium';
              } else {
                statusMsg = `○ D-${daysUntil}`;
                statusColor = 'text-gray-400';
              }

              return (
                <div key={type} className={`p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all ${
                  type === 'SUNDAY' ? 'bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white border border-[#C9A84C]/30' :
                  type === 'WEDNESDAY' ? 'bg-white border-l-4 border-l-[#3B82F6] border border-gray-100' :
                  type === 'FRIDAY' ? 'bg-white border-l-4 border-l-[#8B5CF6] border border-gray-100' :
                  type === 'DAWN' ? 'bg-white border-l-4 border-l-[#F59E0B] border border-gray-100' :
                  type === 'SPECIAL' ? 'bg-white border-l-4 border-l-[#EC4899] border border-gray-100' :
                  'bg-white border border-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${type === 'SUNDAY' ? 'text-white' : 'text-gray-900'}`}>
                          {WORSHIP_LABEL[type] || type}
                        </h3>
                        {type !== 'SPECIAL' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            type === 'SUNDAY' ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {type === 'DAWN' ? '매일' : `${nextDateStr} (${nextDayName})`}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${type === 'SUNDAY' ? 'text-white/80' : statusColor}`}>{statusMsg}</p>
                    </div>
                    {matchingSermon ? (
                      <button
                        onClick={() => router.push(`/sermons/${matchingSermon.id}`)}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${type === 'SUNDAY' ? 'bg-white text-[#8B6914] hover:bg-white/90' : 'bg-[#0F1A2E] text-white hover:bg-[#1B2D4A]'}`}
                      >
                        보기
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const dateStr2 = nextWorshipDate.toISOString().split('T')[0];
                          router.push(`/sermons/new?worshipType=${type}&date=${dateStr2}`);
                        }}
                        className="bg-[#C9A84C] text-[#0F1A2E] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#D4B85C] transition-colors flex-shrink-0"
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
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />최근 설교</h2>
              <button onClick={() => router.push('/sermons')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                전체 보기 →
              </button>
            </div>
            <div className="space-y-3">
              {recentSermons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/sermons/${s.id}`)}
                  className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C9A84C]/30 hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A84C]/40 to-transparent" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{s.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">📖 {s.scripture}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium ${TAG_COLORS[s.worshipType] || 'bg-gray-200 text-gray-700'}`}>
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
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />빠른 작업</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/sermons/new', label: '새 설교', desc: '설교 초안 생성',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2v8m0 4v8m-6-14h12M6 18h12"/>' },
              { href: '/sermons', label: '설교 캐비넷', desc: '저장된 설교 관리',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>' },
              { href: '/sermons/analyze', label: '설교 분석', desc: 'AI 분석 및 개선',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>' },
              { href: '/calendar', label: '캘린더', desc: '교회 일정 관리',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
              ...(membership.role === 'CHURCH_ADMIN' ? [
                { href: '/billing', label: '요금제', desc: '구독 및 피드백',
                  icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>' },
                { href: '/admin', label: '관리자', desc: '대시보드',
                  icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>' },
              ] : []),
            ].map(item => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="bg-[#0F1A2E] p-4 rounded-2xl text-center hover:bg-[#1B2D4A] transition-all">
                <div className="w-12 h-12 border border-[#C9A84C]/30 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-6 h-6 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: item.icon }} />
                </div>
                <span className="text-xs font-bold text-white block">{item.label}</span>
                <span className="text-[10px] text-[#5A6F8C] mt-0.5 block">{item.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 나의 활동 */}
        {usageStats && (
          <section>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />나의 활동</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-bold text-[#0F1A2E]">{usageStats.weekly?.sermon_generate || 0}</p>
                <p className="text-xs text-gray-500 mt-1">이번 주 설교 생성</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-bold text-[#C9A84C]">{usageStats.monthly?.sermon_generate || 0}</p>
                <p className="text-xs text-gray-500 mt-1">이번 달 설교 생성</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-bold text-[#3B82F6]">
                  {usageStats.topFeature ? (
                    {sermon_generate: '설교 생성', sermon_regenerate: 'AI 수정', ppt_download: 'PPT', pdf_view: 'PDF', sermon_analyze: '설교 분석'}[usageStats.topFeature.action as string] || usageStats.topFeature.action
                  ) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">가장 많이 쓴 기능</p>
              </div>
            </div>
          </section>
        )}

        {/* 교회 정보 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />교회 정보</h2>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#0F1A2E] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div><span className="text-gray-400 text-xs">요금제</span><br/><span className="font-semibold text-gray-900">{subscription.plan === 'SEED' ? '새싹' : subscription.plan === 'GROWTH' ? '성장' : subscription.plan}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#0F1A2E] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div><span className="text-gray-400 text-xs">멤버</span><br/><span className="font-semibold text-gray-900">{churchData.members.length}명</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
