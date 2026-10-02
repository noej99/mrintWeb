/**
 * Projects 목록 필터 + 페이지 (docs/decisions.md D-08)
 * - URL query와 동기화: ?_type= &_industry= &_status= &_year= &_paged=  (뒤로/앞으로 지원)
 * - 필터 변경 시 1페이지로, 옵션별 건수는 다른 필터 조건 기준으로 갱신, 0건 옵션은 비활성
 * - 페이지당 20건, 페이지 번호 Pagination (src/components/ui/Pagination.astro와 같은 마크업)
 * - 페이지 이동 시 목록으로 focus 이동
 */
import { buildPageHref, getPaginationItems } from '@/lib/pagination';
import {
  filtersToQuery,
  matchesFilters,
  parsePage,
  parseProjectFilters,
  PROJECT_FILTER_GROUPS,
  PROJECT_FILTER_PARAMS,
  PROJECT_PAGE_PARAM,
  PROJECTS_PER_PAGE,
  type ProjectFacets,
  type ProjectFilters,
} from '@/lib/projects';

const root = document.querySelector<HTMLElement>('[data-projects]');
const form = root?.querySelector<HTMLFormElement>('[data-project-filter]');
const list = root?.querySelector<HTMLElement>('[data-project-list]');

if (root && form && list) {
  const rows = [...list.querySelectorAll<HTMLElement>('[data-project-row]')].map((el) => ({
    el,
    facets: {
      type: el.dataset.type || undefined,
      industry: el.dataset.industry ?? '',
      status: el.dataset.status ?? '',
      year: el.dataset.year ?? '',
    } satisfies ProjectFacets,
  }));
  const total = root.querySelector<HTMLElement>('[data-project-total]');
  const summary = root.querySelector<HTMLElement>('[data-project-summary]');
  const empty = root.querySelector<HTMLElement>('[data-project-empty]');
  const pager = root.querySelector<HTMLElement>('[data-project-pagination]');

  const allowed = Object.fromEntries(
    PROJECT_FILTER_GROUPS.map((group) => [
      group,
      [...form.querySelectorAll<HTMLInputElement>(`input[name="${PROJECT_FILTER_PARAMS[group]}"]`)]
        .map((input) => input.value)
        .filter(Boolean),
    ]),
  );

  const readState = () => {
    const params = new URLSearchParams(window.location.search);
    const filters = parseProjectFilters(params, allowed);
    const matched = rows.filter((row) => matchesFilters(row.facets, filters)).length;
    const pages = Math.max(1, Math.ceil(matched / PROJECTS_PER_PAGE));
    return { filters, page: parsePage(params, pages) };
  };

  const hrefFor = (filters: ProjectFilters, page: number) =>
    buildPageHref(window.location.pathname, page, filtersToQuery(filters), PROJECT_PAGE_PARAM);

  const renderPagination = (filters: ProjectFilters, page: number, pages: number) => {
    if (!pager) return;
    pager.replaceChildren();
    if (pages <= 1) return;

    const nav = document.createElement('nav');
    nav.className = 'pagination';
    nav.setAttribute('aria-label', '프로젝트 목록 페이지');

    const step = (label: string, target: number, enabled: boolean, prev: boolean) => {
      const el = document.createElement(enabled ? 'a' : 'span');
      el.className = 'pagination__step';
      if (enabled) {
        (el as HTMLAnchorElement).href = hrefFor(filters, target);
        el.dataset.page = String(target);
        el.setAttribute('rel', prev ? 'prev' : 'next');
      } else {
        el.setAttribute('aria-disabled', 'true');
      }
      const chevron = document.createElement('span');
      chevron.className = prev ? 'pagination__chevron pagination__chevron--prev' : 'pagination__chevron';
      chevron.setAttribute('aria-hidden', 'true');
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = ' 페이지';
      if (prev) el.append(chevron, label, hidden);
      else el.append(label, hidden, chevron);
      return el;
    };

    const ol = document.createElement('ol');
    ol.className = 'pagination__pages';
    ol.setAttribute('role', 'list');
    for (const item of getPaginationItems(page, pages)) {
      const li = document.createElement('li');
      if (item.type === 'ellipsis') {
        li.className = 'pagination__ellipsis';
        li.setAttribute('aria-hidden', 'true');
        li.textContent = '…';
      } else {
        const a = document.createElement('a');
        a.className = 'pagination__page';
        a.href = hrefFor(filters, item.page);
        a.dataset.page = String(item.page);
        if (item.page === page) a.setAttribute('aria-current', 'page');
        const hidden = document.createElement('span');
        hidden.className = 'visually-hidden';
        hidden.textContent = '페이지 ';
        a.append(hidden, String(item.page));
        li.append(a);
      }
      ol.append(li);
    }

    nav.append(step('이전', page - 1, page > 1, true), ol, step('다음', page + 1, page < pages, false));
    pager.append(nav);
  };

  const updateOptions = (filters: ProjectFilters) => {
    for (const group of PROJECT_FILTER_GROUPS) {
      const others: ProjectFilters = { ...filters, [group]: undefined };
      const base = rows.filter((row) => matchesFilters(row.facets, others));
      for (const input of form.querySelectorAll<HTMLInputElement>(`input[name="${PROJECT_FILTER_PARAMS[group]}"]`)) {
        const count = input.value ? base.filter((row) => row.facets[group] === input.value).length : base.length;
        input.checked = (filters[group] ?? '') === input.value;
        input.disabled = count === 0 && !input.checked;
        const counter = input.closest('label')?.querySelector('[data-option-count]');
        if (counter) counter.textContent = `(${count})`;
      }
    }
  };

  const apply = (filters: ProjectFilters, page: number) => {
    const matched = rows.filter((row) => matchesFilters(row.facets, filters));
    const pages = Math.max(1, Math.ceil(matched.length / PROJECTS_PER_PAGE));
    const current = Math.min(Math.max(1, page), pages);
    const start = (current - 1) * PROJECTS_PER_PAGE;
    const visible = new Set(matched.slice(start, start + PROJECTS_PER_PAGE).map((row) => row.el));
    for (const row of rows) row.el.hidden = !visible.has(row.el);

    if (total) total.textContent = String(matched.length);
    if (summary) {
      summary.dataset.page = String(current);
      summary.dataset.pages = String(pages);
    }
    if (empty) empty.hidden = matched.length > 0;
    list.hidden = matched.length === 0;
    updateOptions(filters);
    renderPagination(filters, current, pages);
  };

  const navigate = (filters: ProjectFilters, page: number, focusList: boolean) => {
    window.history.pushState(null, '', hrefFor(filters, page));
    apply(filters, page);
    if (focusList) {
      list.focus({ preventScroll: true });
      root.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  };

  form.addEventListener('change', () => {
    const data = new FormData(form);
    const filters: ProjectFilters = {};
    for (const group of PROJECT_FILTER_GROUPS) {
      const value = String(data.get(PROJECT_FILTER_PARAMS[group]) ?? '');
      if (value) filters[group] = value;
    }
    navigate(filters, 1, false);
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  pager?.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-page]') : null;
    if (!link) return;
    event.preventDefault();
    navigate(readState().filters, Number(link.dataset.page), true);
  });

  window.addEventListener('popstate', () => {
    const state = readState();
    apply(state.filters, state.page);
  });

  const initial = readState();
  apply(initial.filters, initial.page);
  root.dataset.ready = '';
}

export {};
