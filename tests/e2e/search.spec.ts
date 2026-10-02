/**
 * Phase 9 — 전체 사이트 검색 (/search?q=) / 404 (docs/decisions.md D-23)
 * 기대 건수는 tests/unit/search.test.ts와 같은 실제 데이터 기준이다.
 */
import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/a11y';
import { collectPageErrors, expectNoHorizontalScroll, findDuplicateAttributes } from './helpers/page';

/** 검색어 → 결과 건수 / 포함되어야 하는 결과 경로 */
const CASES: readonly { query: string; total: number; includes: string[] }[] = [
  { query: '기업은행', total: 7, includes: ['/projects/project-973', '/business/it-outsourcing'] },
  { query: '은행', total: 37, includes: ['/projects/project-1572', '/team/ito-team'] },
  { query: 'IT', total: 21, includes: ['/company', '/business/it-outsourcing'] },
  { query: 'SI', total: 31, includes: ['/team/si-team', '/business/system-integration'] },
  { query: 'SC', total: 19, includes: ['/projects/project-1537', '/business/system-integration'] },
  { query: 'CubeOne', total: 2, includes: ['/news/news-1429', '/business/solution'] },
  { query: 'Cloud', total: 1, includes: ['/business/infrastructure'] },
  { query: '흥국생명', total: 6, includes: ['/projects/project-406', '/news/news-908'] },
  { query: '시스템', total: 40, includes: ['/projects/project-973'] },
  { query: 'ITO', total: 31, includes: ['/team/ito-team', '/projects/project-1044'] },
  { query: '보험', total: 12, includes: ['/news/news-1563'] },
];

/** 908 본문에만 있는 문구 (권리 미확인 — 색인/결과/HTML 어디에도 없어야 함) */
const NEWS_908_BODY_ONLY = '내실있는';

const searchUrl = (query: string) => `/search?q=${encodeURIComponent(query)}`;
const status = (page: Page) => page.locator('[data-search-status]');
const resultLinks = (page: Page) => page.locator('[data-search-results] a.search-row');

