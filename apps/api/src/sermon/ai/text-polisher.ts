/**
 * 텍스트 품질 후처리 엔진
 * 설교 생성 후 자동으로 적용되어 텍스트 품질을 개선한다.
 */

export function polishSermonText(text: string): string {
  let result = text;

  // 1. 연속 공백 정리
  result = result.replace(/  +/g, ' ');

  // 2. 연속 줄바꿈 정리 (3개 이상 → 2개)
  result = result.replace(/\n{3,}/g, '\n\n');

  // 3. 문장 시작 공백 제거
  result = result.replace(/\n\s+/g, '\n');

  // 4. 반복 문장 패턴 제거
  // "~입니다. ~입니다. ~입니다." 연속 3회 이상 → 마지막 하나만
  result = result.replace(/(입니다[.!?]\s*){3,}/g, '입니다. ');

  // 5. 불필요한 서두 제거
  result = result.replace(/^(자,\s*|자\s+|그래서\s+|그런데\s+)/, '');

  // 6. AI 특유의 반복 전환어 제거 (연속 사용 시)
  const transitions = ['이처럼', '마찬가지로', '결론적으로', '요약하면', '정리하면'];
  for (const t of transitions) {
    const regex = new RegExp(`(${t}[^.]*\\.[^.]*\\.\\s*){2,}`, 'g');
    result = result.replace(regex, (match) => {
      // 첫 번째만 유지
      const first = match.match(new RegExp(`${t}[^.]*\\.`));
      return first ? first[0] + ' ' : match;
    });
  }

  // 7. 따옴표 정리 (영문 따옴표 → 한국어 따옴표)
  result = result.replace(/"/g, '\u201C').replace(/"/g, '\u201D');

  // 8. 마침표 뒤 공백 확보
  result = result.replace(/\.([가-힣A-Za-z])/g, '. $1');

  return result.trim();
}

/**
 * 잘못된 "현재 연도" 자동 교정
 * AI가 학습 시점의 연도(2024 등)를 "현재", "올해"로 잘못 사용한 경우 교정
 */
export function fixOutdatedYearReferences(text: string, currentYear: number): string {
  let result = text;
  // "20XX년 현재", "20XX년 들어", "20XX년 오늘날", "20XX년 우리가 살아가는" 등을 교정
  // currentYear 이전의 연도가 "현재/오늘날" 같은 표현과 함께 등장하면 currentYear로 교체
  const oldYearPatterns: Array<[RegExp, string]> = [
    // "2024년 현재 우리가" → "2026년 현재 우리가"
    [/(20[1-2]\d)년\s*(현재|오늘날|올해|이 시대|우리가\s*살아가는)/g, `${currentYear}년 $2`],
    // "현재 2024년" → "현재 2026년"
    [/(현재|오늘날|올해)\s*(20[1-2]\d)년/g, `$1 ${currentYear}년`],
  ];
  for (const [pattern, replacement] of oldYearPatterns) {
    result = result.replace(pattern, (match, p1, p2) => {
      const matchedYear = parseInt(p1.match(/20[1-2]\d/)?.[0] || `${currentYear}`);
      // 현재 연도 이전이면 교정
      if (matchedYear < currentYear) {
        return replacement.replace(/\$1/g, p1).replace(/\$2/g, p2);
      }
      return match;
    });
  }
  return result;
}

/**
 * 설교 전체 구조에 대해 텍스트 폴리싱 적용
 */
export function polishSermonOutput(output: any): any {
  const currentYear = new Date().getFullYear();
  const polish = (text: string) => fixOutdatedYearReferences(polishSermonText(text || ''), currentYear);

  return {
    ...output,
    summary: polish(output.summary || ''),
    introduction: polish(output.introduction || ''),
    outline: (output.outline || []).map((o: any) => ({
      ...o,
      content: polish(o.content || ''),
    })),
    application: polish(output.application || ''),
    conclusion: polish(output.conclusion || ''),
  };
}
