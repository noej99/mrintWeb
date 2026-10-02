import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { expectPictures, trackExternalImageRequests } from './helpers/page';

const company = JSON.parse(readFileSync(join(process.cwd(), 'src/data/company/company.json'), 'utf8')) as {
  introduction: { ko: string[] };
};

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=37.5631966%2C126.9900875';
const isDesktop = (name: string) => name === 'desktop-1440';

const section = (page: Page, name: string) => page.getByRole('region', { name });

test.describe('Company /company', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/company');
  });

  test('h1 1개, canonical, Breadcrumb', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Mirae I&Tec');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/company');
    const crumb = page.getByRole('navigation', { name: '현재 위치' });
    await expect(crumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(crumb.locator('[aria-current="page"]')).toHaveText('Mirae I&Tec');
  });

  test('기존 사이트 공통 meta description을 사용하지 않는다', async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveCount(0);
    expect(await page.content()).not.toContain('경력쟁');
  });

  test('섹션 구조: INTRODUCTION → CONTACT US (h2)', async ({ page }) => {
    await expect(page.locator('main h2')).toHaveText(['INTRODUCTION', 'CONTACT US']);
    await expect(section(page, 'INTRODUCTION')).toBeVisible();
    await expect(section(page, 'CONTACT US')).toBeVisible();
  });

  test('소개 문단 3개가 원문 그대로 (줄바꿈 포함)', async ({ page }) => {
    const paragraphs = section(page, 'INTRODUCTION').locator('p');
    await expect(paragraphs).toHaveCount(3);
    const texts = await paragraphs.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText));
    expect(texts).toEqual(company.introduction.ko);
    await expect(paragraphs.locator('br')).toHaveCount(3);
  });

  test('연락처: 주소/전화/팩스/이메일, tel:/mailto: 링크', async ({ page }) => {
    const contact = section(page, 'CONTACT US');
    await expect(contact.locator('address p[lang="ko"]')).toHaveText('서울시 중구 수표로 23, 1001호, 1101호');
    await expect(contact.locator('address p[lang="en"]')).toHaveText('23 Supyo-ro, Jung-gu, Seoul, Republic of Korea');
    await expect(contact.locator('dt')).toHaveText(['Telephone', 'Fax', 'E-mail']);
    await expect(contact.locator('dd')).toHaveText(['02-557-5267', '02-557-5268', 'mrint01@mrint.co.kr']);
    await expect(contact.getByRole('link', { name: '02-557-5267' })).toHaveAttribute('href', 'tel:025575267');
    await expect(contact.getByRole('link', { name: 'mrint01@mrint.co.kr' })).toHaveAttribute(
      'href',
      'mailto:mrint01@mrint.co.kr',
    );
  });

  test('지도: API 요청 없음, 외부 지도 링크(새 창, rel) 제공', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(requests.filter((url) => /maps\.googleapis\.com|map\.naver\.com|openapi\.map|wp-content/.test(url))).toEqual(
      [],
    );

    const link = page.getByRole('link', { name: '지도에서 보기 (Google 지도, 새 창)' });
    await expect(link).toHaveAttribute('href', MAP_URL);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toBeVisible();
  });

  test('이미지: 로컬 최적화 이미지, 원본 비율(750:398) 유지, 외부 이미지 미로드', async ({ page }) => {
    const requests = trackExternalImageRequests(page);
    await page.reload();
    const intro = section(page, 'INTRODUCTION');
    await expectPictures(intro, [750 / 398]);
    const box = await intro.locator('picture > img').boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    expect(requests).toEqual([]);
  });

  test('레이아웃: desktop은 좌측 제목/우측 콘텐츠, mobile·tablet은 1열', async ({ page }, testInfo) => {
    const intro = section(page, 'INTRODUCTION');
    const title = await intro.locator('h2').boundingBox();
    const body = await intro.locator('p').first().boundingBox();
    if (!title || !body) throw new Error('box 없음');
    if (isDesktop(testInfo.project.name)) {
      expect(body.x).toBeGreaterThan(title.x + title.width);
      const viewport = page.viewportSize()?.width ?? 1440;
      expect(body.x).toBeGreaterThan(viewport * 0.3);
    } else {
      expect(Math.round(body.x)).toBe(Math.round(title.x));
      expect(body.y).toBeGreaterThan(title.y + title.height);
    }
  });

  test('키보드: 지도 링크, 전화, 이메일 순서로 이동', async ({ page }) => {
    const order: string[] = [];
    for (let i = 0; i < 40 && order.length < 3; i++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href'));
      if (href && (href.startsWith('tel:') || href.startsWith('mailto:') || href.includes('google.com/maps'))) {
        if (!order.includes(href)) order.push(href);
      }
    }
    expect(order).toEqual([MAP_URL, 'tel:025575267', 'mailto:mrint01@mrint.co.kr']);
  });

  test('메뉴 현재 위치: Mirae I&Tec', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), 'desktop 전용');
    await page.getByRole('button', { name: 'COMPANY' }).click();
    await expect(page.locator('#mega-company a[aria-current="page"]')).toHaveText('Mirae I&Tec');
  });
});

test.describe('company 데이터 → Footer / MobileMenu', () => {
  for (const route of ['/', '/company']) {
    test(`Footer 연락처 표시 ${route}`, async ({ page }) => {
      await page.goto(route);
      const footer = page.locator('footer.site-footer');
      await expect(footer.locator('address dd')).toHaveText([
        '서울시 중구 수표로 23, 1001호, 1101호',
        '02-557-5267',
        '02-557-5268',
        'mrint01@mrint.co.kr',
      ]);
      await expect(footer.getByRole('link', { name: '02-557-5267' })).toHaveAttribute('href', 'tel:025575267');
      await expect(footer.getByRole('link', { name: 'mrint01@mrint.co.kr' })).toHaveAttribute(
        'href',
        'mailto:mrint01@mrint.co.kr',
      );
    });
  }

  test('Footer 연락처 정렬: 행의 첫 칸은 좌측 정렬이 같다', async ({ page }, testInfo) => {
    await page.goto('/company');
    const items = page.locator('footer.site-footer address dl > div');
    const xs = await items.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.querySelector('dd')!.getBoundingClientRect().x)),
    );
    const [first, second, third, fourth] = xs;
    if (testInfo.project.name === 'mobile-390') {
      expect(new Set(xs).size).toBe(1);
    } else if (testInfo.project.name === 'tablet-768') {
      expect(third).toBe(first);
      expect(fourth).toBe(second);
    } else {
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      expect(new Set(xs).size).toBe(4);
    }
  });

  test('MobileMenu 연락처 표시', async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), 'mobile/tablet 전용');
    await page.goto('/company');
    await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
    const dialog = page.getByRole('dialog', { name: '전체 메뉴' });
    await expect(dialog.getByRole('link', { name: 'T. 02-557-5267' })).toHaveAttribute('href', 'tel:025575267');
    await expect(dialog.getByRole('link', { name: 'mrint01@mrint.co.kr' })).toHaveAttribute(
      'href',
      'mailto:mrint01@mrint.co.kr',
    );
  });
});
