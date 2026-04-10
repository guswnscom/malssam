'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CalEvent {
  id: string; title: string; date: string; endDate?: string;
  eventType: string; worshipType?: string; needsSermon: boolean;
  sermonId?: string; scripture?: string; description?: string;
  reminderDays: number[]; color?: string; isLiturgical: boolean;
  authorName?: string;
}
interface LitEvent { date: string; title: string; scripture: string; color: string; }

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const REMINDER_OPTIONS = [
  { value: 1, label: '1일 전' }, { value: 2, label: '2일 전' }, { value: 3, label: '3일 전' },
  { value: 5, label: '5일 전' }, { value: 7, label: '1주일 전' }, { value: 14, label: '2주일 전' },
];

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [litEvents, setLitEvents] = useState<LitEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', date: '', worshipType: '', needsSermon: false, scripture: '', description: '', reminderDays: [] as number[] });

  const fetchEvents = async () => {
    try {
      const { data } = await api.get(`/calendar/events?year=${year}&month=${month}`);
      setEvents(data.events || []);
      setLitEvents(data.liturgical || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [year, month]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  // 월간 달력 데이터
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const getDateStr = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getEventsForDay = (d: number) => {
    const ds = getDateStr(d);
    const custom = events.filter(e => e.date.startsWith(ds));
    const lit = litEvents.filter(e => e.date === ds);
    return { custom, lit };
  };

  const handleAdd = async () => {
    if (!newEvent.title || !newEvent.date) { alert('제목과 날짜를 입력해주세요'); return; }
    try {
      await api.post('/calendar/events', newEvent);
      setShowAdd(false);
      setNewEvent({ title: '', date: '', worshipType: '', needsSermon: false, scripture: '', description: '', reminderDays: [] });
      fetchEvents();
    } catch { alert('일정 추가 실패'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try { await api.delete(`/calendar/events/${id}`); fetchEvents(); } catch { alert('삭제 실패'); }
  };

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/home')} className="text-gray-500">← 홈</button>
          <h1 className="text-lg font-semibold">교회 캘린더</h1>
          <button onClick={() => { setShowAdd(true); setNewEvent(prev => ({ ...prev, date: selectedDate || getDateStr(today.getDate()) })); }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            + 일정 추가
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-gray-500 hover:text-gray-700 text-lg px-3">◀</button>
          <h2 className="text-xl font-bold text-gray-900">{year}년 {month}월</h2>
          <button onClick={nextMonth} className="text-gray-500 hover:text-gray-700 text-lg px-3">▶</button>
        </div>

        {/* 달력 그리드 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-50">
            {DAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
            ))}
          </div>
          {/* 날짜 */}
          <div className="grid grid-cols-7">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="min-h-[80px] sm:min-h-[100px] border-t border-r border-gray-100" />;
              const { custom, lit } = getEventsForDay(day);
              const dayOfWeek = new Date(year, month - 1, day).getDay();
              return (
                <div key={day}
                  onClick={() => { setSelectedDate(getDateStr(day)); }}
                  className={`min-h-[80px] sm:min-h-[100px] border-t border-r border-gray-100 p-1 cursor-pointer hover:bg-blue-50 transition-colors ${
                    isToday(day) ? 'bg-blue-50' : ''
                  } ${selectedDate === getDateStr(day) ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                >
                  <span className={`text-xs sm:text-sm font-medium ${
                    isToday(day) ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' :
                    dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {lit.map((e, j) => (
                      <div key={`l${j}`} className="text-[10px] sm:text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: e.color + '20', color: e.color }}>
                        {e.title}
                      </div>
                    ))}
                    {custom.map(e => (
                      <div key={e.id} className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded truncate">
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 일정 */}
        {selectedDate && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{selectedDate} 일정</h3>
            {(() => {
              const d = parseInt(selectedDate.split('-')[2]);
              const { custom, lit } = getEventsForDay(d);
              if (custom.length === 0 && lit.length === 0) return <p className="text-sm text-gray-500">등록된 일정이 없습니다</p>;
              return (
                <div className="space-y-2">
                  {lit.map((e, i) => (
                    <div key={`li${i}`} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: e.color + '10' }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: e.color }}>{e.title}</span>
                        {e.scripture && (
                          <button onClick={() => router.push(`/sermons/new?scripture=${encodeURIComponent(e.scripture)}&hint=${encodeURIComponent(e.title)}`)}
                            className="ml-2 text-xs text-blue-600 hover:underline">📖 {e.scripture} → 설교 준비</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {custom.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{e.title}</span>
                        {e.worshipType && <span className="ml-2 text-xs text-blue-600">{e.worshipType}</span>}
                        {e.scripture && <span className="ml-2 text-xs text-gray-500">📖 {e.scripture}</span>}
                        {e.needsSermon && !e.sermonId && (
                          <button onClick={() => router.push(`/sermons/new?scripture=${encodeURIComponent(e.scripture || '')}&hint=${encodeURIComponent(e.title)}`)}
                            className="ml-2 text-xs text-amber-600 hover:underline">⚠️ 설교 준비 필요</button>
                        )}
                        {e.reminderDays.length > 0 && (
                          <span className="ml-2 text-xs text-gray-400">🔔 {e.reminderDays.map(d => `${d}일 전`).join(', ')}</span>
                        )}
                      </div>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    </div>
                  ))}
                </div>
              );
            })()}
            <button onClick={() => { setShowAdd(true); setNewEvent(prev => ({ ...prev, date: selectedDate })); }}
              className="mt-3 w-full py-2 rounded-lg text-sm text-blue-600 border border-blue-200 hover:bg-blue-50">
              + 이 날짜에 일정 추가
            </button>
          </div>
        )}
      </main>

      {/* 일정 추가 모달 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">새 일정 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="예: 부흥회, 특별집회"
                  value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border text-sm"
                  value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예배 유형</label>
                <select className="w-full px-3 py-2 rounded-lg border text-sm"
                  value={newEvent.worshipType} onChange={e => setNewEvent({ ...newEvent, worshipType: e.target.value })}>
                  <option value="">선택 안 함</option>
                  <option value="SUNDAY">주일예배</option><option value="WEDNESDAY">수요예배</option>
                  <option value="FRIDAY">금요예배</option><option value="DAWN">새벽예배</option>
                  <option value="SPECIAL">특별예배</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="needsSermon" checked={newEvent.needsSermon}
                  onChange={e => setNewEvent({ ...newEvent, needsSermon: e.target.checked })} />
                <label htmlFor="needsSermon" className="text-sm text-gray-700">설교 준비 필요</label>
              </div>

              {newEvent.needsSermon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">추천 성경구절</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="예: 요한복음 3:16"
                    value={newEvent.scripture} onChange={e => setNewEvent({ ...newEvent, scripture: e.target.value })} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea className="w-full px-3 py-2 rounded-lg border text-sm resize-none" rows={2}
                  value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">알림 받기</label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => {
                        setNewEvent(prev => ({
                          ...prev,
                          reminderDays: prev.reminderDays.includes(opt.value)
                            ? prev.reminderDays.filter(d => d !== opt.value)
                            : [...prev.reminderDays, opt.value],
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        newEvent.reminderDays.includes(opt.value)
                          ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700">추가</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
