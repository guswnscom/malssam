export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero — 깊은 네이비 + 골드 악센트 */}
      <section className="relative overflow-hidden bg-[#0F1A2E]">
        {/* 배경 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1A2E] via-[#1B2D4A] to-[#0F1A2E]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #C9A84C 0%, transparent 50%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-36 text-center">
          {/* 골드 라인 */}
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mb-8" />

          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase mb-6">
            AI 기반 설교 준비 도구
          </p>

          <h1 className="heading-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight tracking-tight">
            말씀동역
          </h1>

          <p className="text-lg text-[#8B9DC3] mb-2">설교 준비, AI 동역자와 함께</p>
          <p className="text-lg text-[#8B9DC3] mb-12">5분이면 충분합니다</p>

          <a href="/login"
            className="inline-block bg-[#C9A84C] text-[#0F1A2E] px-10 py-4 rounded-lg text-lg font-bold hover:bg-[#D4B85C] transition-all shadow-lg">
            시작하기
          </a>

          <p className="mt-5 text-sm text-[#5A6F8C]">처음 5편 무료 · 대한예수교장로회 기준</p>

          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mt-12" />
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-16">
          <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
          <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-4">설교 준비의 모든 과정을 돕습니다</h2>
          <p className="text-gray-500 max-w-lg mx-auto">본문 입력부터 PPT 완성까지, AI가 신학적으로 안전한 설교 초안을 준비합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '✍️', title: 'AI 설교 생성', desc: '예배 유형과 본문을 입력하면 서론, 3대지, 적용, 결론까지 구조화된 초안을 생성합니다' },
            { icon: '🔄', title: '피드백 재생성', desc: '"더 따뜻하게", "청년부 느낌으로" — 한마디면 AI가 즉시 수정합니다' },
            { icon: '📄', title: 'PPT · PDF 출력', desc: '완성된 설교를 PPT 프롬프트와 인쇄용 PDF로 바로 다운로드할 수 있습니다' },
          ].map((f, i) => (
            <div key={i} className="text-center p-8 rounded-2xl border border-gray-100 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#FFF8E7] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 요금제 */}
      <section className="bg-[#FAFAF8] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
            <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-4">요금제</h2>
            <p className="text-gray-500">처음 5편은 무료. 필요한 만큼만 결제하세요</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: '무료', price: '0원', sub: '처음 시작', count: '5편', color: 'text-green-600', border: 'border-green-200' },
              { name: '5편', price: '5만원', sub: '약 1개월', count: '5편', color: 'text-gray-900', border: 'border-gray-200' },
              { name: '10편', price: '10만원', sub: '약 2개월', count: '10편', color: 'text-[#C9A84C]', border: 'border-[#C9A84C]', recommended: true },
              { name: '20편', price: '20만원', sub: '약 4개월', count: '20편', color: 'text-gray-900', border: 'border-gray-200' },
            ].map((p, i) => (
              <div key={i} className={`bg-white p-5 sm:p-6 rounded-2xl border ${p.border} text-center relative ${p.recommended ? 'shadow-lg ring-1 ring-[#C9A84C]/20' : ''}`}>
                {p.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-white text-xs px-3 py-1 rounded-full">추천</span>}
                <h3 className="font-bold text-base text-gray-900">{p.name}</h3>
                <p className={`text-2xl sm:text-3xl font-bold mt-2 ${p.color}`}>{p.price}</p>
                <p className="text-xs text-gray-400 mt-1">{p.sub}</p>
                <p className="text-sm text-gray-600 mt-3 font-medium">설교 {p.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
        <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-8" />
        <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-4">지금 바로 시작하세요</h2>
        <p className="text-gray-500 mb-10">처음 5편 무료 · 카드 등록 없이 · 5분이면 첫 설교 완성</p>
        <a href="/login"
          className="inline-block bg-[#0F1A2E] text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-[#1B2D4A] transition-all">
          시작하기
        </a>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-10 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">말씀동역 — 목회자의 설교 준비를 돕는 AI 동역자</p>
          <p className="text-xs text-gray-300 mt-1">대한예수교장로회 기준 · 신학적 안전장치 내장</p>
        </div>
      </footer>
    </div>
  );
}
