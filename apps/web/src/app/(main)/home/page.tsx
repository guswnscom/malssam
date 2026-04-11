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
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }

        const meRes = await api.get('/auth/me');
        if (!meRes.data.churchId) { router.push('/onboarding/church'); return; }

        const [churchRes, sermonsRes, statsRes] = await Promise.all([
          api.get('/churches/me'),
          api.get('/sermons').catch(() => ({ data: [] })),
          api.get('/feedback/stats').catch(() => ({ data: null })),
        ]);
        setChurchData(churchRes.data);
        setRecentSermons(sermonsRes.data.slice(0, 5));
        setUsageStats(statsRes.data);
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
          <div className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/20 min-h-[140px]">
            {/* 배경 — 따뜻한 골드 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8E7] via-[#FFF3D6] to-[#EDE0C0]" />
            {/* 우측 — 차분한 십자가+성경 이미지 */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFF8E7] via-[#FFF8E7]/70 to-transparent z-10" />
              <img src="/images/cross-bible.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="relative p-5 sm:p-6 z-20">
            <h3 className="text-sm font-semibold text-[#8B6914] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#C9A84C] rounded-full" />다가오는 교회 일정
            </h3>
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
                  className="inline-flex items-center gap-1.5 bg-white border border-[#C9A84C]/20 px-3 py-2 rounded-xl text-sm hover:bg-[#FFF3D6] hover:border-[#C9A84C]/40 transition-all cursor-pointer shadow-sm"
                >
                  <span className="text-amber-600 font-medium">{new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-gray-700">{e.label}</span>
                  {e.scripture && <span className="text-xs text-amber-500 ml-1">📖</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#8B6914]/60 mt-3">클릭하면 해당 절기에 맞는 설교를 바로 준비할 수 있습니다</p>
          </div></div>
        )}

        {/* 이번주 예배 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-[#0F1A2E] rounded-full" />이번주 예배</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 순서: 주일→수요→금요→새벽→특별 */}
            {['SUNDAY','WEDNESDAY','FRIDAY','DAWN','SPECIAL'].filter(t => churchData.profile.worshipTypes.includes(t)).map((type) => {
              // 해당 예배 유형의 최근 설교 찾기
              const matchingSermon = recentSermons.find(s => s.worshipType === type);
              const WORSHIP_DAY: Record<string, number> = { SUNDAY: 0, WEDNESDAY: 3, FRIDAY: 5, DAWN: 1, SPECIAL: 6 };
              const today = new Date();
              const todayDay = today.getDay();
              const worshipDay = WORSHIP_DAY[type] ?? 0;
              const isPast = todayDay > worshipDay && type !== 'DAWN';
              const isToday = todayDay === worshipDay;

              let statusMsg = '';
              let statusColor = 'text-gray-400';
              let statusIcon = '';
              if (matchingSermon) {
                statusMsg = '준비 완료';
                statusColor = 'text-[#0F1A2E]';
                statusIcon = '✓';
              } else if (isToday) {
                statusMsg = '오늘 예배 — 설교 준비가 필요합니다';
                statusColor = 'text-[#C9A84C] font-medium';
                statusIcon = '⏰';
              } else if (isPast) {
                statusMsg = '다음 예배를 위해 미리 준비하세요';
                statusColor = 'text-gray-500';
                statusIcon = '→';
              } else {
                statusMsg = '아직 준비되지 않았습니다';
                statusIcon = '○';
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
                      <h3 className={`font-semibold ${type === 'SUNDAY' ? 'text-white' : 'text-gray-900'}`}>{WORSHIP_LABEL[type] || type}{type === 'SPECIAL' && <span className="text-[#EC4899] ml-1 text-xs">✦</span>}</h3>
                      <p className={`text-xs sm:text-sm mt-1 ${type === 'SUNDAY' ? 'text-white/80' : statusColor}`}>{statusIcon} {statusMsg}</p>
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
                          // 다음 해당 요일 계산
                          const now = new Date();
                          let daysUntil = worshipDay - now.getDay();
                          if (daysUntil <= 0) daysUntil += 7;
                          const nextDate = new Date(now.getTime() + daysUntil * 86400000);
                          const dateStr2 = nextDate.toISOString().split('T')[0];
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
