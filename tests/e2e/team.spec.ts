import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { TEAM_SLUGS } from './routes';

type Member = {
  slug: string;
  nameKo: string;
  nameEn: string;
  introduction?: string[];
  functions?: string[];
  capabilities?: string[];
  biography?: { title: string; items: string[] }[];
  relatedProjects?: string[];
  relatedProjectsLegacy: { title: string; year?: string }[];
};

const load = (slug: string): Member =>
  JSON.parse(readFileSync(join(process.cwd(), 'src/data/team', `${slug}.json`), 'utf8'));

const NAMES = ['김학연', 'ITO 팀', 'SI 팀', '인프라 팀', '솔루션 팀', '미래기술연구소'];

test.describe('Team 목록 /team', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team');
  });

  test('h1, canonical, 카드 6개 순서와 링크', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Team');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/team');
    const cards = page.locator('main article.card');
    await expect(cards).toHaveCount(6);
    await expect(cards.locator('h2')).toHaveText(NAMES);
    for (const [index, slug] of TEAM_SLUGS.entries()) {
      await expect(page.getByRole('link', { name: NAMES[index], exact: true })).toHaveAttribute('href', `/team/${slug}`);
    }
  });

  test('CEO는 별도 그룹, 영문명/역할 표시', async ({ page }) => {
    const grids = page.locator('main ul.team-grid');
    await expect(grids).toHaveCount(2);
    await expect(grids.first().locator('article')).toHaveCount(1);
    const ceo = grids.first().locator('article');
    await expect(ceo).toContainText('Kim Hakyun');
    await expect(ceo.locator('.team-card__role')).toContainText('대표이사');
    await expect(ceo.locator('.team-card__role')).toContainText('CEO');
    await expect(grids.nth(1).locator('.team-card__en')).toHaveText([
      'IT Outsourcing Team',
      'System Integration Team',
      'Infrastructure Maintenance Team',
      'Solution Team',
      'Future Technology Research Center',
    ]);
  });

  test('이미지 placeholder: 외부 이미지 미로드, 2:3 / 1:1 비율', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.reload();
    expect(requests.filter((url) => url.includes('wp-content') || url.includes('mrint.co.kr'))).toEqual([]);
    await expect(page.locator('main img')).toHaveCount(0);

    const placeholders = page.locator('main [data-image-placeholder]');
    await expect(placeholders).toHaveCount(6);
    const ceoBox = await placeholders.first().boundingBox();
    const teamBox = await placeholders.nth(1).boundingBox();
    expect((ceoBox?.width ?? 0) / (ceoBox?.height ?? 1)).toBeCloseTo(1, 1);
    expect((teamBox?.width ?? 0) / (teamBox?.height ?? 1)).toBeCloseTo(683 / 1024, 1);
  });

  test('그리드 열 수: desktop 4 / tablet·mobile 2', async ({ page }, testInfo) => {
    const items = page.locator('main ul.team-grid').nth(1).locator('> li');
    const xs = await items.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().x)));
    const columns = new Set(xs).size;
    expect(columns).toBe(testInfo.project.name === 'desktop-1440' ? 4 : 2);
  });

  test('카드 제목(한글 팀명)이 한 줄에 표시된다', async ({ page }) => {
    const titles = page.locator('main article.card h2');
    const lines = await titles.evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return Math.round(node.getBoundingClientRect().height / parseFloat(style.lineHeight));
      }),
    );
    for (const count of lines) expect(count).toBe(1);
  });

  test('키보드: 카드 링크 focus 시 카드 외곽 focus 표시', async ({ page }) => {
    const link = page.getByRole('link', { name: 'ITO 팀', exact: true });
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const outline = await link.evaluate((el) => getComputedStyle(el.closest('article')!).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

for (const slug of TEAM_SLUGS) {
  test.describe(`Team 상세 /team/${slug}`, () => {
    const member = load(slug);

    test.beforeEach(async ({ page }) => {
      await page.goto(`/team/${slug}`);
    });

    test('h1/영문명/Breadcrumb/canonical', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(member.nameKo);
      await expect(page.locator('main header [lang="en"]').first()).toHaveText(member.nameEn);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://mrint.co.kr/team/${slug}`);
      const crumb = page.getByRole('navigation', { name: '현재 위치' });
      await expect(crumb.getByRole('link', { name: 'Team' })).toHaveAttribute('href', '/team');
      await expect(crumb.locator('[aria-current="page"]')).toHaveText(member.nameKo);
    });

    test('섹션(h2)과 항목이 원문 데이터와 일치, Markdown 기호 없음', async ({ page }) => {
      const expectedH2 = [
        ...(member.introduction ? ['Team Introduction'] : []),
        ...(member.functions ? ['Main Functions'] : []),
        ...(member.capabilities ? ['Key Capabilities'] : []),
        ...(member.biography ?? []).map((block) => block.title),
        ...(member.relatedProjectsLegacy.length ? ['Related Projects'] : []),
      ];
      await expect(page.locator('main h2')).toHaveText(expectedH2);

      if (member.introduction) {
        await expect(page.getByRole('region', { name: 'Team Introduction' }).locator('p')).toHaveText(member.introduction);
      }
      if (member.functions) {
        await expect(page.getByRole('region', { name: 'Main Functions' }).locator('li')).toHaveText(member.functions);
      }
      if (member.capabilities) {
        await expect(page.getByRole('region', { name: 'Key Capabilities' }).locator('li')).toHaveText(member.capabilities);
      }
      for (const block of member.biography ?? []) {
        await expect(page.getByRole('region', { name: block.title }).locator('li')).toHaveText(block.items);
      }

      const text = await page.locator('main').innerText();
      expect(text).not.toMatch(/^\s*#\s/m);
      expect(text).not.toMatch(/^\s*-\s/m);
      expect(text).not.toContain('<br');
    });

    test('Related Projects: 원문 순서/연도, Project 상세 링크', async ({ page }) => {
      const region = page.getByRole('region', { name: 'Related Projects' });
      if (member.relatedProjectsLegacy.length === 0) {
        await expect(region).toHaveCount(0);
        return;
      }
      const rows = region.locator('li');
      await expect(rows).toHaveCount(member.relatedProjectsLegacy.length);
      await expect(region.locator('.related-projects__title')).toHaveText(
        member.relatedProjectsLegacy.map((project) => project.title),
      );
      const hrefs = await region.locator('a').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
      expect(hrefs).toEqual((member.relatedProjects ?? []).map((slug) => `/projects/${slug}`));
    });

    test('이미지 placeholder 1개, img 없음', async ({ page }) => {
      await expect(page.locator('main [data-image-placeholder]')).toHaveCount(1);
      await expect(page.locator('main img')).toHaveCount(0);
    });
  });
}

test('메뉴 현재 위치: 상세에서 Team이 section으로 표시', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'desktop 전용');
  await page.goto('/team/si-team');
  await page.getByRole('button', { name: 'COMPANY' }).click();
  await expect(page.locator('#mega-company a[aria-current]')).toHaveText('Team');
  await expect(page.locator('#mega-company a[aria-current]')).toHaveAttribute('aria-current', 'true');
});
