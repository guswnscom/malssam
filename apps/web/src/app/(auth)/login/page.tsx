'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const meRes = await api.get('/auth/me');
      const me = meRes.data;
      setAuth(me, me.churchId, me.role);
      router.push(me.churchId ? '/home' : '/onboarding/church');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 — 브랜딩 */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1A2E] relative items-center justify-center">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C9A84C 0%, transparent 60%)' }} />
        <div className="relative text-center px-12">
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mb-8" />
          <h1 className="heading-serif text-4xl text-white mb-4">말씀동역</h1>
          <p className="text-[#8B9DC3] text-lg mb-2">설교 준비, AI 동역자와 함께</p>
          <p className="text-[#5A6F8C] text-sm">대한예수교장로회 기준 · 신학적 안전장치 내장</p>
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mt-8" />
        </div>
      </div>

      {/* 오른쪽 — 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="heading-serif text-3xl text-[#0F1A2E] mb-1">말씀동역</h1>
            <p className="text-sm text-gray-500">AI 기반 설교 준비 도구</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">로그인</h2>
          <p className="text-sm text-gray-500 mb-8">계정에 로그인하여 설교 준비를 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input type="email" required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                placeholder="이메일을 입력하세요"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input type="password" required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                placeholder="비밀번호를 입력하세요"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-[#0F1A2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1B2D4A] disabled:bg-gray-300 transition-colors text-sm">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            계정이 없으신가요? <Link href="/signup" className="text-[#C9A84C] font-medium hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
