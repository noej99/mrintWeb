/**
 * 전체 사이트 검색 (/search?q=) — docs/decisions.md D-23
 * - build 시 생성된 /search-index.json을 받아 브라우저에서 검색한다. (서버 DB/외부 검색 서비스 없음)
 * - 결과: 유형 그룹(Company → Team → News → Projects → Business) → 각 목록의 기존 순서
 * - 검색어와 결과는 textContent/DOM API로만 출력한다. (innerHTML 사용 금지 — 기존 사이트 XSS 문제 재발 방지)
 * - Project 목록 필터(/projects, Phase 7)와는 별개 기능이다.
 */
import { SEARCH_TYPE_LABELS, SEARCH_TYPES, type SearchDocument } from '@/lib/search/documents';
import { searchDocuments } from '@/lib/search/match';
import { sanitizeQuery } from '@/lib/search/normalize';
import { withBase } from '@/lib/url';

interface SearchIndex {
  documents: SearchDocument[];
}

const root = document.querySelector<HTMLElement>('[data-search]');

if (root) {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const guide = root.querySelector<HTMLElement>('[data-search-guide]');
  const empty = root.querySelector<HTMLElement>('[data-search-empty]');
  const failure = root.querySelector<HTMLElement>('[data-search-error]');
  const results = root.querySelector<HTMLElement>('[data-search-results]');

  const setText = (el: HTMLElement | null, text: string) => {
    if (el) el.textContent = text;
  };
  const show = (el: HTMLElement | null, visible: boolean) => {
    if (el) el.hidden = !visible;
  };

  const create = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  const renderRow = (doc: SearchDocument) => {
    const item = create('li');
    const link = create('a', 'search-row');
    link.href = withBase(doc.url);
    link.append(create('span', 'search-row__title', doc.title));
    if (doc.meta && doc.datetime) {
      const time = create('time', 'search-row__meta mono', doc.meta);
      time.dateTime = doc.datetime;
      link.append(time);
    } else if (doc.meta) {
      link.append(create('span', 'search-row__meta mono', doc.meta));
    }
    const arrow = create('span', 'search-row__arrow');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    item.append(link);
    return item;
  };

  const render = (matched: readonly SearchDocument[]) => {
    if (!results) return;
    const groups = SEARCH_TYPES.map((type) => ({ type, items: matched.filter((doc) => doc.type === type) })).filter(
      (group) => group.items.length > 0,
    );
    results.replaceChildren(
      ...groups.map(({ type, items }) => {
        const headingId = `search-group-${type}`;
        const section = create('section', 'search-group');
        section.setAttribute('aria-labelledby', headingId);
        const heading = create('h2', 'search-group__title');
        heading.id = headingId;
        heading.append(
          create('span', 'search-group__label', SEARCH_TYPE_LABELS[type]),
          ' ',
          create('span', 'search-group__count mono', `${items.length}건`),
        );
        const list = create('ol', 'search-list');
        list.setAttribute('role', 'list');
        list.append(...items.map(renderRow));
        section.append(heading, list);
        return section;
      }),
    );
  };

  const run = async () => {
    const query = sanitizeQuery(new URLSearchParams(window.location.search).get('q'));
    if (input) input.value = query;

    if (!query) {
      show(guide, true);
      return;
    }

    root.setAttribute('aria-busy', 'true');
    setText(status, '검색 중…');
    try {
      const response = await fetch(root.dataset.indexUrl ?? withBase('/search-index.json'));
      if (!response.ok) throw new Error(`search index ${response.status}`);
      const { documents } = (await response.json()) as SearchIndex;
      const matched = searchDocuments(documents, query);
      render(matched);
      show(empty, matched.length === 0);
      setText(status, `“${query}” 검색 결과 ${matched.length}건`);
    } catch {
      setText(status, '');
      show(failure, true);
    } finally {
      root.removeAttribute('aria-busy');
    }
  };

  void run();
}
