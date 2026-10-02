/**
 * 검색 정규화 (docs/research/phase-9-search.md §12)
 * 검색어와 색인 텍스트에 같은 규칙을 적용한다. 원본 데이터는 변경하지 않는다. (파생 데이터 전용)
 * 형태소 분석, 동의어, 오타 보정은 하지 않는다.
 */

/** 검색어 최대 길이 (문자 수) */
export const MAX_QUERY_LENGTH = 100;

/** hyphen 계열 문자: U+2010~2015, U+2212(minus), U+FE58, U+FE63, U+FF0D */
const HYPHENS = /[‐-―−﹘﹣－]/g;
/** zero-width 문자 */
const ZERO_WIDTH = /[​-‍⁠﻿]/g;

/**
 * 1. Unicode NFKC (㈜ → (주), 전각 → 반각, ™ → TM)
 * 2. lowercase
 * 3. hyphen 계열 → '-', zero-width 제거
 * 4. CR/LF/tab/연속 공백 → 공백 1개, 앞뒤 공백 제거
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(HYPHENS, '-')
    .replace(ZERO_WIDTH, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 공백을 모두 제거한다. (공백 차이 비교용: 'SC 제일' ↔ 'SC제일은행') */
export function compact(normalized: string): string {
  return normalized.replace(/ /g, '');
}

/** 사용자 입력 → 앞뒤 공백 제거 + 최대 길이 제한 (표시용 원문) */
export function sanitizeQuery(value: string | null | undefined): string {
  return (value ?? '').trim().slice(0, MAX_QUERY_LENGTH);
}

/** 정규화한 검색어를 공백 기준 단어로 나눈다. (중복 제거, 순서 유지) */
export function tokenize(query: string): string[] {
  const normalized = normalizeText(query);
  return normalized ? [...new Set(normalized.split(' '))] : [];
}
