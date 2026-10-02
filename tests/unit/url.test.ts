import { describe, expect, it } from 'vitest';
import { matchPath, normalizePath, stripBase, toCanonicalUrl, withBase } from '../../src/lib/url';

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

describe('withBase', () => {
  it('base가 없으면(/) 입력 그대로 반환한다 (production 빌드)', () => {
    expect(withBase('/company', '/')).toBe('/company');
    expect(withBase('/', '/')).toBe('/');
  });

  it('하위 경로 배포에서는 base를 붙인다', () => {
    expect(withBase('/company', '/mrintWeb')).toBe('/mrintWeb/company');
    expect(withBase('/projects?_type=si', '/mrintWeb/')).toBe('/mrintWeb/projects?_type=si');
    expect(withBase('/', '/mrintWeb')).toBe('/mrintWeb');
  });

  it('외부 URL, anchor, mailto/tel, protocol-relative URL은 그대로 둔다', () => {
    for (const href of ['https://example.com/a', '#main', 'mailto:a@b.c', 'tel:025575267', '//cdn.example.com/x']) {
      expect(withBase(href, '/mrintWeb')).toBe(href);
    }
  });

  it('이미 base가 붙은 경로는 다시 붙이지 않는다', () => {
    expect(withBase('/mrintWeb/company', '/mrintWeb')).toBe('/mrintWeb/company');
    expect(withBase('/mrintWeb', '/mrintWeb')).toBe('/mrintWeb');
  });

  it('기본값은 import.meta.env.BASE_URL (테스트 환경: /)', () => {
    expect(withBase('/team')).toBe('/team');
  });
});

describe('stripBase', () => {
  it('base를 제거해 사이트 기준 경로로 만든다', () => {
    expect(stripBase('/mrintWeb/company', '/mrintWeb')).toBe('/company');
    expect(stripBase('/mrintWeb', '/mrintWeb')).toBe('/');
    expect(stripBase('/mrintWeb/', '/mrintWeb/')).toBe('/');
  });

  it('base가 없거나 접두사만 같은 경로는 그대로 둔다', () => {
    expect(stripBase('/company', '/')).toBe('/company');
    expect(stripBase('/mrintWebX/company', '/mrintWeb')).toBe('/mrintWebX/company');
  });
});
