import { describe, expect, it } from 'vitest';
import { matchPath, normalizePath, toCanonicalUrl } from '../../src/lib/url';

describe('normalizePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['/company/', '/company'],
    ['/company//', '/company'],
    ['/team.html', '/team'],
    ['/index.html', '/'],
    ['/projects/index.html', '/projects'],
    ['/news/foo?x=1#top', '/news/foo'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('toCanonicalUrl', () => {
  const site = 'https://mrint.co.kr';

  it('trailing slash 없는 절대 URL을 만든다', () => {
    expect(toCanonicalUrl('/company/', site)).toBe('https://mrint.co.kr/company');
    expect(toCanonicalUrl('/projects/foo.html', site)).toBe('https://mrint.co.kr/projects/foo');
  });

  it('홈은 / 를 유지한다', () => {
    expect(toCanonicalUrl('/', site)).toBe('https://mrint.co.kr/');
  });
});

describe('matchPath', () => {
  it('같은 경로는 exact', () => {
    expect(matchPath('/projects', '/projects')).toBe('exact');
    expect(matchPath('/projects/', '/projects')).toBe('exact');
  });

  it('하위 경로는 section', () => {
    expect(matchPath('/projects/foo', '/projects')).toBe('section');
  });

  it('접두사만 같은 다른 경로는 false', () => {
    expect(matchPath('/projects-archive', '/projects')).toBe(false);
  });

  it('홈은 하위 경로를 section으로 보지 않는다', () => {
    expect(matchPath('/company', '/')).toBe(false);
  });
});
