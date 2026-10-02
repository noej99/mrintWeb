import { describe, expect, it } from 'vitest';
import { buildPageHref, getPaginationItems, type PaginationItem } from '../../src/lib/pagination';

const render = (items: PaginationItem[]) => items.map((item) => (item.type === 'page' ? item.page : '…'));

describe('getPaginationItems', () => {
  it('페이지가 적으면 모두 표시한다', () => {
    expect(render(getPaginationItems(1, 1))).toEqual([1]);
    expect(render(getPaginationItems(3, 7))).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('페이지가 없으면 빈 배열', () => {
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it('현재 페이지 주변과 처음/끝을 표시하고 나머지는 생략한다', () => {
    expect(render(getPaginationItems(1, 12))).toEqual([1, 2, '…', 12]);
    expect(render(getPaginationItems(5, 12))).toEqual([1, '…', 4, 5, 6, '…', 12]);
    expect(render(getPaginationItems(12, 12))).toEqual([1, '…', 11, 12]);
  });

  it('범위를 벗어난 현재 페이지는 보정한다', () => {
    expect(render(getPaginationItems(99, 12))).toEqual([1, '…', 11, 12]);
  });
});

describe('buildPageHref', () => {
  it('1페이지는 page 파라미터 없이 기본 경로', () => {
    expect(buildPageHref('/projects', 1)).toBe('/projects');
  });

  it('2페이지 이상은 ?page=N', () => {
    expect(buildPageHref('/projects', 2)).toBe('/projects?page=2');
  });

  it('필터 query를 유지하고 빈 값/기존 page는 제거한다', () => {
    expect(buildPageHref('/projects', 3, { type: 'si', industry: '', page: '9' })).toBe(
      '/projects?type=si&page=3',
    );
    expect(buildPageHref('/projects', 1, { type: 'si' })).toBe('/projects?type=si');
  });
});
