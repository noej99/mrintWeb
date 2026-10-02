/**
 * Pagination 유틸리티
 * URL 형식: /projects?page=2 (docs/seo.md §15). 1페이지는 page 파라미터 없이 기본 URL을 사용한다.
 */

export type PaginationItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

/**
 * 표시할 페이지 번호 목록을 만든다.
 * 첫/마지막 페이지와 현재 페이지 주변(siblings)을 표시하고 나머지는 ellipsis로 줄인다.
 */
export function getPaginationItems(current: number, total: number, siblings = 1): PaginationItem[] {
  if (total < 1) return [];
  const page = Math.min(Math.max(1, current), total);
  // 첫 + 마지막 + 현재 + 양쪽 siblings + ellipsis 2개
  const maxSlots = siblings * 2 + 5;

  if (total <= maxSlots) {
    return Array.from({ length: total }, (_, index) => ({ type: 'page', page: index + 1 }));
  }

  const start = Math.max(2, page - siblings);
  const end = Math.min(total - 1, page + siblings);
  const items: PaginationItem[] = [{ type: 'page', page: 1 }];

  if (start > 2) items.push({ type: 'ellipsis', key: 'start' });
  for (let p = start; p <= end; p++) items.push({ type: 'page', page: p });
  if (end < total - 1) items.push({ type: 'ellipsis', key: 'end' });

  items.push({ type: 'page', page: total });
  return items;
}

/** 페이지 URL을 만든다. 기존 query(필터 등)는 유지하고, 1페이지는 page 파라미터를 제거한다. */
export function buildPageHref(
  basePath: string,
  page: number,
  query: Readonly<Record<string, string | undefined>> = {},
  param = 'page',
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key !== param && value !== undefined && value !== '') params.set(key, value);
  }
  if (page > 1) params.set(param, String(page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
