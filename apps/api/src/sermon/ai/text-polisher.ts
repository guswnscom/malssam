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
 * 설교 전체 구조에 대해 텍스트 폴리싱 적용
 */
export function polishSermonOutput(output: any): any {
  return {
    ...output,
    summary: polishSermonText(output.summary || ''),
    introduction: polishSermonText(output.introduction || ''),
    outline: (output.outline || []).map((o: any) => ({
      ...o,
      content: polishSermonText(o.content || ''),
    })),
    application: polishSermonText(output.application || ''),
    conclusion: polishSermonText(output.conclusion || ''),
  };
}
