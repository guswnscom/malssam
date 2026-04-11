'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Tab = 'email' | 'password';

export default function FindAccountPage() {
  const [tab, setTab] = useState<Tab>('email');

  // 이메일 찾기
  const [name, setName] = useState('');
  const [foundEmails, setFoundEmails] = useState<Array<{ email: string; name: string }> | null>(null);
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // 비밀번호 재설정 (3단계)
  const [resetStep, setResetStep] = useState(1); // 1: 이메일, 2: 코드, 3: 새 비밀번호
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(''); setFoundEmails(null); setEmailLoading(true);
    try {
      const { data } = await api.post('/auth/find-email', { name: name.trim() });
      setFoundEmails(data);
    } catch (err: any) {
      setEmailError(err.response?.data?.message || '계정을 찾을 수 없습니다');
    } finally { setEmailLoading(false); }
  };

  // 1단계: 인증 코드 요청
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwLoading(true);
    try {
      await api.post('/auth/request-reset', { email: resetEmail.trim() });
      setResetStep(2);
    } catch (err: any) {
      setPwError(err.response?.data?.message || '요청에 실패했습니다');
    } finally { setPwLoading(false); }
  };

  // 2단계: 코드 검증
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwLoading(true);
    try {
      await api.post('/auth/verify-reset', { email: resetEmail.trim(), code: resetCode.trim() });
      setResetStep(3);
    } catch (err: any) {
      setPwError(err.response?.data?.message || '인증 코드가 올바르지 않습니다');
    } finally { setPwLoading(false); }
  };

  // 3단계: 비밀번호 변경
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPassword.length < 8) { setPwError('비밀번호는 8자 이상이어야 합니다'); return; }
    if (newPassword !== confirmPassword) { setPwError('비밀번호가 일치하지 않습니다'); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/reset-password', { email: resetEmail.trim(), code: resetCode.trim(), newPassword });
      setPwSuccess(true);
    } catch (err: any) {
      setPwError(err.response?.data?.message || '비밀번호 변경에 실패했습니다');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜딩 */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1A2E] relative items-center justify-center">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C9A84C 0%, transparent 60%)' }} />
        <div className="relative text-center px-12">
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mb-8" />
          <h1 className="heading-serif text-4xl text-white mb-4">말씀동역</h1>
          <p className="text-[#8B9DC3] text-lg mb-2">설교 준비, AI 동역자와 함께</p>
          <p className="text-[#5A6F8C] text-sm">계정 정보를 찾아드립니다</p>
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mt-8" />
        </div>
      </div>

      {/* 오른쪽 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <h1 className="heading-serif text-3xl text-[#0F1A2E] mb-1">말씀동역</h1>
            <p className="text-sm text-gray-500">계정 찾기</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">계정 찾기</h2>
          <p className="text-sm text-gray-500 mb-6">이메일 또는 비밀번호를 찾아보세요</p>

          {/* 탭 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            <button onClick={() => { setTab('email'); setFoundEmails(null); setEmailError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'email' ? 'bg-[#0F1A2E] text-[#C9A84C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              이메일 찾기
            </button>
            <button onClick={() => { setTab('password'); setPwError(''); setPwSuccess(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'password' ? 'bg-[#0F1A2E] text-[#C9A84C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              비밀번호 재설정
            </button>
          </div>

          {/* 이메일 찾기 */}
          {tab === 'email' && (
            <div>
              <form onSubmit={handleFindEmail} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">가입 시 사용한 이름</label>
                  <input type="text" required minLength={2}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                    placeholder="이름을 입력하세요"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                <button type="submit" disabled={emailLoading}
                  className="w-full bg-[#0F1A2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1B2D4A] disabled:bg-gray-300 transition-colors text-sm">
                  {emailLoading ? '찾는 중...' : '이메일 찾기'}
                </button>
              </form>

              {foundEmails && (
                <div className="mt-6 bg-white rounded-2xl border border-[#C9A84C]/20 p-5">
                  <h3 className="text-sm font-semibold text-[#0F1A2E] mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#C9A84C] rounded-full" />
                    찾은 계정
                  </h3>
                  <div className="space-y-3">
                    {foundEmails.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#FAFAF8] rounded-xl p-3">
                        <div className="w-9 h-9 bg-[#0F1A2E] rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.email}</p>
                          <p className="text-xs text-gray-400">{u.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/login"
                    className="block text-center mt-4 text-sm text-[#C9A84C] font-medium hover:underline">
                    로그인하러 가기 →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 비밀번호 재설정 */}
          {tab === 'password' && (
            <div>
              {pwSuccess ? (
                <div className="bg-white rounded-2xl border border-[#C9A84C]/20 p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">비밀번호가 변경되었습니다</h3>
                  <p className="text-sm text-gray-500 mb-5">새 비밀번호로 로그인하세요</p>
                  <Link href="/login"
                    className="inline-block bg-[#0F1A2E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#1B2D4A] text-sm">
                    로그인하기
                  </Link>
                </div>
              ) : resetStep === 1 ? (
                <form onSubmit={handleRequestCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">가입한 이메일</label>
                    <input type="email" required
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                      placeholder="가입한 이메일을 정확히 입력하세요"
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                  </div>
                  {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                  <button type="submit" disabled={pwLoading}
                    className="w-full bg-[#0F1A2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1B2D4A] disabled:bg-gray-300 transition-colors text-sm">
                    {pwLoading ? '발송 중...' : '인증 코드 받기'}
                  </button>
                </form>
              ) : resetStep === 2 ? (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">{resetEmail}로 발송된 6자리 코드를 입력하세요 (10분 유효)</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">인증 코드</label>
                    <input type="text" required maxLength={6} pattern="[0-9]{6}"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="000000"
                      value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </div>
                  {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                  <button type="submit" disabled={pwLoading || resetCode.length !== 6}
                    className="w-full bg-[#0F1A2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1B2D4A] disabled:bg-gray-300 transition-colors text-sm">
                    {pwLoading ? '확인 중...' : '코드 확인'}
                  </button>
                  <button type="button" onClick={() => { setResetStep(1); setPwError(''); }} className="w-full text-center text-xs text-gray-400 hover:text-gray-600">이메일 다시 입력</button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <p className="text-sm text-green-600 bg-green-50 rounded-xl p-3">인증 완료! 새 비밀번호를 입력하세요.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호</label>
                    <input type="password" required minLength={8}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                      placeholder="8자 이상"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호 확인</label>
                    <input type="password" required minLength={8}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] outline-none text-sm"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                  <button type="submit" disabled={pwLoading}
                    className="w-full bg-[#0F1A2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1B2D4A] disabled:bg-gray-300 transition-colors text-sm">
                    {pwLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-[#C9A84C] font-medium hover:underline">로그인</Link>
            <span className="mx-2 text-gray-300">|</span>
            <Link href="/signup" className="text-[#C9A84C] font-medium hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
