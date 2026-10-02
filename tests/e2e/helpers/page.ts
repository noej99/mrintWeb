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
