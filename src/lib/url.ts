/**
 * URL 유틸리티 — trailing slash 없음 정책 (docs/decisions.md D-06)
 */

/** 경로를 canonical 형태로 정규화한다. ('/company/' → '/company', '/team.html' → '/team', '/index.html' → '/') */
export function normalizePath(path: string): string {
  let pathname = path.split(/[?#]/)[0] ?? '/';
  pathname = pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '');
  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname === '' ? '/' : pathname;
}

/** 절대 canonical URL을 만든다. */
export function toCanonicalUrl(path: string, site: URL | string): string {
  return new URL(normalizePath(path), site).href;
}

/**
 * 메뉴 링크가 현재 경로에 해당하는지 판단한다.
 * - exact: 같은 경로
 * - section: 하위 경로 (/projects/foo 는 /projects 의 section)
 */
export function matchPath(currentPath: string, href: string): 'exact' | 'section' | false {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);
  if (current === target) return 'exact';
  if (target !== '/' && current.startsWith(`${target}/`)) return 'section';
  return false;
}
