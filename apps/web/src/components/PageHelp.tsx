'use client';

import { useState, useEffect } from 'react';

interface HelpStep {
  title: string;
  desc: string;
  icon: string; // SVG path
}

interface PageHelpProps {
  pageKey: string; // 예: 'home', 'sermon-new', 'sermon-detail'
  steps: HelpStep[];
}

export default function PageHelp({ pageKey, steps }: PageHelpProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(`help_${pageKey}`);
    if (!seen) {
      // 약간 딜레이 후 표시 (페이지 로드 후 자연스럽게)
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [pageKey]);

  const handleClose = () => {
    setShow(false);
    setStep(0);
    localStorage.setItem(`help_${pageKey}`, 'true');
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: 'rgba(15,26,46,0.7)' }}>
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* 상단 바 */}
        <div className="bg-[#0F1A2E] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-xs text-[#C9A84C] font-semibold">도움말</span>
            {steps.length > 1 && <span className="text-[10px] text-[#5A6F8C]">{step + 1} / {steps.length}</span>}
          </div>
          <button onClick={handleClose} className="text-[#5A6F8C] hover:text-white text-xs">닫기</button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-[#0F1A2E] rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={current.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#0F1A2E] text-base mb-1.5">{current.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.desc}</p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-5 flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
              이전
            </button>
          )}
          {isLast ? (
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white">
              알겠습니다
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#0F1A2E] text-[#C9A84C]">
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 도움말 버튼 (각 페이지 헤더에 넣을 수 있음)
export function HelpButton({ pageKey, steps }: PageHelpProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <>
      <button onClick={() => { setShow(true); setStep(0); }}
        className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center hover:bg-[#C9A84C]/30 transition-colors"
        title="도움말">
        <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: 'rgba(15,26,46,0.7)' }}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-[#0F1A2E] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-xs text-[#C9A84C] font-semibold">도움말</span>
                {steps.length > 1 && <span className="text-[10px] text-[#5A6F8C]">{step + 1} / {steps.length}</span>}
              </div>
              <button onClick={() => setShow(false)} className="text-[#5A6F8C] hover:text-white text-xs">닫기</button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-[#0F1A2E] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={current.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#0F1A2E] text-base mb-1.5">{current.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.desc}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">이전</button>
              )}
              {isLast ? (
                <button onClick={() => setShow(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white">알겠습니다</button>
              ) : (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#0F1A2E] text-[#C9A84C]">다음</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 각 페이지별 도움말 데이터
export const HELP_DATA = {
  home: [
    { title: '홈 화면 안내', desc: '이번주 예배 현황, 최근 설교,\n다가오는 일정을 한눈에 볼 수 있습니다.', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { title: '이번주 예배', desc: '각 예배별 설교 준비 상태가 표시됩니다.\n"설교 만들기"를 누르면 바로 시작!', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { title: '빠른 작업', desc: '아래 버튼으로 원하는 기능에\n바로 접근할 수 있습니다.', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  ],
  sermonNew: [
    { title: '예배 선택', desc: '어떤 예배를 위한 설교인지\n선택해주세요.\n주일, 수요, 금요, 새벽, 특별예배 중\n하나를 고르시면 됩니다.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { title: '성경 본문 입력', desc: '설교하실 성경 구절을 입력하세요.\n\n예) 요한복음 3:16-18\n예) 시편 23편\n예) 로마서 8:28-30', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { title: 'AI가 설교를 생성합니다', desc: '"설교 생성하기"를 누르시면\nAI가 약 30~60초 안에\n설교 초안을 만들어 드립니다.\n\n생성된 초안은 반드시\n검토 후 수정하여 사용해주세요.', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  ],
  sermonDetail: [
    { title: '설교 편집', desc: '내용을 클릭하시면\n바로 수정할 수 있습니다.\n\n각 대지 옆 "예화 추가" 버튼으로\n구체적인 이야기를 추가할 수 있습니다.', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { title: '저장 및 내보내기', desc: '하단 버튼 사용법:\n\n• 저장 — 수정한 내용 저장\n• PPT — PPT 만들기용 파일 다운로드\n• PDF — 설교문 PDF로 저장/인쇄\n• 공유 — 다른 분께 보내기\n• AI 최종검토 — AI가 전체를 다듬기', icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' },
  ],
  calendar: [
    { title: '캘린더 사용법', desc: '날짜를 클릭하면\n새 일정을 등록할 수 있습니다.\n\n등록된 일정은 홈 화면\n"다가오는 일정"에 자동 표시됩니다.', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: '절기 안내', desc: '교회 절기(부활절, 성탄절 등)가\n자동으로 표시됩니다.\n\n절기를 클릭하면 해당 절기에 맞는\n설교를 바로 준비할 수 있습니다.', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  ],
  sermonList: [
    { title: '설교 캐비넷', desc: '지금까지 만든 설교를\n모두 볼 수 있습니다.\n\n주별, 월별, 연도별로\n정리해서 찾을 수 있습니다.', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ],
};
