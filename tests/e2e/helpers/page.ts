import { expect, type Locator, type Page } from '@playwright/test';

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

/** 외부(사이트 밖) 이미지 요청과 기존 WordPress 경로 요청을 수집한다. goto 전에 호출할 것. (로컬 최적화 이미지는 제외) */
export function trackExternalImageRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    const external = request.resourceType() === 'image' && !['127.0.0.1', 'localhost'].includes(url.hostname);
    if (external || url.pathname.includes('wp-content') || url.hostname.includes('mrint.co.kr')) requests.push(url.href);
  });
  return requests;
}

/**
 * scope 안의 ResponsiveImage(<picture>) 검증 (Phase 9.5)
 * - 개수 = ratios.length, placeholder 없음, alt 속성 존재, width/height 속성(CLS 방지)
 * - 화면에 보이는 이미지는 실제로 로드되고 AVIF/WebP가 선택된다 (lazy 이미지는 스크롤해 로드)
 * - 표시 비율이 원본 비율과 같다 (ratio가 null이면 비율 검사 생략 — 예: cover로 채우는 Home 슬라이드)
 */
export async function expectPictures(scope: Locator, ratios: readonly (number | null)[]): Promise<void> {
  const images = scope.locator('picture > img');
  await expect(images).toHaveCount(ratios.length);
  await expect(scope.locator('[data-image-placeholder]')).toHaveCount(0);
  for (const [index, ratio] of ratios.entries()) {
    const img = images.nth(index);
    await expect(img).toHaveAttribute('alt', /.*/);
    await expect(img).toHaveAttribute('width', /^\d+$/);
    await expect(img).toHaveAttribute('height', /^\d+$/);
    await expect(img.locator('xpath=..').locator('source[type="image/avif"]')).toHaveCount(1);
    await expect(img.locator('xpath=..').locator('source[type="image/webp"]')).toHaveCount(1);
    if (!(await img.isVisible())) continue;
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect(await img.evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(/\.(avif|webp)$/);
    if (ratio !== null) {
      const box = await img.boundingBox();
      expect((box?.width ?? 0) / (box?.height ?? 1), `image ${index} ratio`).toBeCloseTo(ratio, 1);
    }
  }
}

