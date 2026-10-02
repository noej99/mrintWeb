import { describe, expect, it } from 'vitest';
import { NAVIGATION, type NavLink } from '../../src/data/navigation';
import { normalizePath } from '../../src/lib/url';

const links: NavLink[] = NAVIGATION.flatMap((item) => (item.type === 'group' ? [...item.children] : [item]));

describe('NAVIGATION (docs/requirements.md §3)', () => {
  it('COMPANY / BUSINESS 그룹과 SEARCH로 구성된다', () => {
    expect(NAVIGATION.map((item) => `${item.type}:${item.label}`)).toEqual([
      'group:COMPANY',
      'group:BUSINESS',
      'link:SEARCH',
    ]);
  });

  it('그룹 하위 메뉴', () => {
    const groups = NAVIGATION.filter((item) => item.type === 'group');
    expect(groups.map((group) => group.children.map((link) => link.label))).toEqual([
      ['Mirae I&Tec', 'Team', 'News & Notices'],
      ['Projects', 'Business Line'],
    ]);
  });

  it('docs/sitemap.md의 신규 URL만 사용한다', () => {
    expect(links.map((link) => link.href)).toEqual([
      '/company',
      '/team',
      '/news',
      '/projects',
      '/business',
      '/search',
    ]);
  });

  it('URL은 trailing slash 없는 정규화된 경로다', () => {
    for (const link of links) expect(normalizePath(link.href)).toBe(link.href);
  });
});
