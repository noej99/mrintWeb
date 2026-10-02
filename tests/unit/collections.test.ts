import { describe, expect, it } from 'vitest';
import {
  findById,
  findDuplicates,
  resolveReferences,
  sortByDateDesc,
  sortByOrder,
} from '../../src/lib/collections';

const entry = (id: string, order?: number) => ({ id, data: { order } });
const dated = (id: string, date: string) => ({ id, data: { date } });

describe('sortByOrder', () => {
  it('order 오름차순, order 없는 항목은 뒤, 동률은 id 순', () => {
    const sorted = sortByOrder([entry('d'), entry('c', 2), entry('b'), entry('a', 1), entry('e', 2)]);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'c', 'e', 'b', 'd']);
  });

  it('입력 순서와 관계없이 항상 같은 결과를 반환한다', () => {
    const items = [entry('x', 3), entry('y'), entry('z', 1), entry('w')];
    const reversed = [...items].reverse();
    expect(sortByOrder(items).map((e) => e.id)).toEqual(sortByOrder(reversed).map((e) => e.id));
  });

  it('원본 배열을 변경하지 않는다', () => {
    const items = [entry('b', 2), entry('a', 1)];
    sortByOrder(items);
    expect(items.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('sortByDateDesc', () => {
  it('최신 날짜 순, 같은 날짜는 id 순', () => {
    const sorted = sortByDateDesc([
      dated('b', '2024-01-01'),
      dated('c', '2025-06-01'),
      dated('a', '2024-01-01'),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('findById', () => {
  it('id로 항목을 찾는다', () => {
    expect(findById([entry('a'), entry('b')], 'b')?.id).toBe('b');
    expect(findById([entry('a')], 'z')).toBeUndefined();
  });
});

describe('findDuplicates', () => {
  it('중복 값을 정렬해 한 번씩 반환한다', () => {
    expect(findDuplicates(['b', 'a', 'b', 'c', 'a', 'b'])).toEqual(['a', 'b']);
    expect(findDuplicates(['a', 'b'])).toEqual([]);
  });
});

describe('resolveReferences', () => {
  it('ids 순서대로 반환하고 없는 id는 missing으로 분리한다', () => {
    const { found, missing } = resolveReferences([entry('a'), entry('b'), entry('c')], ['c', 'x', 'a']);
    expect(found.map((e) => e.id)).toEqual(['c', 'a']);
    expect(missing).toEqual(['x']);
  });

  it('ids가 없으면 빈 결과를 반환한다', () => {
    expect(resolveReferences([entry('a')])).toEqual({ found: [], missing: [] });
  });
});
