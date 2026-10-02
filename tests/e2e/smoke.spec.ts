import { expect, test } from '@playwright/test';
import { collectPageErrors, expectNoHorizontalScroll } from './helpers/page';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test.describe(`smoke ${route}`, () => {
    test('200 응답, lang=ko, h1 1개, console error 없음, 가로 스크롤 없음', async ({ page }) => {
      const errors = collectPageErrors(page);
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
      await expect(page.locator('h1')).toHaveCount(1);
      await expectNoHorizontalScroll(page);
      expect(errors).toEqual([]);
    });
  });
}
