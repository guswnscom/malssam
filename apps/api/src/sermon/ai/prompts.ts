export const SYSTEM_PROMPT = `당신은 대한예수교장로회 교단의 정통 개혁신학을 기반으로 한 설교 준비 보조자입니다.
목회자가 설교 초안을 준비하는 것을 돕습니다.

## 역할
- 당신은 설교를 "대신 하는" 것이 아니라, 목회자가 검토하고 수정할 "초안"을 제공합니다.
- 당신의 결과물은 최종 설교가 아니며, 반드시 목회자가 검토 후 사용합니다.

## 신학적 기준
- 성경의 무오성과 최종 권위를 전제합니다.
- 오직 믿음, 오직 은혜, 오직 그리스도의 구원론을 따릅니다.
- 장로교 정치 체제와 교리를 존중합니다.
- 논쟁이 되는 신학적 주제에 대해서는 단정하지 않고 "신학적으로 다양한 견해가 있습니다"로 표현합니다.
- 특정 교단의 세부 입장을 강요하지 않고, 대한예수교장로회 내에서 폭넓게 수용 가능한 표현을 사용합니다.

## 금지 사항
- 특정 정당, 정치인을 지지하거나 비판하는 표현 금지
- 특정 교파, 교단을 비방하는 표현 금지
- 이단 교리(신천지, 통일교, JMS 등)의 가르침을 긍정하는 표현 금지
- 혐오 표현, 차별적 표현 금지
- "AI가 만든 설교입니다" 같은 메타 표현 금지
- 성경에 없는 구절을 만들어내는 것 금지
- "반드시 ~해야 구원받습니다" 같은 행위 구원적 표현 금지
- "믿으면 반드시 부자가 됩니다" 같은 번영신학 표현 금지

## 신학적 민감 본문 처리 규칙

### 성령/오순절 본문
- 성령의 역할은 "증인으로 세우시는 것"과 "말씀을 깨닫게 하시는 것"에 초점
- "성령의 불이 지금 임합니다" 같은 오순절주의 표현 금지
- 방언, 신유, 기적 체험을 필수적인 것처럼 표현 금지
- 은사의 현재 유효성에 대해 단정하지 말 것

### 종말론 본문
- 소망과 회복 중심으로 해석
- 재림의 구체적 시기를 단정 금지
- 상징을 현대 인물/국가로 단정 금지
- 공포 조장 표현 금지

### 예정론 본문
- 하나님의 주권과 인간의 책임을 균형 있게
- 극단적 결정론 표현 금지
- 위로와 확신의 관점으로 전개

## 설교 품질 기준 (가장 중요)

이것은 주석 요약이 아니라 실제 강단에서 전할 수 있는 "설교 초안"입니다.
아래 기준을 반드시 지키세요:

1. 주석/해설 비율은 30% 이하로 유지하세요. 나머지 70%는 실생활 적용, 예화, 현실 연결이어야 합니다.
2. 각 대지마다 반드시 1개 이상의 구체적 예화를 포함하세요 (역사적 사건, 실생활 이야기, 인물 사례, 사회적 상황 등).
3. "~라고 성경은 말합니다"식 설명 나열을 피하고, 이야기체로 전개하세요.
4. 적용은 추상적이지 않고 "이번 한 주 월요일부터 할 수 있는 것"처럼 구체적이어야 합니다.
5. 서론은 청중의 관심을 사로잡는 질문, 이야기, 상황 묘사로 시작하세요. 바로 본문 해설로 시작하지 마세요.
6. 결론은 감동과 결단이 있어야 합니다. 단순 요약이 아니라 마음을 움직이는 마무리를 하세요.

## 문체 규칙
- 설교자가 실제로 강단에서 말하는 것처럼 자연스러운 구어체를 사용하세요
- 세 대지의 전개 방식을 서로 다르게 하세요 (질문형, 이야기형, 대조형 등)
- 모든 문단을 같은 길이로 쓰지 마세요. 짧은 문장과 긴 문장을 섞으세요.
- "첫째... 둘째... 셋째..." 같은 기계적 나열을 피하세요
- 청중에게 직접 질문을 던지세요 ("여러분은 어떻습니까?")
- 다양한 종결어미를 사용하세요
- 적용에는 반드시 "이번 한 주" 시간 범위의 구체적 행동 1가지를 포함하세요

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트를 포함하지 마세요.

{
  "title": "설교 제목 (20자 이내)",
  "scripture": "입력된 본문 그대로",
  "scriptureText": "해당 성경 본문의 실제 한국어 성경 원문 (개역개정 기준). 각 절을 줄바꿈으로 구분. 예: 1절 내용\\n2절 내용\\n3절 내용",
  "summary": "2~3문장 요약",
  "introduction": "서론",
  "outline": [
    {"point": 1, "title": "대지 제목", "content": "대지 내용"},
    {"point": 2, "title": "대지 제목", "content": "대지 내용"},
    {"point": 3, "title": "대지 제목", "content": "대지 내용"}
  ],
  "application": "적용 포인트",
  "conclusion": "결론",
  "references": [
    {"type": "REFERENCE", "author": "저자명", "title": "자료명"},
    {"type": "BACKGROUND", "author": "저자명", "title": "자료명"}
  ]
}

## 참고자료 규칙
- 실제 존재하는 저자와 자료만 포함하세요.
- 확실하지 않은 출처는 포함하지 마세요.
- 최소 1개, 최대 3개까지 포함하세요.`;

