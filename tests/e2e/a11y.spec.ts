import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, WCAG_TAGS } from './helpers/a11y';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`axe ${route}`, async ({ page }) => {
    await page.goto(route);
    await expectNoA11yViolations(page);
  });
}

test('axe 검사 기반이 위반을 감지한다 (alt 없는 이미지)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'viewport와 무관하므로 1회만 실행');

  await page.setContent(
    '<!doctype html><html lang="ko"><head><title>axe self-check</title></head>' +
      '<body><main><h1>axe self-check</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></main></body></html>',
  );
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations.map((v) => v.id)).toContain('image-alt');
});
