'use client';

import { useState } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
        <rect x="42" y="8" width="16" height="84" rx="3" fill="#C9A84C"/>
        <rect x="15" y="30" width="70" height="16" rx="3" fill="#C9A84C"/>
      </svg>
    ),
    title: '말씀동역에 오신 것을\n환영합니다',
    desc: 'AI가 목사님의 설교 준비를 돕는\n보조 도구입니다.\n\n간단한 사용법을 안내해 드리겠습니다.',
    highlight: '',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="#C9A84C" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8m0 4v8m-6-14h12M6 18h12"/>
      </svg>
    ),
    title: '새 설교 만들기',
    desc: '1. 홈 화면에서 "새 설교" 또는\n   "설교 만들기"를 누르세요\n\n2. 예배 종류를 선택하세요\n   (주일, 수요, 금요, 새벽)\n\n3. 성경 본문을 입력하세요\n   예) 요한복음 3:16\n\n4. "설교 생성하기"를 누르면\n   AI가 30~60초 안에 설교 초안을\n   만들어 드립니다',
    highlight: '새 설교',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="#C9A84C" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
    ),
    title: '설교 편집하기',
    desc: '생성된 설교는 반드시\n목사님이 직접 검토해주세요.\n\n- 내용을 클릭하면 바로 수정 가능\n\n- "예화 추가" 버튼으로\n  각 대지에 이야기를 추가\n\n- "AI 최종검토" 버튼으로\n  전체 설교를 한 번 더 다듬기',
    highlight: '편집',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="#C9A84C" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    title: 'PPT / PDF 저장',
    desc: '완성된 설교를 활용하는 방법:\n\n- "PPT 프롬프트" 버튼\n  → 다운로드한 파일을\n  Gemini나 ChatGPT에 붙여넣으면\n  예배용 PPT를 만들어줍니다\n\n- "PDF 저장 및 보기" 버튼\n  → 설교문을 PDF로 저장하거나\n  다른 분께 공유할 수 있습니다',
    highlight: 'PPT',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="#C9A84C" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    title: '캘린더 일정 관리',
    desc: '교회 일정을 등록하고 관리하세요.\n\n- 캘린더에서 날짜를 클릭하면\n  일정을 등록할 수 있습니다\n\n- 등록된 일정은 홈 화면\n  "다가오는 일정"에 자동으로\n  표시됩니다\n\n- 절기별 추천 성경 본문도\n  자동으로 안내됩니다',
    highlight: '캘린더',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="#C9A84C" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    ),
    title: '준비가 완료되었습니다!',
    desc: '이제 설교 준비를 시작하세요.\n\nAI가 만든 초안은 반드시\n목사님이 검토하시고\n수정하여 사용해주세요.\n\n사용 중 궁금한 점이 있으시면\n홈 화면의 "사용법" 버튼을\n눌러 다시 보실 수 있습니다.',
    highlight: '',
  },
];

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('tutorialSeen', 'true');
    }
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem('tutorialSeen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,26,46,0.85)' }}>
      {/* 닫기 버튼 */}
      <button onClick={handleClose} className="absolute top-4 right-4 text-white/40 hover:text-white/80 z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* 상단 아이콘 영역 */}
        <div className="bg-[#0F1A2E] pt-8 pb-6 flex flex-col items-center">
          {/* 스텝 인디케이터 */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#C9A84C]' : i < step ? 'w-3 bg-[#C9A84C]/50' : 'w-3 bg-white/20'
              }`} />
            ))}
          </div>
          {/* 아이콘 */}
          <div className="w-20 h-20 flex items-center justify-center">
            {current.icon}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F1A2E] text-center mb-4 whitespace-pre-line leading-tight">
            {current.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 whitespace-pre-line leading-relaxed text-center">
            {current.desc}
          </p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          {isLast ? (
            <button onClick={handleFinish}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white hover:opacity-90 transition-all"
              style={{ boxShadow: '0 4px 14px rgba(201,168,76,0.3)' }}>
              설교 준비 시작하기
            </button>
          ) : (
            <div className="flex gap-3">
              {!isFirst && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-5 py-3.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                  이전
                </button>
              )}
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3.5 rounded-xl font-bold text-base bg-[#0F1A2E] text-[#C9A84C] hover:bg-[#1B2D4A] transition-all">
                {isFirst ? '사용법 보기' : '다음'}
              </button>
            </div>
          )}

          {/* 다시 보지 않기 */}
          {!isLast && (
            <label className="flex items-center justify-center gap-2 mt-4 cursor-pointer select-none">
              <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]/30" />
              <span className="text-xs text-gray-400">다음부터 자동으로 표시하지 않기</span>
            </label>
          )}

          {/* 스킵 */}
          {!isLast && (
            <button onClick={handleClose} className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600">
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