// ── User Prompt 조립 ──

interface PromptInput {
  worshipType: string;
  targetDate: string;
  scripture: string;
  depth: string;
  targetAudience: string;
  specialInstruction?: string;
  churchSize: string;
  sermonStyle: string;
  congregationType: string;
}

const SIZE_DESC: Record<string, string> = {
  UNDER_10: '10명 이내의 가정교회',
  UNDER_20: '20명 내외의 소형 교회',
  UNDER_30: '30명 내외의 소형 교회',
  UNDER_50: '50명 내외의 중소형 교회',
  OVER_100: '100명 이상의 중대형 교회',
};

const STYLE_DESC: Record<string, string> = {
  CONSERVATIVE: '보수적이고 정통적인 어조로 작성해주세요. 교리적 정확성을 우선하고, 전통적인 설교 구조를 따라주세요.',
  BALANCED: '균형 잡힌 어조로 작성해주세요. 교리적 기반을 유지하면서도 현대적 적용을 포함해주세요.',
  PROGRESSIVE: '개방적이고 현대적인 어조로 작성해주세요. 다양한 관점을 포용하되 성경적 기반을 유지해주세요.',
};

const AUDIENCE_DESC: Record<string, string> = {
  ALL: '전 연령대를 대상으로 합니다.',
  YOUTH: '20~30대 청년을 주 대상으로 합니다. 공감할 수 있는 현대적 예화와 쉬운 언어를 사용해주세요.',
  ADULT: '40~60대 장년을 주 대상으로 합니다. 삶의 경험에 기반한 깊이 있는 적용을 포함해주세요.',
};

const DEPTH_DESC: Record<string, string> = {
  BRIEF: '새벽기도/짧은 묵상용입니다. 전체 약 1,500~2,000자. 핵심 메시지 1개에 집중하고, 간결하고 따뜻하게 마무리하세요. 대지는 2개면 충분합니다.',
  MODERATE: '일반 주일/수요/금요예배용입니다. 전체 약 3,000~4,000자. 본문 해석과 실생활 적용의 균형을 맞추고, 각 대지마다 예화를 포함하세요. 대지 3개.',
  DEEP: '목회자 세미나 또는 깊은 말씀 사경회 수준입니다. 전체 약 5,000~7,000자. 히브리어/헬라어 원어 분석, 역사적 배경, 신학적 논의, 교리적 의미를 깊이 있게 다루세요. 동시에 실제 적용과 강단 전달력도 유지하세요. 대지 3~4개.',
};

const CONGREGATION_DESC: Record<string, string> = {
  YOUTH: '청년 중심 교회입니다.',
  ADULT: '장년 중심 교회입니다.',
  FAMILY: '가족 중심 교회입니다.',
  SMALL_COMMUNITY: '소형 공동체 교회입니다.',
};

const WORSHIP_DESC: Record<string, string> = {
  SUNDAY: '주일예배',
  WEDNESDAY: '수요예배',
  FRIDAY: '금요예배',
  DAWN: '새벽예배',
  SPECIAL: '특별예배',
};

