/**
 * Projects 정렬/필터/History — Astro 런타임에 의존하지 않는 순수 함수
 * (빌드 시 src/lib/content.ts, 브라우저 src/scripts/project-filter.ts 에서 공통 사용)
 */

/** 페이지당 건수 (docs/decisions.md D-08, 기존 사이트와 동일) */
export const PROJECTS_PER_PAGE = 20;

/** 필터 query parameter (기존 FacetWP 이름 유지) */
export const PROJECT_FILTER_PARAMS = {
  type: '_type',
  industry: '_industry',
  status: '_status',
  year: '_year',
} as const;
export const PROJECT_PAGE_PARAM = '_paged';

export type ProjectFilterGroup = keyof typeof PROJECT_FILTER_PARAMS;
export const PROJECT_FILTER_GROUPS = Object.keys(PROJECT_FILTER_PARAMS) as ProjectFilterGroup[];

export interface ProjectFacets {
  type?: string | undefined;
  industry: string;
  status: string;
  year: string;
}

export type ProjectFilters = Partial<Record<ProjectFilterGroup, string>>;

export interface SortableProject {
  legacyId?: number | string | undefined;
  status: string;
  year: number;
  date: string;
}

/**
 * 기존 사이트 정렬 (docs/decisions.md D-08)
 * Status(statusOrder 순: 진행중 → 완료) → Year 내림차순 → 게시일 내림차순 → legacyId 내림차순(같은 날짜 게시 순서)
 */
export function compareProjects(
  a: SortableProject,
  b: SortableProject,
  statusOrder: Readonly<Record<string, number>>,
): number {
  const sa = statusOrder[a.status] ?? Number.MAX_SAFE_INTEGER;
  const sb = statusOrder[b.status] ?? Number.MAX_SAFE_INTEGER;
  if (sa !== sb) return sa - sb;
  if (a.year !== b.year) return b.year - a.year;
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return Number(b.legacyId ?? 0) - Number(a.legacyId ?? 0);
}

export function sortProjects<T extends { data: SortableProject }>(
  entries: readonly T[],
  statusOrder: Readonly<Record<string, number>>,
): T[] {
  return [...entries].sort((a, b) => compareProjects(a.data, b.data, statusOrder));
}

export function matchesFilters(facets: ProjectFacets, filters: ProjectFilters): boolean {
  return PROJECT_FILTER_GROUPS.every((group) => {
    const wanted = filters[group];
    return !wanted || facets[group] === wanted;
  });
}

/** URLSearchParams → 필터 (허용된 값만) */
export function parseProjectFilters(
  params: URLSearchParams,
  allowed: Readonly<Partial<Record<ProjectFilterGroup, readonly string[]>>> = {},
): ProjectFilters {
  const filters: ProjectFilters = {};
  for (const group of PROJECT_FILTER_GROUPS) {
    const value = params.get(PROJECT_FILTER_PARAMS[group]);
    if (!value) continue;
    const options = allowed[group];
    if (options && !options.includes(value)) continue;
    filters[group] = value;
  }
  return filters;
}

export function filtersToQuery(filters: ProjectFilters): Record<string, string> {
  const query: Record<string, string> = {};
  for (const group of PROJECT_FILTER_GROUPS) {
    const value = filters[group];
    if (value) query[PROJECT_FILTER_PARAMS[group]] = value;
  }
  return query;
}

export function parsePage(params: URLSearchParams, totalPages: number): number {
  const page = Number.parseInt(params.get(PROJECT_PAGE_PARAM) ?? '1', 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, Math.max(1, totalPages));
}

/**
 * History — 기존 사이트 규칙: 같은 partner를 가진 프로젝트 목록 (자기 자신 포함), 목록 정렬 순서
 */
export function projectHistory<T extends { data: SortableProject & { partner?: string | undefined } }>(
  sortedEntries: readonly T[],
  project: T,
): T[] {
  const partner = project.data.partner;
  if (!partner) return [project];
  return sortedEntries.filter((entry) => entry.data.partner === partner);
}
