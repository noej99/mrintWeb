import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/a11y';

const NAV_HREFS = ['/company', '/team', '/news', '/projects', '/business', '/search'];
const isDesktop = (name: string) => name === 'desktop-1440';

async function tabUntil(page: Page, predicate: () => Promise<boolean>, max = 30) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await predicate()) return;
  }
  throw new Error('대상 요소에 Tab으로 도달하지 못했습니다.');
}

test.describe('공통 Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('SkipLink: 첫 Tab에 표시되고 본문으로 이동한다', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: '본문 바로가기' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('focus-visible: 키보드 focus 시 outline이 표시된다', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test('Header/Footer 링크는 신규 URL이며 trailing slash가 없다', async ({ page }) => {
    const footerHrefs = await page
      .locator('footer nav a')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    expect(footerHrefs).toEqual(NAV_HREFS);

    const allHrefs = await page
      .locator('header a, footer a, dialog a')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href') ?? ''));
    for (const href of allHrefs) {
      if (href !== '/') expect(href, href).not.toMatch(/\/$/);
    }
  });

  test('Logo 링크는 홈으로 이동하며 접근 가능한 이름이 있다', async ({ page }) => {
    await expect(page.locator('header').getByRole('link', { name: '미래아이엔텍 홈' })).toHaveAttribute('href', '/');
  });
});

test.describe('Desktop Navigation / MegaMenu', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), 'desktop 전용');
    await page.goto('/');
  });

  test('desktop에서는 주 메뉴가 보이고 burger는 숨겨진다', async ({ page }) => {
    await expect(page.locator('header nav[aria-label="주 메뉴"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '전체 메뉴 열기' })).toBeHidden();
  });

  test('클릭으로 열고 닫으며, 한 번에 하나만 열린다', async ({ page }) => {
    const company = page.getByRole('button', { name: 'COMPANY' });
    const business = page.getByRole('button', { name: 'BUSINESS' });
    const companyPanel = page.locator('#mega-company');

    await expect(company).toHaveAttribute('aria-expanded', 'false');
    await expect(companyPanel).toBeHidden();

    await company.click();
    await expect(company).toHaveAttribute('aria-expanded', 'true');
    await expect(companyPanel).toBeVisible();
    await expect(companyPanel.getByRole('link')).toHaveText(['Mirae I&Tec', 'Team', 'News & Notices']);

    await business.click();
    await expect(company).toHaveAttribute('aria-expanded', 'false');
    await expect(business).toHaveAttribute('aria-expanded', 'true');

    // header의 빈 영역(로고와 메뉴 사이) 클릭 — 링크/메뉴 밖
    const viewport = page.viewportSize();
    await page.mouse.click((viewport?.width ?? 1440) / 2, 30);
    await expect(business).toHaveAttribute('aria-expanded', 'false');
  });

  test('키보드: Enter로 열고 Tab으로 하위 링크 이동, ESC로 닫고 trigger로 focus 복귀', async ({ page }) => {
    const company = page.getByRole('button', { name: 'COMPANY' });
    await tabUntil(page, () => company.evaluate((el) => el === document.activeElement));

    await page.keyboard.press('Enter');
    await expect(company).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Tab');
    await expect(page.locator('#mega-company a').first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(company).toHaveAttribute('aria-expanded', 'false');
    await expect(company).toBeFocused();
  });

  test('focus가 메뉴 밖으로 나가면 닫힌다', async ({ page }) => {
    const company = page.getByRole('button', { name: 'COMPANY' });
    await company.focus();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    await expect(company).toHaveAttribute('aria-expanded', 'false');
  });

  test('MegaMenu 열린 상태 axe 검사', async ({ page }) => {
    await page.getByRole('button', { name: 'COMPANY' }).click();
    await expectNoA11yViolations(page);
  });
});

test.describe('MobileMenu', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), 'mobile/tablet 전용');
    await page.goto('/');
  });

  test('desktop 주 메뉴는 숨겨지고 burger가 보인다', async ({ page }) => {
    await expect(page.locator('header nav[aria-label="주 메뉴"]')).toBeHidden();
    await expect(page.getByRole('button', { name: '전체 메뉴 열기' })).toBeVisible();
  });

  test('열기/닫기, focus trap, ESC, focus 복귀, 스크롤 잠금', async ({ page }) => {
    const open = page.getByRole('button', { name: '전체 메뉴 열기' });
    const dialog = page.getByRole('dialog', { name: '전체 메뉴' });

    await open.click();
    await expect(dialog).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.getByRole('button', { name: '전체 메뉴 닫기' })).toBeFocused();
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');

    const menuLinks = dialog.locator('nav a');
    await expect(menuLinks).toHaveText([
      'Mirae I&Tec',
      'Team',
      'News & Notices',
      'Projects',
      'Business Line',
      'SEARCH',
    ]);
    expect(await menuLinks.evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')))).toEqual(NAV_HREFS);

    // modal dialog: 배경 콘텐츠는 inert. Tab은 dialog 내부를 순환하며,
    // 마지막 요소 다음에는 브라우저 UI(activeElement=body)로 나갈 수 있다(사양 동작).
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const location = await dialog.evaluate((el) => {
        const active = document.activeElement;
        if (!active || active === document.body) return 'browser';
        return el.contains(active) ? 'dialog' : `outside:${active.outerHTML.slice(0, 80)}`;
      });
      expect(['dialog', 'browser']).toContain(location);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(open).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  });

  test('닫기 버튼으로 닫힌다', async ({ page }) => {
    await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
    await page.getByRole('button', { name: '전체 메뉴 닫기' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('MobileMenu 열린 상태 axe 검사', async ({ page }) => {
    await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
