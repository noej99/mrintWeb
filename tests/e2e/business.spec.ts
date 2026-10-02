import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/a11y';
import { collectPageErrors, expectNoHorizontalScroll, expectPictures, trackExternalImageRequests } from './helpers/page';
import { BUSINESS_SLUGS } from './routes';

type Block =
  | { type: 'title'; title: string }
  | { type: 'description'; description: string }
  | { type: 'image'; image: { width?: number; height?: number } }
  | { type: 'tabs'; tabs: { title: string; description: string; image?: { width?: number; height?: number } }[] };
type Line = {
  slug: string;
  title: string;
  summary: string;
  thumbnail?: { width?: number; height?: number };
  contents: Block[];
  clients: string[];
};
type Partner = { id: string; name: string };

const DATA = join(process.cwd(), 'src/data');
const load = (slug: string): Line => JSON.parse(readFileSync(join(DATA, 'business', `${slug}.json`), 'utf8'));
const partners: Partner[] = JSON.parse(readFileSync(join(DATA, 'partners.json'), 'utf8'));
const partnerName = (id: string) => partners.find((p) => p.id === id)?.name;
const TITLES = ['IT OUTSOURCING', 'SYSTEM INTEGRATION', 'INFRASTRUCTURE', 'SOLUTION'];
const TABBED = ['it-outsourcing', 'infrastructure', 'solution'] as const;

/** 원문 줄 단위 텍스트 (표시 시 공백 정규화와 동일하게 비교) */
const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

test.describe('Business Line 목록 /business', () => {
  test('h1, canonical, 카드 4개 순서/링크/summary', async ({ page }) => {
    await page.goto('/business');
    await expect(page.locator('h1')).toHaveText('Business Line');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/business');
    const cards = page.locator('[data-business-list] article.card');
    await expect(cards).toHaveCount(4);
    await expect(cards.locator('h2')).toHaveText(TITLES);
    for (const [index, slug] of BUSINESS_SLUGS.entries()) {
      const link = page.getByRole('link', { name: TITLES[index], exact: true });
      await expect(link).toHaveAttribute('href', `/business/${slug}`);
      await expect(cards.nth(index)).toContainText(load(slug).summary);
    }
  });

  test('빈 링크 없음, 썸네일 4장(원본 비율), 외부 이미지 요청 0건', async ({ page }) => {
    const requests = trackExternalImageRequests(page);
    await page.goto('/business');
    const empty = await page
      .locator('main a')
      .evaluateAll((links) => links.filter((a) => !(a.textContent ?? '').trim() && !a.getAttribute('aria-label')).length);
    expect(empty).toBe(0);
    const ratios = BUSINESS_SLUGS.map((slug) => {
      const thumbnail = load(slug).thumbnail;
      return (thumbnail?.width ?? 16) / (thumbnail?.height ?? 9);
    });
    await expectPictures(page.locator('[data-business-list]'), ratios);
    expect(requests).toEqual([]);
  });

  test('카드 링크 → 상세 이동', async ({ page }) => {
    await page.goto('/business');
    await page.getByRole('link', { name: 'SYSTEM INTEGRATION', exact: true }).click();
    await expect(page).toHaveURL(/\/business\/system-integration$/);
    await expect(page.locator('h1')).toHaveText('SYSTEM INTEGRATION');
  });
});

