// ── 역할 ──
export const Role = {
  CHURCH_ADMIN: 'CHURCH_ADMIN',
  SENIOR_PASTOR: 'SENIOR_PASTOR',
  ASSOC_PASTOR: 'ASSOC_PASTOR',
  MINISTER: 'MINISTER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ── 교회 규모 ──
export const ChurchSize = {
  UNDER_10: 'UNDER_10',
  UNDER_20: 'UNDER_20',
  UNDER_30: 'UNDER_30',
  UNDER_50: 'UNDER_50',
  OVER_100: 'OVER_100',
} as const;
export type ChurchSize = (typeof ChurchSize)[keyof typeof ChurchSize];

// ── 설교 스타일 ──
export const SermonStyle = {
  CONSERVATIVE: 'CONSERVATIVE',
  BALANCED: 'BALANCED',
  PROGRESSIVE: 'PROGRESSIVE',
} as const;
export type SermonStyle = (typeof SermonStyle)[keyof typeof SermonStyle];

// ── 회중 유형 ──
export const CongregationType = {
  YOUTH: 'YOUTH',
  ADULT: 'ADULT',
  FAMILY: 'FAMILY',
  SMALL_COMMUNITY: 'SMALL_COMMUNITY',
} as const;
export type CongregationType = (typeof CongregationType)[keyof typeof CongregationType];

// ── 예배 유형 ──
export const WorshipType = {
  SUNDAY: 'SUNDAY',
  WEDNESDAY: 'WEDNESDAY',
  FRIDAY: 'FRIDAY',
  DAWN: 'DAWN',
  SPECIAL: 'SPECIAL',
} as const;
export type WorshipType = (typeof WorshipType)[keyof typeof WorshipType];

// ── 예배 유형 한글 매핑 ──
export const WorshipTypeLabel: Record<WorshipType, string> = {
  SUNDAY: '주일예배',
  WEDNESDAY: '수요예배',
  FRIDAY: '금요예배',
  DAWN: '새벽예배',
  SPECIAL: '특별예배',
};

// ── 설교 깊이 ──
export const SermonDepth = {
  BRIEF: 'BRIEF',
  MODERATE: 'MODERATE',
  DEEP: 'DEEP',
} as const;
export type SermonDepth = (typeof SermonDepth)[keyof typeof SermonDepth];

// ── 대상 ──
export const TargetAudience = {
  ALL: 'ALL',
  YOUTH: 'YOUTH',
  ADULT: 'ADULT',
} as const;
export type TargetAudience = (typeof TargetAudience)[keyof typeof TargetAudience];

// ── 구독 상태 ──
export const SubscriptionStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  GRACE_PERIOD: 'grace_period',
  SUSPENDED: 'suspended',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// ── 요금제 ──
export const PlanType = {
  SEED: 'SEED',
  GROWTH: 'GROWTH',
  FRUIT: 'FRUIT',
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const PLAN_CONFIG = {
  SEED:   { price: 50000,  maxPastors: 3,  maxSermons: 20,  label: '새싹' },
  GROWTH: { price: 100000, maxPastors: 5,  maxSermons: 50,  label: '성장' },
  FRUIT:  { price: 180000, maxPastors: 10, maxSermons: -1,  label: '열매' },
} as const;
