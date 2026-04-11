'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PageHelp, { HelpButton, HELP_DATA } from '@/components/PageHelp';

interface SermonItem {
  id: string;
  title: string;
  scripture: string;
  worshipType: string;
  targetDate: string;
  authorName: string;
  createdAt: string;
}

const TAG_COLORS: Record<string, string> = {
  SUNDAY: 'bg-[#C9A84C] text-white', WEDNESDAY: 'bg-[#3B82F6] text-white',
  FRIDAY: 'bg-[#8B5CF6] text-white', DAWN: 'bg-[#F59E0B] text-white', SPECIAL: 'bg-[#EC4899] text-white',
};
const WORSHIP_LABEL: Record<string, string> = {
  SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
  DAWN: '새벽예배', SPECIAL: '특별예배',
};

type ViewMode = 'all' | 'week' | 'month' | 'year';

function getWeekRange(date: Date): { start: Date; end: Date; label: string } {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const label = `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  return { start, end, label };
}

export default function SermonsListPage() {
  const router = useRouter();
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // 주/월/연도 탐색을 위한 오프셋
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api.get('/sermons').then(({ data }) => setSermons(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // 현재 탐색 기간 계산
  const currentPeriod = useMemo(() => {
    const now = new Date();
    if (viewMode === 'week') {
      const ref = new Date(now);
      ref.setDate(ref.getDate() + offset * 7);
      const { start, end, label } = getWeekRange(ref);
      return { start, end, label: `${ref.getFullYear()}년 ${label}`, year: ref.getFullYear() };
    } else if (viewMode === 'month') {
      const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: `${ref.getFullYear()}년 ${ref.getMonth() + 1}월`, year: ref.getFullYear() };
    } else if (viewMode === 'year') {
      const year = now.getFullYear() + offset;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end, label: `${year}년`, year };
    }
    return null;
  }, [viewMode, offset]);

  // 필터링된 설교 목록
  const filteredSermons = useMemo(() => {
    let result = [...sermons];

    // 기간 필터
    if (currentPeriod) {
      result = result.filter(s => {
        const d = new Date(s.targetDate);
        return d >= currentPeriod.start && d <= currentPeriod.end;
      });
    }

    // 예배 유형 필터
    if (filterType !== 'ALL') {
      result = result.filter(s => s.worshipType === filterType);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.scripture.toLowerCase().includes(q) ||
        s.authorName.toLowerCase().includes(q)
      );
    }

    // 날짜 내림차순 정렬
    result.sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());

    return result;
  }, [sermons, currentPeriod, filterType, searchQuery]);

  // 월별 그룹핑 (연도별 보기에서 사용)
  const groupedByMonth = useMemo(() => {
    if (viewMode !== 'year') return null;
    const groups: Record<string, SermonItem[]> = {};
    filteredSermons.forEach(s => {
      const d = new Date(s.targetDate);
      const key = `${d.getMonth() + 1}월`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filteredSermons, viewMode]);

  // 뷰 모드 변경 시 오프셋 리셋
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setOffset(0);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-4 relative overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.05]">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#C9A84C"><path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z"/></svg>
        </div>
        <div className="max-w-3xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/home')} className="text-[#8B9DC3] hover:text-white text-sm">← 홈</button>
            <HelpButton pageKey="sermonList" steps={HELP_DATA.sermonList} />
          </div>
          <h1 className="text-lg font-semibold text-white">설교 캐비넷</h1>
          <button onClick={() => router.push('/sermons/new')} className="bg-[#C9A84C] text-[#0F1A2E] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#D4B85C]">
            + 새 설교
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {/* 검색 바 */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            type="text"
            placeholder="제목, 성경 본문, 작성자 검색..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 보기 모드 탭 */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-100 mb-4">
          {([['all', '전체'], ['week', '주별'], ['month', '월별'], ['year', '연도별']] as [ViewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-[#0F1A2E] text-[#C9A84C] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 기간 네비게이션 (주/월/연도별 보기일 때) */}
        {viewMode !== 'all' && currentPeriod && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4">
            <button
              onClick={() => setOffset(o => o - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="text-center">
              <span className="font-semibold text-sm text-[#0F1A2E]">{currentPeriod.label}</span>
              <span className="ml-2 text-xs text-gray-400">{filteredSermons.length}편</span>
            </div>
            <button
              onClick={() => setOffset(o => o + 1)}
              disabled={offset >= 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* 예배 유형 필터 */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterType('ALL')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'ALL' ? 'bg-[#0F1A2E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C]/30'
            }`}
          >
            전체
          </button>
          {Object.entries(WORSHIP_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === key ? TAG_COLORS[key] : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C]/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 설교 목록 */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">로딩 중...</p>
        ) : filteredSermons.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">
              {searchQuery ? '검색 결과가 없습니다' : viewMode !== 'all' ? '이 기간에 설교가 없습니다' : '아직 설교가 없습니다'}
            </p>
            <p className="text-gray-400 text-sm mb-5">
              {searchQuery ? '다른 검색어로 시도해보세요' : '새 설교를 만들어 캐비넷을 채워보세요'}
            </p>
            {!searchQuery && (
              <button onClick={() => router.push('/sermons/new')} className="bg-[#C9A84C] text-[#0F1A2E] px-6 py-3 rounded-xl font-bold hover:bg-[#D4B85C] text-sm">
                첫 설교 만들기
              </button>
            )}
          </div>
        ) : viewMode === 'year' && groupedByMonth ? (
          /* 연도별 보기: 월별 그룹 */
          <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([month, items]) => (
              <div key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-[#C9A84C] rounded-full" />
                  <h3 className="text-sm font-semibold text-[#0F1A2E]">{month}</h3>
                  <span className="text-xs text-gray-400">{items.length}편</span>
                </div>
                <div className="space-y-2">
                  {items.map((s) => (
                    <SermonCard key={s.id} sermon={s} onClick={() => router.push(`/sermons/${s.id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSermons.map((s) => (
              <SermonCard key={s.id} sermon={s} onClick={() => router.push(`/sermons/${s.id}`)} />
            ))}
          </div>
        )}

        {/* 하단 통계 */}
        {!loading && sermons.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400">
              전체 <span className="font-semibold text-[#0F1A2E]">{sermons.length}</span>편의 설교가 캐비넷에 보관되어 있습니다
            </p>
          </div>
        )}
      </main>
      <PageHelp pageKey="sermonList" steps={HELP_DATA.sermonList} />
    </div>
  );
}

function SermonCard({ sermon: s, onClick }: { sermon: SermonItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C9A84C]/30 hover:shadow-md transition-all relative overflow-hidden"
    >
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C9A84C]/30 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{s.title}</h3>
          <p className="text-sm text-gray-500 mt-1">📖 {s.scripture}</p>
        </div>
        <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium ${TAG_COLORS[s.worshipType] || 'bg-gray-200 text-gray-700'}`}>
          {WORSHIP_LABEL[s.worshipType] || s.worshipType}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span>{new Date(s.targetDate).toLocaleDateString('ko-KR')}</span>
        <span>·</span>
        <span>{s.authorName}</span>
      </div>
    </button>
  );
}
