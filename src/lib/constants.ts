/** 기존 사이트 콘텐츠 건수 (CLAUDE.md §3, docs/requirements.md §1.3) — 이관 후 누락 검증 기준 */
export const EXPECTED_CONTENT_COUNTS = {
  business: 4,
  projects: 57,
  news: 8,
  team: 6,
  partners: 67,
} as const;

export type CountedCollection = keyof typeof EXPECTED_CONTENT_COUNTS;