for (const slug of BUSINESS_SLUGS) {
  test.describe(`Business Line 상세 /business/${slug}`, () => {
    const line = load(slug);
    const sectionTitles = line.contents.flatMap((block) => (block.type === 'title' ? [block.title] : []));

    test('h1/summary/canonical/og, description 미출력(승인 전)', async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(`/business/${slug}`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(line.title);
      await expect(page.locator('.page-header')).toContainText(line.summary);
      await expect(page).toHaveTitle(`${line.title} | 미래아이엔텍`);
      const canonical = `https://mrint.co.kr/business/${slug}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${line.title} | 미래아이엔텍`);
      await expect(page.locator('meta[name="description"]')).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test('섹션 h2: 원문 title 블록 순서 + Main Clients', async ({ page }) => {
      await page.goto(`/business/${slug}`);
      await expect(page.locator('main h2.split__title')).toHaveText([...sectionTitles, 'Main Clients']);
      // h1 → h3 건너뜀 없음: 모든 h3는 h2 섹션 안에 있다
      const orphanH3 = await page.locator('main h3').evaluateAll(
        (headings) => headings.filter((h) => !h.closest('section')?.querySelector('h2')).length,
      );
      expect(orphanH3).toBe(0);
    });

    test('원문 description 줄 전체 표시 (JS 동작 시 모든 탭 포함)', async ({ page }) => {
      await page.goto(`/business/${slug}`);
      const text = (await page.locator('main').evaluate((main) => main.textContent ?? '')).replace(/\s+/g, ' ');
      for (const block of line.contents) {
        const texts =
          block.type === 'description' ? [block.description] : block.type === 'tabs' ? block.tabs.map((t) => t.description) : [];
        for (const value of texts) for (const row of lines(value)) expect(text).toContain(row);
      }
    });

    test('Main Clients: ACF 순서, 이름 텍스트, 로고/링크 없음', async ({ page }) => {
      await page.goto(`/business/${slug}`);
      const items = page.locator('[data-main-clients] li');
      await expect(items).toHaveCount(line.clients.length);
      await expect(items.locator('.clients__name')).toHaveText(line.clients.map((id) => partnerName(id) ?? id));
      expect(await items.evaluateAll((els) => els.map((el) => el.getAttribute('data-partner-id')))).toEqual(line.clients);
      await expect(page.locator('[data-main-clients] img, [data-main-clients] a')).toHaveCount(0);
    });

    test('이미지: 본문 이미지 원본 비율, 탭 이미지, 외부 이미지 요청 0건', async ({ page }) => {
      const requests = trackExternalImageRequests(page);
      await page.goto(`/business/${slug}`);
      const images = line.contents.filter((block) => block.type === 'image') as Extract<Block, { type: 'image' }>[];
      const ratios = images.map((block) => (block.image.width ?? 16) / (block.image.height ?? 9));
      for (const [index, ratio] of ratios.entries()) {
        await expectPictures(page.locator('.business-section__media').nth(index), [ratio]);
      }
      await expect(page.locator('.business-section__media')).toHaveCount(images.length);
      const tabImages = line.contents.flatMap((block) => (block.type === 'tabs' ? block.tabs.filter((tab) => tab.image) : []));
      await expect(page.locator('.features__media picture > img')).toHaveCount(tabImages.length);
      await expect(page.locator('main [data-image-placeholder]')).toHaveCount(0);
      expect(requests).toEqual([]);
    });

    test('반응형: 가로 스크롤 없음', async ({ page }) => {
      await page.goto(`/business/${slug}`);
      await expectNoHorizontalScroll(page);
    });
  });
}

test.describe('Service Features 탭', () => {
  for (const slug of TABBED) {
    const line = load(slug);
    const tabs = line.contents.flatMap((block) => (block.type === 'tabs' ? block.tabs : []));

    test(`${slug}: role/aria 구조, 첫 탭 선택`, async ({ page }) => {
      await page.goto(`/business/${slug}`);
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();
      await expect(tablist).toHaveAccessibleName(/Service features/i);
      const tabEls = page.getByRole('tab');
      await expect(tabEls).toHaveCount(tabs.length);
      for (const [index, tab] of tabs.entries()) {
        const el = tabEls.nth(index);
        await expect(el).toContainText(tab.title);
        await expect(el).toHaveAttribute('aria-selected', index === 0 ? 'true' : 'false');
        await expect(el).toHaveAttribute('tabindex', index === 0 ? '0' : '-1');
        const panelId = await el.getAttribute('aria-controls');
        const panel = page.locator(`#${panelId}`);
        await expect(panel).toHaveAttribute('role', 'tabpanel');
        await expect(panel).toHaveAttribute('aria-labelledby', (await el.getAttribute('id')) ?? '');
        if (index === 0) await expect(panel).toBeVisible();
        else await expect(panel).toBeHidden();
      }
      // tab 모드에서 패널 h3(탭 이름과 중복)는 숨긴다
      await expect(page.locator('[data-tab-heading]:visible')).toHaveCount(0);
    });

    test(`${slug}: 클릭/키보드(←/→/Home/End) 전환, focus 표시`, async ({ page }) => {
      await page.goto(`/business/${slug}`);
      const tabEls = page.getByRole('tab');
      const last = tabs.length - 1;
      const expectSelected = async (index: number) => {
        await expect(tabEls.nth(index)).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tabpanel')).toHaveCount(1);
        await expect(page.getByRole('tabpanel')).toContainText(lines(tabs[index]!.description)[0]!);
      };

      await tabEls.nth(1).click();
      await expectSelected(1);

      await tabEls.nth(1).focus();
      await page.keyboard.press('ArrowRight');
      await expectSelected(2);
      await expect(tabEls.nth(2)).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expectSelected(0);
      await page.keyboard.press('ArrowLeft');
      await expectSelected(last);
      await page.keyboard.press('Home');
      await expectSelected(0);
      await page.keyboard.press('End');
      await expectSelected(last);

      const outline = await tabEls.nth(last).evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe('none');

      // Tab 키: 선택된 탭 → 패널로 이동 (roving tabindex)
      await page.keyboard.press('Tab');
      await expect(page.getByRole('tabpanel')).toBeFocused();
    });
  }

  test('JS 미동작: 탭 UI 없이 모든 탭 내용과 h3 제목 표시', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const slug of TABBED) {
      const tabs = load(slug).contents.flatMap((block) => (block.type === 'tabs' ? block.tabs : []));
      await page.goto(`/business/${slug}`);
      await expect(page.getByRole('tablist')).toHaveCount(0);
      await expect(page.locator('[data-tab-panel]:visible')).toHaveCount(tabs.length);
      await expect(page.locator('main h3')).toHaveText(tabs.map((tab) => tab.title));
      for (const tab of tabs) await expect(page.locator('main')).toContainText(lines(tab.description)[0]!);
    }
    await context.close();
  });

  test('reduced-motion: 패널 전환 애니메이션 없음', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/business/infrastructure');
    await page.getByRole('tab').nth(1).click();
    const name = await page.getByRole('tabpanel').evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe('none');
    await context.close();
  });

  test('axe: 탭 전환 후에도 위반 0건', async ({ page }) => {
    await page.goto('/business/solution');
    await page.getByRole('tab').nth(2).click();
    await expectNoA11yViolations(page);
  });
});

test.describe('Home 카드 1/2 → Business Line 상세', () => {
  test('링크와 이동', async ({ page }) => {
    await page.goto('/');
    for (const [title, slug] of [
      ['IT OUTSOURCING', 'it-outsourcing'],
      ['SYSTEM INTEGRATION', 'system-integration'],
    ] as const) {
      await expect(page.locator(`main a[href="/business/${slug}"]`).first()).toBeAttached();
      const response = await page.request.get(`/business/${slug}`);
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain(`<h1 class="page-header__title"`);
      expect(title).toBe(load(slug).title);
    }
  });
});

test.describe('Partner 개별 페이지 없음', () => {
  test('/partners, /partner/{id}는 생성하지 않는다', async ({ page }) => {
    for (const path of ['/partners', '/partner/partner-396', '/partners/partner-396']) {
      const response = await page.request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });
});
