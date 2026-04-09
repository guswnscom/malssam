'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const SIZES = [
  { value: 'UNDER_10', label: '10명 이내' },
  { value: 'UNDER_20', label: '20명 이내' },
  { value: 'UNDER_30', label: '30명 이내' },
  { value: 'UNDER_50', label: '50명 이내' },
  { value: 'OVER_100', label: '100명 이상' },
];

const WORSHIP_TYPES = [
  { value: 'SUNDAY', label: '주일예배' },
  { value: 'WEDNESDAY', label: '수요예배' },
  { value: 'FRIDAY', label: '금요예배' },
  { value: 'DAWN', label: '새벽예배' },
  { value: 'SPECIAL', label: '특별예배' },
];

const STYLES = [
  { value: 'CONSERVATIVE', label: '보수적' },
  { value: 'BALANCED', label: '균형' },
  { value: 'PROGRESSIVE', label: '개방적' },
];

const CONGREGATION_TYPES = [
  { value: 'YOUTH', label: '청년 중심' },
  { value: 'ADULT', label: '장년 중심' },
  { value: 'FAMILY', label: '가족 중심' },
  { value: 'SMALL_COMMUNITY', label: '소형 공동체' },
];

export default function OnboardingChurchPage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    sizeCategory: 'UNDER_50',
    worshipTypes: ['SUNDAY'] as string[],
    sermonStyle: 'BALANCED',
    congregationType: 'ADULT',
  });

  const toggleWorship = (type: string) => {
    setForm((prev) => ({
      ...prev,
      worshipTypes: prev.worshipTypes.includes(type)
        ? prev.worshipTypes.filter((t) => t !== type)
        : [...prev.worshipTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.worshipTypes.length === 0) {
      setError('최소 1개 예배를 선택해주세요');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/churches', form);
      if (user) {
        setAuth(user, data.church.id, data.membership.role);
      }
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || '교회 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || '우리교회',
    }));
    // 건너뛰기 시 기본값으로 등록
    const defaultForm = {
      name: form.name || '우리교회',
      sizeCategory: 'UNDER_50',
      worshipTypes: ['SUNDAY'],
      sermonStyle: 'BALANCED',
      congregationType: 'ADULT',
    };
    try {
      setLoading(true);
      const { data } = await api.post('/churches', defaultForm);
      if (user) {
        setAuth(user, data.church.id, data.membership.role);
      }
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || '교회 등록에 실패했습니다');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">교회 정보를 설정해주세요</h1>
          <p className="text-gray-500 mt-2">AI 설교 품질에 반영됩니다</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          {/* 교회명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">교회명 *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="교회명을 입력하세요"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* 교회 규모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">교회 규모</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.sizeCategory}
              onChange={(e) => setForm({ ...form, sizeCategory: e.target.value })}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* 예배 종류 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">예배 종류 (최소 1개)</label>
            <div className="flex flex-wrap gap-2">
              {WORSHIP_TYPES.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => toggleWorship(w.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    form.worshipTypes.includes(w.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 설교 스타일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">설교 스타일</label>
            <div className="flex gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, sermonStyle: s.value })}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    form.sermonStyle === s.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 회중 특성 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">회중 특성</label>
            <div className="grid grid-cols-2 gap-2">
              {CONGREGATION_TYPES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, congregationType: c.value })}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                    form.congregationType === c.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? '설정 중...' : '시작하기'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              건너뛰기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
