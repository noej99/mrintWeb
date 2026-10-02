import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/a11y';
import { PROJECT_LEGACY_ORDER } from './routes';

type Project = {
  slug: string;
  title: string;
  name: string;
  year: number;
  type?: string;
  period: string;
  client: string;
  overview: string;
  description?: { type: string; text: string }[];
  images: unknown[];
  partner?: string;
  legacyId: number;
};

const DIR = join(process.cwd(), 'src/data/projects');
const projects: Project[] = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(join(DIR, name), 'utf8')));
const bySlug = new Map(projects.map((p) => [p.slug, p]));
const slugAt = (index: number) => `project-${PROJECT_LEGACY_ORDER[index]}`;

const visibleRows = (page: Page) => page.locator('main [data-project-row]:not([hidden])');
const hrefsOf = (page: Page) =>
  visibleRows(page).locator('a').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
const total = (page: Page) => page.locator('[data-project-total]');
const ready = (page: Page) => expect(page.locator('[data-projects][data-ready]')).toHaveCount(1);
const isDesktop = (name: string) => name === 'desktop-1440';

test.describe('Projects 목록 /projects', () => {
  test('h1, canonical, 1페이지 20건 (기존 순서), 3페이지', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    await expect(page.locator('h1')).toHaveText('Projects');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/projects');
    await expect(total(page)).toHaveText('57');
    await expect(visibleRows(page)).toHaveCount(20);
    expect(await hrefsOf(page)).toEqual(PROJECT_LEGACY_ORDER.slice(0, 20).map((id) => `/projects/project-${id}`));
    const pager = page.getByRole('navigation', { name: '프로젝트 목록 페이지' });
    await expect(pager.locator('.pagination__page')).toHaveText(['페이지 1', '페이지 2', '페이지 3']);
    await expect(pager.locator('[aria-current="page"]')).toHaveText('페이지 1');
  });

  test('행: 실제 링크 1개, Title/Year/Industry/Type/Status 표시', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    const first = visibleRows(page).first();
    await expect(first.locator('a')).toHaveCount(1);
    await expect(first.locator('.project-row__title')).toHaveText(bySlug.get(slugAt(0))!.title);
    await expect(first.locator('.project-row__year')).toContainText('2026');
    await expect(first.locator('.project-row__industry')).toContainText('은행');
    await expect(first.locator('.project-row__type')).toContainText('SI');
    await expect(first.locator('.badge')).toHaveText('진행중');
    await expect(page.locator('a.hidden-url, .hidden-url')).toHaveCount(0);
  });

  test('Year 필터: 0건 연도(2017, 2019) 숨김', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    const years = await page
      .locator('[data-filter-group="year"] input')
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value).filter(Boolean));
    expect(years).toEqual(['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2018', '2016']);
  });

  test('필터 선택 → URL query 동기화, 건수/페이지 갱신, 뒤로가기', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    await page.locator('[data-filter-group="type"] label', { hasText: 'SI' }).click();
    await expect(page).toHaveURL(/\/projects\?_type=si$/);
    await expect(total(page)).toHaveText('25');
    await expect(visibleRows(page)).toHaveCount(20);

    await page.locator('[data-filter-group="status"] label', { hasText: '완료' }).click();
    await expect(page).toHaveURL(/_type=si&_status=completed/);
    const expected = projects.filter((p) => p.type === 'si' && p.legacyId && PROJECT_LEGACY_ORDER.includes(p.legacyId as never));
    const completedSi = expected.filter((p) => PROJECT_LEGACY_ORDER.indexOf(p.legacyId as never) >= 35).length;
    await expect(total(page)).toHaveText(String(completedSi));

    await page.goBack();
    await expect(page).toHaveURL(/\/projects\?_type=si$/);
    await expect(total(page)).toHaveText('25');
  });

  test('직접 URL: 여러 필터 조합 / Year / 페이지', async ({ page }) => {
    await page.goto('/projects?_type=solution&_status=proceeding');
    await ready(page);
    await expect(visibleRows(page)).toHaveCount(5);
    await expect(page.locator('[data-filter-group="type"] input[value="solution"]')).toBeChecked();

    await page.goto('/projects?_year=2016');
    await ready(page);
    expect(await hrefsOf(page)).toEqual(['/projects/project-992']);

    await page.goto('/projects?_paged=3');
    await ready(page);
    await expect(visibleRows(page)).toHaveCount(17);
    expect((await hrefsOf(page))[0]).toBe(`/projects/${slugAt(40)}`);
  });

  test('Pagination 클릭 → 2페이지, URL _paged=2, 목록 focus', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    await page.getByRole('navigation', { name: '프로젝트 목록 페이지' }).getByRole('link', { name: '페이지 2' }).click();
    await expect(page).toHaveURL(/\/projects\?_paged=2$/);
    expect((await hrefsOf(page))[0]).toBe(`/projects/${slugAt(20)}`);
    await expect(page.locator('[data-project-list]')).toBeFocused();
    await expect(page.locator('.pagination__page[aria-current="page"]')).toHaveText('페이지 2');
  });

  test('결과 없음: EmptyState와 초기화 링크', async ({ page }) => {
    await page.goto('/projects?_type=others&_status=proceeding');
    await ready(page);
    await expect(total(page)).toHaveText('0');
    await expect(page.locator('[data-project-empty]')).toBeVisible();
    await expect(page.getByRole('link', { name: '필터 초기화' })).toHaveAttribute('href', '/projects');
  });

  test('0건 옵션은 비활성 (선택된 조건 기준)', async ({ page }) => {
    await page.goto('/projects?_type=solution');
    await ready(page);
    await expect(page.locator('[data-filter-group="industry"] input[value="9"]')).toBeDisabled();
    await expect(page.locator('[data-filter-group="industry"] input[value="27"]')).toBeEnabled();
  });

  test('키보드: 라디오 그룹을 방향키로 선택하면 필터가 적용된다', async ({ page }) => {
    await page.goto('/projects');
    await ready(page);
    await page.locator('[data-filter-group="type"] input[value=""]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/_type=si/);
    const outline = await page
      .locator('[data-filter-group="type"] label', { hasText: 'SI' })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('레이아웃: desktop 1행 / tablet·mobile 제목 아래 메타', async ({ page }, testInfo) => {
    await page.goto('/projects');
    await ready(page);
    const row = visibleRows(page).first();
    const title = await row.locator('.project-row__title').boundingBox();
    const year = await row.locator('.project-row__year').boundingBox();
    if (!title || !year) throw new Error('box 없음');
    if (isDesktop(testInfo.project.name)) expect(year.x).toBeGreaterThan(title.x + title.width - 1);
    else expect(year.y).toBeGreaterThan(title.y + title.height - 1);
  });

  test('필터 적용 상태 axe 검사', async ({ page }) => {
    await page.goto('/projects?_type=si&_paged=2');
    await ready(page);
    await expectNoA11yViolations(page);
  });
});

test.describe('Projects 목록 (JavaScript 꺼짐)', () => {
  test.use({ javaScriptEnabled: false });

  test('57건 전체 목록, 필터/페이지 숨김', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('main [data-project-row]')).toHaveCount(57);
    await expect(visibleRows(page)).toHaveCount(57);
    await expect(page.locator('[data-project-filter]')).toBeHidden();
    await expect(page.locator('.pagination')).toHaveCount(0);
  });
});

