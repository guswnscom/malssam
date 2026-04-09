export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <p className="text-blue-200 text-sm font-medium tracking-widest mb-4">
            AI 기반 설교 준비 도구
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            말씀동역
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-2">
            설교 준비, AI 동역자와 함께
          </p>
          <p className="text-lg sm:text-xl text-blue-100 mb-10">
            5분이면 충분합니다
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-block bg-amber-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30"
            >
              3개월 무료로 시작하기
            </a>
          </div>
          <p className="mt-4 text-sm text-blue-300">
            카드 등록 없이 바로 시작 · 대한예수교장로회 기준
          </p>
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
          설교 준비의 모든 과정을 돕습니다
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          본문 입력부터 PPT 완성까지, AI가 신학적으로 안전한 설교 초안을 준비합니다
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">&#9997;&#65039;</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">AI 설교 생성</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              예배 유형과 본문을 입력하면 서론, 3대지, 적용, 결론까지 구조화된 초안을 생성합니다
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">&#128260;</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">피드백 재생성</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              &ldquo;더 따뜻하게&rdquo;, &ldquo;청년부 느낌으로&rdquo; — 한마디면 AI가 즉시 수정합니다
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">&#128196;</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">PPT · PDF 출력</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              완성된 설교를 발표용 PPT와 인쇄용 PDF로 바로 다운로드할 수 있습니다
            </p>
          </div>
        </div>
      </section>

      {/* 요금제 */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            요금제
          </h2>
          <p className="text-center text-gray-500 mb-12">
            교회 하나가 결제하면, 모든 목회자가 함께 사용합니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 새싹 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-center">
              <h3 className="font-bold text-lg text-gray-900">새싹</h3>
              <p className="text-3xl sm:text-4xl font-bold mt-3 text-gray-900">월 5만원</p>
              <p className="text-sm text-gray-500 mt-1">30명 이하 교회</p>
              <ul className="text-sm text-gray-600 mt-6 space-y-3 text-left">
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 목회자 3명</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 설교 생성 월 20회</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> PDF · PPT 출력</li>
              </ul>
            </div>

            {/* 성장 (추천) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-blue-500 text-center relative shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-medium">
                추천
              </span>
              <h3 className="font-bold text-lg text-gray-900">성장</h3>
              <p className="text-3xl sm:text-4xl font-bold mt-3 text-blue-600">월 10만원</p>
              <p className="text-sm text-gray-500 mt-1">100명 이하 교회</p>
              <ul className="text-sm text-gray-600 mt-6 space-y-3 text-left">
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 목회자 5명</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 설교 생성 월 50회</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> PDF · PPT 출력</li>
              </ul>
            </div>

            {/* 열매 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-center">
              <h3 className="font-bold text-lg text-gray-900">열매</h3>
              <p className="text-3xl sm:text-4xl font-bold mt-3 text-gray-900">월 18만원</p>
              <p className="text-sm text-gray-500 mt-1">100명 이상 교회</p>
              <ul className="text-sm text-gray-600 mt-6 space-y-3 text-left">
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 목회자 10명</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 설교 생성 무제한</li>
                <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> PDF · PPT 출력</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          지금 바로 시작하세요
        </h2>
        <p className="text-gray-500 mb-8">
          3개월 무료체험 · 카드 등록 없이 · 5분이면 첫 설교 완성
        </p>
        <a
          href="/signup"
          className="inline-block bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
        >
          3개월 무료로 시작하기
        </a>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-400">
          <p>말씀동역 — 목회자의 설교 준비를 돕는 AI 동역자</p>
          <p className="mt-1">대한예수교장로회 기준 · 신학적 안전장치 내장</p>
        </div>
      </footer>
    </div>
  );
}
