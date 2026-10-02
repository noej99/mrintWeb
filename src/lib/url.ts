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

/** base 경로를 끝 slash 없는 prefix로 만든다. ('/' → '', '/mrintWeb/' → '/mrintWeb') */
function basePrefix(base: string): string {
  return base.replace(/\/+$/, '');
}

/**
 * 사이트 내부 절대 경로에 Astro base를 붙인다. (GitHub Pages 등 하위 경로 배포, astro.config.mjs ASTRO_BASE)
 * - base가 없으면('/') 입력 그대로 반환한다. (production 빌드 결과 불변)
 * - '/'로 시작하지 않는 값(외부 URL, '#id', mailto:, tel:)과 '//' protocol-relative URL은 그대로 반환한다.
 * - 이미 base가 붙은 경로는 다시 붙이지 않는다.
 */
export function withBase(href: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = basePrefix(base);
  if (!prefix || !href.startsWith('/') || href.startsWith('//')) return href;
  if (href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}?`)) return href;
  return href === '/' ? prefix : `${prefix}${href}`;
}

/** 현재 경로(Astro.url.pathname)에서 Astro base를 제거해 사이트 기준 경로로 만든다. */
export function stripBase(pathname: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = basePrefix(base);
  if (!prefix) return pathname;
  if (pathname === prefix) return '/';
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
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
