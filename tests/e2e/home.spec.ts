import { expect, test, type Page } from '@playwright/test';

const CARDS = [
  { title: 'IT OUTSOURCING', type: 'Business line', date: '2024.02.23', href: '/business/it-outsourcing', name: 'IT OUTSOURCING 상세 보기' },
  { title: 'SYSTEM INTEGRATION', type: 'Business line', date: '2024.02.23', href: '/business/system-integration', name: 'SYSTEM INTEGRATION 상세 보기' },
  { title: 'IBK기업은행 정보시스템 운영', type: 'Projects', date: '2024.04.19', href: '/projects/project-973', name: 'IBK기업은행 정보시스템 운영 상세 보기' },
  { title: '흥국생명 IT 어플리케이션 유지보수', type: 'Projects', date: '2024.04.01', href: '/projects/project-406', name: '흥국생명 IT 어플리케이션 유지보수 상세 보기' },
];

const slider = (page: Page) => page.getByRole('region', { name: '메인 슬라이드' });
const slides = (page: Page) => slider(page).locator('[data-slide]');
const counter = (page: Page) => slider(page).locator('[data-slider-current]');

async function expectSlideInView(page: Page, index: number) {
  await expect
    .poll(async () => {
      const box = await slides(page).nth(index).boundingBox();
      return box ? Math.round(box.x) : null;
    })
    .toBe(0);
  await expect(counter(page)).toHaveText(String(index + 1).padStart(2, '0'));
}

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('카드 4개가 기존 순서대로 렌더링된다 (type, title, date)', async ({ page }) => {
    await expect(slides(page)).toHaveCount(4);
    for (const [index, card] of CARDS.entries()) {
      const slide = slides(page).nth(index);
      await expect(slide).toHaveAttribute('aria-label', `${index + 1} / 4`);
      await expect(slide.locator('.slide__type')).toHaveText(card.type);
      // h2 텍스트 = 제목 + 시각적으로 숨긴 링크 안내
      await expect(slide.getByRole('heading', { level: 2 })).toHaveText(card.name);
      await expect(slide.locator('.slide__link')).toContainText(card.title);
      await expect(slide.locator('time')).toHaveText(card.date);
      await expect(slide.locator('time')).toHaveAttribute('datetime', card.date.replaceAll('.', '-'));
    }
  });

  test('카드 링크: 신규 URL + accessible name', async ({ page }) => {
    for (const [index, card] of CARDS.entries()) {
      const link = slides(page).nth(index).getByRole('link', { name: card.name, exact: true });
      await expect(link).toHaveAttribute('href', card.href);
    }
    const hrefs = await slider(page).locator('a').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    for (const href of hrefs) expect(href).not.toMatch(/business_line|wp-content|\/$/);
  });

  test('heading 구조: h1 1개, 슬라이드 제목은 h2', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('미래아이엔텍');
    await expect(slider(page).locator('h2')).toHaveCount(4);
    await expect(page.locator('main h3, main h4')).toHaveCount(0);
  });

  test('카드 전체가 링크 영역이다', async ({ page }) => {
    const slide = slides(page).first();
    const box = await slide.boundingBox();
    if (!box) throw new Error('slide box 없음');
    // 제목에서 떨어진 좌상단 영역의 최상위 요소가 링크(::after)인지 확인
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x as number, y as number)?.closest('a')?.getAttribute('href') ?? null,
      [box.x + 40, box.y + 40],
    );
    expect(hit).toBe('/business/it-outsourcing');
  });

  test('이미지 placeholder: 외부 이미지 미로드, 레이아웃 유지', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.reload();

    await expect(slider(page).locator('img')).toHaveCount(0);
    expect(requests.filter((url) => url.includes('wp-content') || url.includes('mrint.co.kr'))).toEqual([]);

    const placeholders = slider(page).locator('[data-image-placeholder]');
    await expect(placeholders).toHaveCount(4);
    await expect(placeholders.first()).toHaveAttribute('aria-hidden', 'true');
    await expect(placeholders.first()).toContainText('IT OUTSOURCING');

    const sliderBox = await slider(page).boundingBox();
    const viewport = page.viewportSize();
    for (let i = 0; i < 4; i++) {
      const box = await placeholders.nth(i).boundingBox();
      expect(box?.width).toBeCloseTo(sliderBox?.width ?? 0, 0);
      expect(box?.height).toBeCloseTo(sliderBox?.height ?? 0, 0);
    }
    expect(sliderBox?.width).toBeCloseTo(viewport?.width ?? 0, 0);
  });

  test('Header와 slider가 겹치지 않고 첫 화면을 채운다', async ({ page }) => {
    const header = await page.locator('header[data-header]').boundingBox();
    const box = await slider(page).boundingBox();
    const viewport = page.viewportSize();
    if (!header || !box || !viewport) throw new Error('box 없음');
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(Math.min(viewport.height, Math.round(header.height + 480)) - 1);
  });

  test('이전/다음 버튼으로 이동하고 양 끝에서 비활성화된다', async ({ page }) => {
    const prev = page.getByRole('button', { name: '이전 슬라이드' });
    const next = page.getByRole('button', { name: '다음 슬라이드' });

    await expect(prev).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'false');
    await expectSlideInView(page, 0);

    for (let i = 1; i < 4; i++) {
      await next.click();
      await expectSlideInView(page, i);
    }
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled 버튼은 focus 가능하지만 동작하지 않아야 한다
    await next.dispatchEvent('click');
    await expectSlideInView(page, 3);

    await prev.click();
    await expectSlideInView(page, 2);
    await expect(next).toHaveAttribute('aria-disabled', 'false');
  });

  test('키보드: 버튼 조작과 슬라이드 링크 focus 시 해당 슬라이드로 이동', async ({ page }) => {
    const next = page.getByRole('button', { name: '다음 슬라이드' });
    await next.focus();
    await page.keyboard.press('Enter');
    await expectSlideInView(page, 1);
    await page.keyboard.press(' ');
    await expectSlideInView(page, 2);
    await expect(next).toBeFocused();

    const fourth = page.getByRole('link', { name: CARDS[3]!.name, exact: true });
    await fourth.focus();
    await expectSlideInView(page, 3);

    const outline = await slides(page).nth(3).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

test.describe('Home (mobile)', () => {
  test('터치 환경에서 이전/다음 조작이 가능하다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'mobile 전용');
    await page.goto('/');
    await page.getByRole('button', { name: '다음 슬라이드' }).tap();
    await expectSlideInView(page, 1);
    await page.getByRole('button', { name: '이전 슬라이드' }).tap();
    await expectSlideInView(page, 0);
  });
});