test.describe('Project 상세 57건', () => {
  test('h1 1개(제목, 중복 heading 없음), 메타 원문, History 1회 출력, description/이미지', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), '57건 전체는 desktop에서 1회 검사');
    test.setTimeout(180_000);
    for (const project of projects) {
      await page.goto(`/projects/${project.slug}`);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(project.title);
      const headings = await page.locator('main h2, main h3').allTextContents();
      expect(headings, project.slug).not.toContain(project.title);
      expect(headings.filter((text) => text.trim() === 'History')).toHaveLength(1);

      const meta = page.locator('.project-meta');
      await expect(meta.locator('dt')).toHaveText([
        ...(project.type ? ['Type'] : []),
        'Status',
        'Name',
        'Period',
        'Client',
        'Project Overview',
        'Partner',
      ]);
      await expect(meta.locator('dt:text-is("Name") + dd')).toHaveText(project.name);
      await expect(meta.locator('dt:text-is("Period") + dd')).toHaveText(project.period);
      await expect(meta.locator('dt:text-is("Client") + dd')).toHaveText(project.client);
      await expect(meta.locator('dt:text-is("Project Overview") + dd')).toHaveText(project.overview);

      const sameParter = projects.filter((p) => p.partner === project.partner).length;
      const history = page.getByRole('region', { name: 'History' }).locator('li');
      await expect(history).toHaveCount(sameParter);
      await expect(page.getByRole('region', { name: 'History' }).locator('[aria-current="page"]')).toHaveText(
        new RegExp(project.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );

      await expect(page.locator('#project-description')).toHaveCount(project.description ? 1 : 0);
      await expect(page.locator('[data-project-gallery] [data-image-placeholder]')).toHaveCount(project.images.length);
      await expect(page.locator('main img')).toHaveCount(0);
    }
  });

  test('982(Type 없음), 406(이미지 2장·영문 description) 정상 렌더링, 외부 이미지 요청 없음', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/projects/project-982');
    await expect(page.locator('.project-meta dt')).not.toContainText(['Type']);
    await expect(page.locator('[data-project-gallery] [data-image-placeholder]')).toHaveCount(2);
    await page.goto('/projects/project-406');
    await expect(page.locator('[data-news-body]')).toContainText('Heungkuk Life Insurance application maintenance');
    await expect(page.locator('[data-news-body]')).toContainText('> 사내 인력 관리 및 공급을 담당하는 HR전담 팀');
    expect(requests.filter((url) => url.includes('wp-content') || url.includes('mrint.co.kr'))).toEqual([]);
  });

  test('History 링크: 다른 프로젝트로 이동, 현재 항목은 링크 아님', async ({ page }) => {
    await page.goto('/projects/project-973');
    const region = page.getByRole('region', { name: 'History' });
    await expect(region.locator('li')).toHaveCount(3);
    await expect(region.locator('a')).toHaveCount(2);
    await region.getByRole('link', { name: /IBK연금보험/ }).click();
    await expect(page).toHaveURL(/\/projects\/project-1270$/);
  });

  test('Breadcrumb / canonical / 메뉴 현재 위치', async ({ page }, testInfo) => {
    await page.goto('/projects/project-1572');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mrint.co.kr/projects/project-1572');
    const crumb = page.getByRole('navigation', { name: '현재 위치' });
    await expect(crumb.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    if (isDesktop(testInfo.project.name)) {
      await page.getByRole('button', { name: 'BUSINESS' }).click();
      await expect(page.locator('#mega-business a[aria-current]')).toHaveText('Projects');
    }
  });
});
