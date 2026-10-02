import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { NEWS_SLUGS } from './routes';

type Block = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };
type News = {
  slug: string;
  title: string;
  date: string;
  body: Block[];
  images: { width?: number; height?: number }[];
  source?: { label: string };
  rights?: { status: string };
};

const load = (slug: string): News =>
  JSON.parse(readFileSync(join(process.cwd(), 'src/data/news', `${slug}.json`), 'utf8'));
const dot = (date: string) => date.replaceAll('-', '.');

test.describe('News 목록 /news', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/news');
  });

  test('h1, canonical, 8건 순서/날짜/링크', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('News&Notices');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/news');
    const rows = page.locator('main .news-row');
    await expect(rows).toHaveCount(8);
    for (const [index, slug] of NEWS_SLUGS.entries()) {
      const news = load(slug);
      const row = rows.nth(index);
      await expect(row).toHaveAttribute('href', `/news/${slug}`);
      await expect(row.locator('.news-row__title')).toHaveText(news.title);
      await expect(row.locator('time')).toHaveText(dot(news.date));
      await expect(row.locator('time')).toHaveAttribute('datetime', news.date);
    }
  });

  test('링크 accessible name은 제목으로 시작한다', async ({ page }) => {
    const first = load(NEWS_SLUGS[0]);
    await expect(page.getByRole('link', { name: new RegExp(`^${first.title.slice(0, 10)}`) })).toHaveAttribute(
      'href',
      `/news/${first.slug}`,
    );
  });

  test('키보드: 행 링크 focus 표시, Enter로 상세 이동', async ({ page }) => {
    const row = page.locator('main .news-row').first();
    await row.focus();
    const outline = await row.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/news/${NEWS_SLUGS[0]}$`));
  });

  test('레이아웃: desktop 날짜 왼쪽 / mobile 날짜 위', async ({ page }, testInfo) => {
    const row = page.locator('main .news-row').first();
    const date = await row.locator('time').boundingBox();
    const title = await row.locator('.news-row__title').boundingBox();
    if (!date || !title) throw new Error('box 없음');
    if (testInfo.project.name === 'mobile-390') {
      expect(title.y).toBeGreaterThan(date.y + date.height - 1);
    } else {
      expect(title.x).toBeGreaterThan(date.x + date.width);
    }
  });
});

for (const slug of NEWS_SLUGS) {
  test.describe(`News 상세 /news/${slug}`, () => {
    const news = load(slug);
    const withheld = !!news.rights && news.rights.status !== 'confirmed';

    test.beforeEach(async ({ page }) => {
      await page.goto(`/news/${slug}`);
    });

    test('h1/구분/날짜/Breadcrumb/canonical/og:type', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(news.title);
      const meta = page.locator('.news-meta');
      await expect(meta).toContainText('News&Notices');
      await expect(meta.locator('time')).toHaveText(dot(news.date));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://mrint.co.kr/news/${slug}`);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
      const crumb = page.getByRole('navigation', { name: '현재 위치' });
      await expect(crumb.getByRole('link', { name: 'News&Notices' })).toHaveAttribute('href', '/news');
    });

    test('본문: 원문 블록 그대로 (외부 기사 권리 미확인 시 출처만)', async ({ page }) => {
      const body = page.locator('[data-news-body]');
      if (withheld) {
        await expect(body.locator('[data-news-source]')).toHaveText(news.source!.label);
        await expect(body.locator('p')).toHaveCount(1);
        return;
      }
      const paragraphs = news.body.filter((block) => block.type === 'paragraph').map((block) => block.text);
      const texts = await body
        .locator(':scope > p')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText));
      expect(texts).toEqual(paragraphs);
      const lists = news.body.filter((block) => block.type === 'list');
      await expect(body.locator('ul')).toHaveCount(lists.length);
      for (const [index, list] of lists.entries()) {
        await expect(body.locator('ul').nth(index).locator('li')).toHaveText(list.items);
      }
    });

    test('이미지: placeholder 개수/비율, 외부 이미지 요청 없음', async ({ page }) => {
      const requests: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      await page.reload();
      expect(requests.filter((url) => url.includes('wp-content') || url.includes('mrint.co.kr'))).toEqual([]);
      await expect(page.locator('main img')).toHaveCount(0);
      const placeholders = page.locator('main [data-image-placeholder]');
      await expect(placeholders).toHaveCount(news.images.length);
      for (const [index, image] of news.images.entries()) {
        const box = await placeholders.nth(index).boundingBox();
        expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo((image.width ?? 16) / (image.height ?? 9), 1);
      }
    });
  });
}

test('메뉴 현재 위치: News 상세에서 News & Notices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'desktop 전용');
  await page.goto(`/news/${NEWS_SLUGS[0]}`);
  await page.getByRole('button', { name: 'COMPANY' }).click();
  await expect(page.locator('#mega-company a[aria-current]')).toHaveText('News & Notices');
});