test.describe('Search /search', () => {
  test('검색어 없음: 안내 상태, label, noindex', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/search');

    await expect(page.locator('h1')).toHaveText('Search');
    const input = page.getByRole('searchbox', { name: '검색어' });
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(page.locator('form[role="search"]').first()).toHaveAttribute('action', '/search');
    await expect(page.locator('[data-search-guide]')).toBeVisible();
    await expect(page.locator('[data-search-nojs]')).toBeHidden();
    await expect(resultLinks(page)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  for (const { query, total, includes } of CASES) {
    test(`검색: ${query}`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(searchUrl(query));

      await expect(status(page)).toHaveText(`“${query}” 검색 결과 ${total}건`);
      await expect(page.getByRole('searchbox', { name: '검색어' })).toHaveValue(query);
      await expect(resultLinks(page)).toHaveCount(total);
      await expect(page.locator('[data-search-empty]')).toBeHidden();

      const hrefs = await resultLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
      expect(hrefs).toEqual(expect.arrayContaining(includes));

      // 그룹 heading(h2): 건수 합계 = 전체, 순서는 Company → Team → News → Project → Business
      const headings = await page.locator('.search-group__title').allTextContents();
      const order = ['COMPANY', 'TEAM', 'NEWS', 'PROJECT', 'BUSINESS'];
      const labels = headings.map((text) => text.split(' ')[0] ?? '');
      expect(labels).toEqual(order.filter((label) => labels.includes(label)));
      const sum = headings.reduce((acc, text) => acc + Number(text.match(/(\d+)건/)?.[1] ?? 0), 0);
      expect(sum).toBe(total);

      await expectNoHorizontalScroll(page);
      await expectNoA11yViolations(page);
      expect(errors).toEqual([]);
    });
  }

  test('모든 결과 링크는 실제 페이지(200)로 연결된다', async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'viewport와 무관하므로 1회만 실행');
    const hrefs = new Set<string>();
    for (const { query } of CASES) {
      await page.goto(searchUrl(query));
      await expect(status(page)).toContainText('검색 결과');
      for (const href of await resultLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')))) {
        if (href) hrefs.add(href);
      }
    }
    expect(hrefs.size).toBeGreaterThan(50);
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });

  test('결과 클릭 → 상세 페이지 이동', async ({ page }) => {
    await page.goto(searchUrl('Cloud'));
    await resultLinks(page).first().click();
    await expect(page).toHaveURL(/\/business\/infrastructure$/);
    await expect(page.locator('h1')).toHaveText('INFRASTRUCTURE');
  });

  test('form 제출: 키보드로 검색어 입력 → Enter / 제출 버튼 → 결과 링크 focus', async ({ page }) => {
    await page.goto('/search');
    const input = page.getByRole('searchbox', { name: '검색어' });
    await input.focus();
    await page.keyboard.type('흥국생명');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=%ED%9D%A5%EA%B5%AD%EC%83%9D%EB%AA%85$/);
    await expect(status(page)).toHaveText('“흥국생명” 검색 결과 6건');

    await input.fill('Cloud');
    await page.keyboard.press('Tab');
    const submit = page.getByRole('button', { name: '검색' });
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('“Cloud” 검색 결과 1건');

    // 제출 버튼 다음 Tab → 첫 결과 링크, focus 표시
    await submit.focus();
    await page.keyboard.press('Tab');
    const first = resultLinks(page).first();
    await expect(first).toBeFocused();
    const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('Header SEARCH 메뉴 → /search', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', '데스크톱 메뉴 기준 (모바일/태블릿 메뉴는 layout.spec.ts에서 검증)');
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'SEARCH' }).first().click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.locator('h1')).toHaveText('Search');
  });

  test('결과 없음: EmptyState', async ({ page }) => {
    await page.goto(searchUrl('존재하지않는검색어'));
    await expect(status(page)).toHaveText('“존재하지않는검색어” 검색 결과 0건');
    await expect(page.locator('[data-search-empty]')).toBeVisible();
    await expect(page.getByRole('heading', { name: '검색 결과가 없습니다.' })).toBeVisible();
    await expect(resultLinks(page)).toHaveCount(0);
    await expectNoA11yViolations(page);
  });

  test('News 908: 비공개 본문은 색인/결과/HTML에 없고 제목은 검색된다', async ({ page, request }) => {
    await page.goto(searchUrl(NEWS_908_BODY_ONLY));
    await expect(status(page)).toHaveText(`“${NEWS_908_BODY_ONLY}” 검색 결과 0건`);

    const index = await (await request.get('/search-index.json')).text();
    expect(index).not.toContain(NEWS_908_BODY_ONLY);
    const detail = await (await request.get('/news/news-908')).text();
    expect(detail).not.toContain(NEWS_908_BODY_ONLY);

    await page.goto(searchUrl('흥국생명'));
    await expect(page.locator('[data-search-results] a[href="/news/news-908"]')).toHaveCount(1);
    expect(await page.locator('[data-search]').textContent()).not.toContain(NEWS_908_BODY_ONLY);
  });

  test('검색어는 HTML로 해석되지 않는다 (XSS)', async ({ page }) => {
    const payload = '<img src=x onerror="window.__xss=1">';
    await page.goto(searchUrl(payload));
    await expect(status(page)).toHaveText(`“${payload}” 검색 결과 0건`);
    await expect(page.locator('[data-search] img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    await expect(page.getByRole('searchbox', { name: '검색어' })).toHaveValue(payload);
  });

  test('긴 검색어/긴 결과: 가로 스크롤 없음', async ({ page }) => {
    await page.goto(searchUrl('A'.repeat(100)));
    await expect(status(page)).toContainText('검색 결과 0건');
    await expectNoHorizontalScroll(page);
    await page.goto(searchUrl('Peer Review Action'));
    await expect(resultLinks(page)).toHaveCount(1);
    await expectNoHorizontalScroll(page);
  });

  test('JavaScript 비활성화: 안내 문구 + form + navigation 유지', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(searchUrl('기업은행'));
    await expect(page.getByText('JavaScript가 활성화되어 있어야 검색 기능을 사용할 수 있습니다.')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: '검색어' })).toBeVisible();
    await expect(page.locator('footer a[href="/projects"]').first()).toBeVisible();
    await expect(page.locator('[data-search-guide]')).toBeHidden();
    await expect(resultLinks(page)).toHaveCount(0);
    await context.close();
  });
});

test.describe('404', () => {
  test('없는 경로: 404 상태, 안내 문구, 홈/검색 제공', async ({ page }) => {
    const errors = collectPageErrors(page);
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    expect(findDuplicateAttributes((await response?.text()) ?? '')).toEqual([]);

    await expect(page.locator('h1')).toHaveText('페이지를 찾을 수 없습니다.');
    await expect(page.getByText('404', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('index page 입니다.');
    await expect(page.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('searchbox', { name: '사이트 검색' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
    expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
  });

  test('404에서 검색 → /search 결과', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.getByRole('searchbox', { name: '사이트 검색' }).fill('Cloud');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=Cloud$/);
    await expect(status(page)).toHaveText('“Cloud” 검색 결과 1건');
  });
});
