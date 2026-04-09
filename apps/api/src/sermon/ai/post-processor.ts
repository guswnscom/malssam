const FORBIDDEN_TERMS = [
  '신천지', '이만희', '통일교', '문선명', 'JMS', '정명석',
  '하나님의교회', '안상홍', '만민중앙교회', '이재록',
  '투표하세요', '지지합니다', '반대합니다',
  '윤회', '카르마', '전생',
  'AI가 작성', 'AI가 생성', '인공지능이',
  '헌금하면 축복', '믿으면 부자', '물질의 축복을 반드시',
  '성령의 불을 받으세요', '성령 받으셨습니까', '쓰러지는 은혜',
  '불이 임합니다', '뜨거운 성령', '방언을 반드시',
  '이미 정해졌으니 노력할 필요', '선택받지 못한 사람은 소용없',
  '전도할 필요가 없', '어차피 정해진',
  '당장 심판이', '곧 멸망합니다', '이 나라가 바벨론',
  '666은 바로', '적그리스도는 바로',
];

export interface SermonOutput {
  title: string;
  scripture: string;
  summary: string;
  introduction: string;
  outline: Array<{ point: number; title: string; content: string }>;
  application: string;
  conclusion: string;
  references: Array<{ type: string; author: string; title: string }>;
}

export function parseSermonJson(text: string): SermonOutput {
  // 직접 파싱 시도
  try {
    return JSON.parse(text);
  } catch {
    // JSON 블록 추출
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI_PARSE_FAILED: JSON not found in response');
    return JSON.parse(match[0]);
  }
}

export function validateSermonOutput(output: SermonOutput): string[] {
  const errors: string[] = [];
  if (!output.title) errors.push('title 누락');
  if (!output.introduction) errors.push('introduction 누락');
  if (!output.outline || output.outline.length < 2) errors.push('outline 2개 이상 필요');
  if (!output.application) errors.push('application 누락');
  if (!output.conclusion) errors.push('conclusion 누락');
  return errors;
}

export function checkForbiddenTerms(output: SermonOutput): string[] {
  const fullText = [
    output.title,
    output.summary,
    output.introduction,
    ...output.outline.map((o) => o.title + ' ' + o.content),
    output.application,
    output.conclusion,
  ].join(' ');

  return FORBIDDEN_TERMS.filter((term) => fullText.includes(term));
}

// 성경 본문 검증: AI가 다른 본문으로 바꿨는지 확인하고 강제 교정
export function enforceScripture(output: SermonOutput, inputScripture: string): SermonOutput {
  if (output.scripture !== inputScripture) {
    console.warn(`[Scripture Mismatch] AI: "${output.scripture}" → Forced: "${inputScripture}"`);
    output.scripture = inputScripture;
  }
  return output;
}

export function processReferences(
  refs: Array<{ type: string; author: string; title: string }> | undefined,
): Array<{ type: string; author: string; title: string }> {
  if (!refs || !Array.isArray(refs)) return [];
  return refs
    .filter((r) => r.author && r.title)
    .slice(0, 3);
}