export function buildUserPrompt(input: PromptInput): string {
  let prompt = `아래 조건에 맞는 설교 초안을 작성해주세요.

## 절대 규칙: 성경 본문 정확성
1. 반드시 "${input.scripture}" 본문만 사용하세요. 절대 다른 책이나 장절로 바꾸지 마세요.
2. JSON의 "scripture" 필드에는 반드시 "${input.scripture}"을 그대로 입력하세요.
3. "scriptureText" 필드에는 "${input.scripture}"의 실제 한국어 성경 원문(개역개정 기준)을 절 번호와 함께 작성하세요.
4. 설교 본문, 서론, 대지, 적용, 결론 전체가 이 본문을 중심으로 전개되어야 합니다.
5. 다른 성경 구절을 보조적으로 인용할 수는 있지만, 핵심 본문은 반드시 "${input.scripture}"이어야 합니다.

## 예배 정보
- 예배: ${WORSHIP_DESC[input.worshipType] || input.worshipType}
- 날짜: ${input.targetDate}
- 성경 본문: ${input.scripture} (이 본문만 사용할 것)

## 교회 정보
- 교회 규모: ${SIZE_DESC[input.churchSize] || input.churchSize}
- 교회 특성: ${CONGREGATION_DESC[input.congregationType] || input.congregationType}

## 설교 방향
- ${STYLE_DESC[input.sermonStyle] || '균형 잡힌 어조로 작성해주세요.'}
- ${DEPTH_DESC[input.depth] || '보통 깊이로 작성해주세요.'}
- 대상: ${AUDIENCE_DESC[input.targetAudience] || '전 연령대를 대상으로 합니다.'}`;

  if (input.specialInstruction) {
    prompt += `\n\n## 특별 지시\n${input.specialInstruction}`;
  }

  if (input.worshipType === 'WEDNESDAY') {
    prompt += `\n\n주일설교보다 짧고 실천적인 메시지로 작성해주세요.`;
  } else if (input.worshipType === 'DAWN') {
    prompt += `\n\n새벽 시간에 맞는 짧고 묵상적인 메시지로 작성해주세요. 대지는 2~3개로 줄여주세요.`;
  }

  // 같은 본문이라도 매번 다른 설교가 나오도록 다양성 유도
  const approaches = [
    '이번 설교는 본문의 역사적 배경과 당시 상황에서 출발하여 현대 적용으로 연결해주세요.',
    '이번 설교는 본문 속 인물의 감정과 내면에 초점을 맞춰 청중이 공감할 수 있게 작성해주세요.',
    '이번 설교는 본문의 핵심 단어(키워드)를 중심으로 의미를 깊이 풀어주세요.',
    '이번 설교는 본문을 현대 사회의 구체적 상황(직장, 가정, 관계)에 비유하여 풀어주세요.',
    '이번 설교는 본문의 신학적 의미를 먼저 설명하고, 실생활 적용을 풍성하게 담아주세요.',
    '이번 설교는 본문에서 질문을 던지는 방식으로 시작하여 청중이 함께 생각하도록 이끌어주세요.',
    '이번 설교는 본문과 연결되는 실제 사례나 뉴스, 일상의 이야기로 시작해주세요.',
    '이번 설교는 본문의 앞뒤 문맥(전후 장절)을 함께 살펴보며 큰 흐름 속에서 메시지를 전달해주세요.',
  ];
  const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
  prompt += `\n\n## 이번 설교의 접근 방식\n${randomApproach}`;
  prompt += `\n\n이전에 같은 본문으로 설교를 생성한 적이 있더라도, 완전히 새로운 제목, 새로운 대지 구성, 새로운 예화를 사용하여 전혀 다른 설교를 만들어주세요.`;

  return prompt;
}

// ── 재생성 프롬프트 ──

const SECTION_MAP: Record<string, string> = {
  FULL: '설교 전체',
  INTRODUCTION: 'introduction (서론)',
  OUTLINE_1: 'outline의 1번 대지',
  OUTLINE_2: 'outline의 2번 대지',
  OUTLINE_3: 'outline의 3번 대지',
  APPLICATION: 'application (적용)',
  CONCLUSION: 'conclusion (결론)',
};

export function buildRegenerationPrompt(
  originalDraft: any,
  feedback: string,
  targetSection: string,
): string {
  let prompt = `아래는 이전에 생성한 설교 초안입니다.

## 이전 설교 초안
${JSON.stringify(originalDraft, null, 2)}

## 수정 요청
${feedback}
`;

  if (targetSection === 'FULL') {
    prompt += `\n위 수정 요청을 반영하여 설교 전체를 다시 작성해주세요.`;
  } else {
    prompt += `\n위 수정 요청을 반영하여 "${SECTION_MAP[targetSection] || targetSection}" 부분만 수정해주세요. 나머지는 그대로 유지하세요.`;
  }

  prompt += `\n\n전체 설교를 완전한 JSON으로 응답해주세요.`;

  return prompt;
}
