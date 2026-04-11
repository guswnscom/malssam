export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-[#0F1A2E]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1A2E] via-[#1B2D4A] to-[#0F1A2E]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #C9A84C 0%, transparent 50%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-32 text-center">
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mb-8" />
          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase mb-6">대한예수교장로회 기준 · AI 설교 준비 도구</p>

          <h1 className="heading-serif text-3xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            설교 준비 시간,<br/>
            <span className="text-[#C9A84C]">절반으로</span> 줄여드립니다
          </h1>

          <p className="text-base sm:text-lg text-[#8B9DC3] mb-4 max-w-lg mx-auto">
            성경 본문만 입력하세요.<br/>
            AI가 신학적으로 검증된 설교 초안을 5분 안에 준비합니다.
          </p>
          <p className="text-sm text-[#5A6F8C] mb-10">목사님이 직접 검토하고 수정하는 &ldquo;보조 도구&rdquo;입니다</p>

          <a href="/signup"
            className="inline-block bg-[#C9A84C] text-[#0F1A2E] px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#D4B85C] transition-all shadow-lg shadow-[#C9A84C]/20">
            지금 무료로 설교 만들어보기
          </a>
          <p className="mt-4 text-xs text-[#5A6F8C]">카드 등록 없이 · 3편 무료 · 가입 후 바로 시작</p>

          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mt-12" />
        </div>
      </section>

      {/* ═══ 이렇게 만들어집니다 (결과물 미리보기) ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
          <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-3">이런 설교가 만들어집니다</h2>
          <p className="text-gray-500 text-sm">실제 AI가 생성한 설교 초안 예시입니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 주일 설교 샘플 */}
          <div className="bg-[#0F1A2E] rounded-2xl p-6 sm:p-8">
            <span className="bg-[#C9A84C] text-[#0F1A2E] text-[10px] font-bold px-2.5 py-0.5 rounded-full">주일예배</span>
            <h3 className="text-white font-bold text-lg mt-3 mb-1">빛 되신 말씀, 오늘도 비추다</h3>
            <p className="text-[#C9A84C] text-sm mb-3">요한복음 1:1-5</p>
            <div className="space-y-2 text-[#8B9DC3] text-sm leading-relaxed">
              <p className="border-l-2 border-[#C9A84C]/30 pl-3"><strong className="text-white">서론:</strong> 우리가 매일 아침 눈을 뜰 때, 가장 먼저 찾는 것은 빛입니다. 어둠 속에서는 아무것도 볼 수 없기에...</p>
              <p className="border-l-2 border-[#C9A84C]/30 pl-3"><strong className="text-white">대지 1:</strong> 태초의 말씀 — 하나님과 함께 계신 그리스도</p>
              <p className="border-l-2 border-[#C9A84C]/30 pl-3"><strong className="text-white">대지 2:</strong> 생명의 빛 — 어둠이 이기지 못하는 이유</p>
              <p className="border-l-2 border-[#C9A84C]/30 pl-3"><strong className="text-white">적용:</strong> 이번 한 주, 매일 아침 5분 말씀 묵상으로...</p>
            </div>
            <p className="text-[10px] text-[#5A6F8C] mt-4">* 실제 생성된 설교의 요약본입니다. 전체 설교는 서론, 3대지, 적용, 결론으로 구성됩니다.</p>
          </div>

          {/* 수요 설교 + PPT */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">수요예배</span>
              <h3 className="font-bold text-lg text-gray-900 mt-3 mb-1">두려움 너머의 믿음</h3>
              <p className="text-[#C9A84C] text-sm mb-3">이사야 41:10</p>
              <p className="text-gray-500 text-sm leading-relaxed">두려워하지 말라, 내가 너와 함께 함이라 — 하나님의 약속은 상황이 아니라 관계에 기반합니다...</p>
            </div>

            <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#C9A84C]/10 rounded-2xl border border-[#C9A84C]/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
                <span className="text-sm font-bold text-[#8B6914]">PPT도 함께 만들어집니다</span>
              </div>
              <p className="text-sm text-gray-600">생성된 설교에서 PPT 프롬프트를 다운로드하면, Gemini나 ChatGPT에 붙여넣어 예배용 슬라이드를 바로 만들 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3단계 사용 시나리오 ═══ */}
      <section className="bg-[#0F1A2E] py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
            <h2 className="heading-serif text-2xl sm:text-3xl text-white mb-3">5분이면 충분합니다</h2>
            <p className="text-[#8B9DC3] text-sm">복잡한 설정 없이 바로 시작하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', time: '1분', title: '본문 입력', desc: '예배 유형을 선택하고\n성경 구절을 입력하세요', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { step: '2', time: '3분', title: 'AI가 설교를 준비', desc: '서론부터 결론까지\n구조화된 초안을 생성합니다', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { step: '3', time: '1분', title: '검토 · 수정 · 완성', desc: '직접 편집하고\nPPT · PDF로 내보내세요', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            ].map((s, i) => (
              <div key={i} className="bg-[#1B2D4A] rounded-2xl p-6 sm:p-8 text-center relative">
                <div className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-4 text-[#0F1A2E] font-bold text-sm">{s.step}</div>
                <div className="w-12 h-12 border border-[#C9A84C]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#C9A84C]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon}/></svg>
                </div>
                <span className="text-[#C9A84C] text-xs font-semibold">{s.time}</span>
                <h3 className="text-white font-bold text-lg mt-1 mb-2">{s.title}</h3>
                <p className="text-[#8B9DC3] text-sm whitespace-pre-line">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 신뢰 요소 ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
          <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-3">목사님들이 직접 사용해보셨습니다</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { name: '김○○ 목사', church: '서울 소재 교회', text: '월요일에 본문만 넣으면 화요일 아침에 설교 초안이 완성되어 있습니다. 나머지 시간은 기도와 묵상에 집중할 수 있게 되었습니다.' },
            { name: '이○○ 전도사', church: '경기 소재 교회', text: '수요예배, 금요예배까지 매주 3편을 준비해야 하는데, 시간적 부담이 크게 줄었습니다. 특히 참조 성경구절을 함께 제시해주는 점이 좋습니다.' },
            { name: '박○○ 목사', church: '부산 소재 교회', text: 'AI가 만든 초안을 그대로 쓰는 게 아니라, 제 스타일로 다듬어 사용합니다. 설교 준비의 좋은 출발점이 됩니다.' },
          ].map((r, i) => (
            <div key={i} className="bg-[#FAFAF8] rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(s => <svg key={s} className="w-4 h-4 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.church}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 신학적 안전장치 */}
        <div className="bg-[#0F1A2E] rounded-2xl p-8 sm:p-10">
          <h3 className="text-white font-bold text-xl mb-6 text-center">신학적 안전장치가 내장되어 있습니다</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'AI는 설교를 &ldquo;대신&rdquo;하지 않습니다. 검토와 수정을 위한 초안만 제공합니다.',
              '대한예수교장로회 정통 개혁신학 기준으로 작동합니다.',
              '오직 믿음, 오직 은혜, 오직 그리스도의 구원론을 따릅니다.',
              '번영신학, 이단 교리, 정치적 표현을 자동으로 차단합니다.',
              '성경에 없는 구절을 만들어내지 않도록 5단계 검증을 거칩니다.',
              '논쟁적 주제는 단정하지 않고 다양한 견해를 존중합니다.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
                <p className="text-sm text-[#8B9DC3]" dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 요금제 ═══ */}
      <section className="bg-[#FAFAF8] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
            <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900 mb-3">합리적인 요금제</h2>
            <p className="text-gray-500 text-sm">교회 규모에 맞게 선택하세요. 무료로 먼저 사용해보세요.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: '무료', price: '0', unit: '원', sub: '시작하기', features: ['설교 생성 3편', '설교 분석 2회', 'PDF 출력', '기본 도움말'], cta: '무료로 시작', ctaStyle: 'bg-white text-[#0F1A2E] border border-gray-200 hover:bg-gray-50' },
              { name: '기본', price: '29,000', unit: '원/월', sub: '소형 교회', features: ['설교 생성 15편/월', '설교 분석 무제한', 'PPT 프롬프트', 'PDF 출력', 'AI 최종검토', '캘린더 일정관리'], cta: '기본 플랜 시작', ctaStyle: 'bg-[#0F1A2E] text-white hover:bg-[#1B2D4A]', recommended: true },
              { name: '프리미엄', price: '49,000', unit: '원/월', sub: '중대형 교회', features: ['설교 생성 무제한', '설교 분석 무제한', 'PPT 프롬프트', 'PDF 출력', 'AI 최종검토', '캘린더 일정관리', '목회자 3인 사용', '우선 지원'], cta: '프리미엄 시작', ctaStyle: 'bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white' },
            ].map((p, i) => (
              <div key={i} className={`bg-white rounded-2xl p-6 sm:p-8 relative ${p.recommended ? 'ring-2 ring-[#C9A84C] shadow-xl' : 'border border-gray-100'}`}>
                {p.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0F1A2E] text-xs font-bold px-4 py-1 rounded-full">가장 인기</span>}
                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{p.sub}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#0F1A2E]">{p.price}</span>
                  <span className="text-sm text-gray-400">{p.unit}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#C9A84C] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/signup" className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${p.ctaStyle}`}>{p.cta}</a>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">모든 플랜은 7일 환불 보장 · 언제든 해지 가능 · 카드 등록 없이 무료 시작</p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="w-8 h-0.5 bg-[#C9A84C] mx-auto mb-6" />
          <h2 className="heading-serif text-2xl sm:text-3xl text-gray-900">자주 묻는 질문</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: 'AI가 설교를 대신 해주는 건가요?', a: '아닙니다. 말씀동역은 설교를 &ldquo;대신&rdquo;하는 도구가 아닙니다. 목사님이 검토하고 수정할 수 있는 &ldquo;초안&rdquo;을 제공하는 보조 도구입니다. 최종 설교는 반드시 목사님의 기도와 묵상을 거쳐야 합니다.' },
            { q: '신학적으로 안전한가요?', a: '대한예수교장로회 정통 개혁신학을 기준으로 설계되었습니다. 번영신학, 이단 교리, 정치적 표현을 자동으로 차단하며, 성경 구절 정확성을 5단계로 검증합니다.' },
            { q: '같은 본문으로 여러 번 생성하면 같은 결과가 나오나요?', a: '아닙니다. 매번 다른 접근 방식(역사적 배경, 인물 감정, 현대 적용 등)으로 새로운 설교를 생성합니다.' },
            { q: '개인정보는 안전한가요?', a: '모든 데이터는 암호화되어 저장되며, 설교 내용은 외부에 공유되지 않습니다. 인증 토큰은 단기 만료 방식으로 운영됩니다.' },
            { q: '해지는 어떻게 하나요?', a: '설정에서 언제든 해지할 수 있으며, 해지 후에도 이미 생성된 설교는 계속 열람할 수 있습니다.' },
          ].map((faq, i) => (
            <details key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-50">
                {faq.q}
                <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ 최종 CTA ═══ */}
      <section className="bg-[#0F1A2E] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto mb-8" />
          <h2 className="heading-serif text-2xl sm:text-3xl text-white mb-4">이번 주 설교,<br/>지금 시작하세요</h2>
          <p className="text-[#8B9DC3] mb-10">카드 등록 없이 무료로 시작 · 3편 무료 체험</p>
          <a href="/signup"
            className="inline-block bg-[#C9A84C] text-[#0F1A2E] px-12 py-4 rounded-xl text-lg font-bold hover:bg-[#D4B85C] transition-all shadow-lg shadow-[#C9A84C]/20">
            무료로 설교 만들어보기
          </a>
          <p className="mt-6 text-xs text-[#5A6F8C]">이미 계정이 있으신가요? <a href="/login" className="text-[#C9A84C] hover:underline">로그인</a></p>
        </div>
      </section>

      {/* ═══ 푸터 ═══ */}
      <footer className="border-t border-gray-100 py-10 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">말씀동역</p>
            <p className="text-xs text-gray-400">목회자의 설교 준비를 돕는 AI 동역자</p>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="/login" className="hover:text-[#C9A84C]">로그인</a>
            <a href="/signup" className="hover:text-[#C9A84C]">회원가입</a>
            <span>대한예수교장로회 기준</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
