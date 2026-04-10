'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SermonItem {
  id: string;
  title: string;
  scripture: string;
  worshipType: string;
  targetDate: string;
  authorName: string;
  createdAt: string;
}

const WORSHIP_LABEL: Record<string, string> = {
  SUNDAY: '주일예배', WEDNESDAY: '수요예배', FRIDAY: '금요예배',
  DAWN: '새벽예배', SPECIAL: '특별예배',
};

export default function SermonsListPage() {
  const router = useRouter();
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sermons').then(({ data }) => setSermons(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-[#0F1A2E] px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/home')} className="text-[#8B9DC3] hover:text-white">← 홈</button>
          <h1 className="text-lg font-semibold text-white">설교 목록</h1>
          <button onClick={() => router.push('/sermons/new')} className="bg-[#C9A84C] text-[#0F1A2E] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#D4B85C]">
            + 새 설교
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <p className="text-center text-gray-500 py-12">로딩 중...</p>
        ) : sermons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-gray-500 mb-4">아직 설교가 없습니다</p>
            <button onClick={() => router.push('/sermons/new')} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              첫 설교 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sermons.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/sermons/${s.id}`)}
                className="w-full text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C9A84C]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{s.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">📖 {s.scripture}</p>
                  </div>
                  <span className="flex-shrink-0 bg-[#0F1A2E] text-[#C9A84C] text-xs px-2.5 py-1 rounded-lg font-medium">
                    {WORSHIP_LABEL[s.worshipType] || s.worshipType}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{new Date(s.targetDate).toLocaleDateString('ko-KR')}</span>
                  <span>·</span>
                  <span>{s.authorName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
