import { expect, type Page } from '@playwright/test';

/** 페이지의 console error와 uncaught exception을 수집한다. goto 전에 호출할 것. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** 가로 스크롤이 없는지 검사한다. (docs/requirements.md §12) */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `scrollWidth(${scrollWidth}) > clientWidth(${clientWidth})`).toBeLessThanOrEqual(clientWidth);
}

/** 원본 HTML에서 같은 속성이 두 번 출력된 태그를 찾는다. (브라우저는 첫 번째 값만 사용 — 예: spread와 href 중복) */
export function findDuplicateAttributes(html: string): string[] {
  const found: string[] = [];
  for (const [tag] of html.matchAll(/<[a-z][a-z0-9-]*\s[^>]*>/gi)) {
    const names = [...tag.matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?==)/g)].map((match) => match[1]);
    if (new Set(names).size !== names.length) found.push(tag.slice(0, 120));
  }
  return found;
}
