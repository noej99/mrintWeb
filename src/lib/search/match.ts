/**
 * 검색 매칭 (docs/research/phase-9-search.md §12, docs/decisions.md D-23)
 * - 정규화한 검색어를 공백 기준 단어로 나누고, 모든 단어가 문서 필드 어딘가에 있으면 일치 (AND)
 * - 공백 차이 허용: 공백을 제거한 검색어가 공백을 제거한 필드에 있어도 일치 ('SC 제일' ↔ 'SC제일은행', 'LGCNS' ↔ 'LG CNS')
 * - 짧은 영문/숫자 단어(1~3자)는 영문/숫자 단어 경계에서만 일치 ('SI' ≠ 'Business', 'IT' ≠ 'Digital')
 *   한글·기호와 붙은 경우는 경계로 본다. ('SC제일은행', 'IT아웃소싱', '(SI)'는 일치)
 * - 결과 순서는 입력 문서 순서(유형 그룹 → 기존 목록 순서)를 그대로 유지한다. 점수 기반 ranking 없음.
 * 브라우저(src/scripts/search.ts)와 단위 테스트에서 함께 사용하는 순수 함수다.
 */
import type { SearchDocument } from './documents';
import { compact, tokenize } from './normalize';

const SHORT_ASCII_TOKEN = /^[a-z0-9]{1,3}$/;
const ASCII_WORD_CHAR = /[a-z0-9]/;

const isWordChar = (char: string | undefined) => char !== undefined && ASCII_WORD_CHAR.test(char);

/** 정규화된 text에 정규화된 token이 있는지 (짧은 영문/숫자 token은 단어 경계 적용) */
export function containsToken(text: string, token: string): boolean {
  if (!token) return false;
  if (!SHORT_ASCII_TOKEN.test(token)) return text.includes(token);

  for (let index = text.indexOf(token); index !== -1; index = text.indexOf(token, index + 1)) {
    if (!isWordChar(text[index - 1]) && !isWordChar(text[index + token.length])) return true;
  }
  return false;
}

export interface ParsedQuery {
  tokens: string[];
  /** 공백을 제거한 검색어 */
  compact: string;
}

export function parseQuery(query: string): ParsedQuery {
  const tokens = tokenize(query);
  return { tokens, compact: tokens.join('') };
}

export function matchesDocument(document: Pick<SearchDocument, 'fields'>, parsed: ParsedQuery): boolean {
  if (parsed.tokens.length === 0) return false;
  const texts = document.fields.map((field) => field.text);

  const allTokens = parsed.tokens.every((token) => texts.some((text) => containsToken(text, token)));
  if (allTokens) return true;

  return texts.some((text) => text.includes(' ') && containsToken(compact(text), parsed.compact));
}

/** 검색어에 일치하는 문서를 입력 순서대로 반환한다. 검색어가 비어 있으면 빈 배열. */
export function searchDocuments<T extends Pick<SearchDocument, 'fields'>>(documents: readonly T[], query: string): T[] {
  const parsed = parseQuery(query);
  if (parsed.tokens.length === 0) return [];
  return documents.filter((document) => matchesDocument(document, parsed));
}
