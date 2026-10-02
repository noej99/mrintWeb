/**
 * Astro 런타임에 의존하지 않는 collection 유틸리티.
 * src/lib/content.ts 에서 사용하며, Vitest로 단위 테스트한다.
 */

export interface Entry<TData = unknown> {
  id: string;
  data: TData;
}

type OrderableEntry = Entry<{ order?: number | undefined }>;

/** order 오름차순, order가 없으면 뒤로, 같으면 id 순으로 정렬한다. (항상 같은 순서를 보장) */
export function sortByOrder<T extends OrderableEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    const ao = a.data.order ?? Number.POSITIVE_INFINITY;
    const bo = b.data.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao < bo ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

/** date(YYYY-MM-DD) 내림차순, 같으면 id 순으로 정렬한다. */
export function sortByDateDesc<T extends Entry<{ date: string }>>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    if (a.data.date !== b.data.date) return a.data.date < b.data.date ? 1 : -1;
    return a.id.localeCompare(b.id);
  });
}

export function findById<T extends Entry>(entries: readonly T[], id: string): T | undefined {
  return entries.find((entry) => entry.id === id);
}

/** 중복된 값을 정렬해 반환한다. */
export function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

/** id 목록을 entry로 변환한다. 순서는 ids 순서를 따르고, 없는 id는 missing으로 반환한다. */
export function resolveReferences<T extends Entry>(
  entries: readonly T[],
  ids: readonly string[] = [],
): { found: T[]; missing: string[] } {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const found: T[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const entry = byId.get(id);
    if (entry) found.push(entry);
    else missing.push(id);
  }
  return { found, missing };
}
