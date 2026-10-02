/**
 * Phase 9 Search — 정규화 / 매칭 / SearchDocument 생성 (docs/decisions.md D-23)
 * 실제 src/data 원본으로 검증한다. 기대값은 2026-10-02 데이터 기준이다.
 */
import { describe, expect, it } from 'vitest';
import {
  buildSearchDocuments,
  SEARCH_TYPES,
  type SearchDocument,
  type SearchType,
} from '../../src/lib/search/documents';
import { containsToken, searchDocuments } from '../../src/lib/search/match';
import { compact, MAX_QUERY_LENGTH, normalizeText, sanitizeQuery, tokenize } from '../../src/lib/search/normalize';
import { loadSearchSource } from './search-source';

const source = loadSearchSource();
const documents = buildSearchDocuments(source);
const byId = (id: string) => documents.find((doc) => doc.id === id);

const ids = (query: string) => searchDocuments(documents, query).map((doc) => doc.id);
const countByType = (query: string) => {
  const counts: Partial<Record<SearchType, number>> = {};
  for (const doc of searchDocuments(documents, query)) counts[doc.type] = (counts[doc.type] ?? 0) + 1;
  return counts;
};
const allText = (doc: SearchDocument | undefined) => doc?.fields.map((field) => field.text).join('\n') ?? '';

/** 908 본문에만 있는 문구 (제목·다른 콘텐츠에 없음) */
const NEWS_908_BODY_ONLY = '내실있는';

describe('normalizeText', () => {
  it.each([
    ['CubeOne', 'cubeone'],
    ['CubeOne™ API', 'cubeonetm api'],
    ['㈜미래아이엔텍', '(주)미래아이엔텍'],
    ['ＩＢＫ기업은행', 'ibk기업은행'],
    ['FIPS‑140', 'fips-140'],
    ['A–B−C', 'a-b-c'],
    ['  IT\r\n\t인프라   구축 ', 'it 인프라 구축'],
    ['Cube​One', 'cubeone'],
    ['2026.01 ~ 2028.03', '2026.01 ~ 2028.03'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });

  it('compact는 공백을 모두 제거한다', () => {
    expect(compact('sc 제일 은행')).toBe('sc제일은행');
  });

  it('tokenize: 공백 기준 단어, 중복 제거', () => {
    expect(tokenize('  SC  제일 sc ')).toEqual(['sc', '제일']);
    expect(tokenize('   ')).toEqual([]);
  });

  it('sanitizeQuery: trim + 최대 길이 제한', () => {
    expect(sanitizeQuery('  기업은행  ')).toBe('기업은행');
    expect(sanitizeQuery(null)).toBe('');
    expect(sanitizeQuery('x'.repeat(MAX_QUERY_LENGTH + 20))).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe('containsToken', () => {
  it('짧은 영문 단어(1~3자)는 영문/숫자 단어 경계에서만 일치한다', () => {
    expect(containsToken('infra business 사업 총괄', 'si')).toBe(false);
    expect(containsToken('oracle version', 'si')).toBe(false);
    expect(containsToken('digital transformation', 'it')).toBe(false);
    expect(containsToken('ito 팀', 'it')).toBe(false);
    expect(containsToken('competitors', 'ito')).toBe(false);
    expect(containsToken('scbk 프로젝트', 'sc')).toBe(false);
  });

  it('한글·기호와 붙은 짧은 영문 단어는 일치한다', () => {
    expect(containsToken('sc제일은행 대출', 'sc')).toBe(true);
    expect(containsToken('sbi저축은행 it아웃소싱 통합', 'it')).toBe(true);
    expect(containsToken('(system integration, si)은', 'si')).toBe(true);
    expect(containsToken('ito / si / 인프라', 'si')).toBe(true);
  });

  it('4자 이상 영문, 한글은 부분 일치한다', () => {
    expect(containsToken('cubeonetm plug-in', 'cube')).toBe(true);
    expect(containsToken('ibk기업은행 정보시스템 운영', '시스템')).toBe(true);
    expect(containsToken('ibk기업은행', '은행')).toBe(true);
  });
});

describe('searchDocuments', () => {
  const docs = [
    { id: 'a', fields: [{ name: 'title', text: 'sc제일은행 대출시스템' }] },
    { id: 'b', fields: [{ name: 'client', text: 'lg cns' }] },
    { id: 'c', fields: [{ name: 'title', text: 'infra business' }, { name: 'body', text: '제일' }] },
  ];

  it('모든 단어가 문서 어딘가에 있어야 일치한다 (AND, 필드 간 가능)', () => {
    expect(searchDocuments(docs, '제일 대출').map((d) => d.id)).toEqual(['a']);
    expect(searchDocuments(docs, 'infra 제일').map((d) => d.id)).toEqual(['c']);
  });

  it('공백 차이를 허용한다', () => {
    expect(searchDocuments(docs, 'SC 제일은행').map((d) => d.id)).toEqual(['a']);
    expect(searchDocuments(docs, 'LGCNS').map((d) => d.id)).toEqual(['b']);
    expect(searchDocuments(docs, 'lg cns').map((d) => d.id)).toEqual(['b']);
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(searchDocuments(docs, 'Sc제일').map((d) => d.id)).toEqual(['a']);
  });

  it('빈 검색어는 결과가 없다', () => {
    expect(searchDocuments(docs, '')).toEqual([]);
    expect(searchDocuments(docs, '   ')).toEqual([]);
  });

  it('입력 순서를 유지한다 (점수 기반 정렬 없음)', () => {
    expect(searchDocuments(docs, '제일').map((d) => d.id)).toEqual(['a', 'c']);
  });
});

describe('buildSearchDocuments — 문서 구성', () => {
  it('유형별 문서 수: Company 1 / Team 6 / News 8 / Project 57 / Business 4 (Partner 독립 문서 없음)', () => {
    const counts = Object.fromEntries(SEARCH_TYPES.map((type) => [type, documents.filter((d) => d.type === type).length]));
    expect(counts).toEqual({ company: 1, team: 6, news: 8, project: 57, business: 4 });
    expect(documents).toHaveLength(76);
  });

  it('id가 중복되지 않는다', () => {
    expect(new Set(documents.map((doc) => doc.id)).size).toBe(documents.length);
  });

  it('유형 그룹 순서 → 각 목록의 기존 순서', () => {
    const typeOrder = documents.map((doc) => SEARCH_TYPES.indexOf(doc.type));
    expect(typeOrder).toEqual([...typeOrder].sort((a, b) => a - b));
    const slugsOf = (type: SearchType) => documents.filter((d) => d.type === type).map((d) => d.url.split('/').pop());
    expect(slugsOf('team')).toEqual(source.team.map((e) => e.data.slug));
    expect(slugsOf('news')).toEqual(source.news.map((e) => e.data.slug));
    expect(slugsOf('project')).toEqual(source.projects.map((e) => e.data.slug));
    expect(slugsOf('business')).toEqual(source.business.map((e) => e.data.slug));
  });

  it('URL은 실제 route 규칙과 같다', () => {
    expect(byId('company')?.url).toBe('/company');
    for (const doc of documents.filter((d) => d.type !== 'company')) {
      const prefix = { team: '/team/', news: '/news/', project: '/projects/', business: '/business/' }[
        doc.type as Exclude<SearchType, 'company'>
      ];
      expect(doc.url).toMatch(new RegExp(`^${prefix}[a-z0-9-]+$`));
    }
    expect(documents.filter((d) => d.type === 'project').map((d) => d.url)).toEqual(
      source.projects.map((e) => `/projects/${e.data.slug}`),
    );
  });

  it('제목과 표시 정보는 원문 그대로다', () => {
    expect(byId('company')?.title).toBe('Mirae I&Tec');
    expect(byId('team/ito-team')).toMatchObject({ title: 'ITO 팀', meta: 'IT Outsourcing Team' });
    expect(byId('news/news-1583')).toMatchObject({ meta: '2026.03.31', datetime: '2026-03-31' });
    expect(byId('project/project-973')).toMatchObject({ title: 'IBK기업은행 정보시스템 운영', meta: '2022 · ITO' });
    expect(byId('project/project-982')?.meta).toBe('2024');
    expect(byId('business/it-outsourcing')?.title).toBe('IT OUTSOURCING');
  });

  it('Company: 연락처(tel/fax/email)는 색인하지 않는다', () => {
    const company = source.company?.data;
    const text = allText(byId('company'));
    expect(byId('company')?.fields.map((f) => f.name)).toEqual(['name', 'introduction', 'address']);
    expect(text).not.toContain(company?.tel);
    expect(text).not.toContain(company?.fax);
    expect(text).not.toContain(company?.email);
  });

  it('Team: Related Projects 제목은 색인하지 않는다', () => {
    for (const doc of documents.filter((d) => d.type === 'team')) {
      expect(doc.fields.map((f) => f.name)).not.toContain('relatedProjects');
    }
    const team = source.team.find((e) => e.data.slug === 'infrastructure-team');
    const legacyTitle = team?.data.relatedProjectsLegacy[0]?.title ?? '';
    expect(legacyTitle).not.toBe('');
    expect(allText(byId('team/infrastructure-team'))).not.toContain(normalizeText(legacyTitle));
  });

  it('News 908: 본문 비공개 → title만 색인, 본문은 색인/결과에 없음', () => {
    const doc = byId('news/news-908');
    expect(doc?.fields.map((f) => f.name)).toEqual(['title']);
    const serialized = JSON.stringify(documents);
    const news908 = source.news.find((e) => e.data.slug === 'news-908');
    for (const block of news908?.data.body ?? []) {
      const text = block.type === 'paragraph' ? block.text : block.items.join(' ');
      expect(serialized).not.toContain(normalizeText(text));
      expect(serialized).not.toContain(text);
    }
    expect(ids(NEWS_908_BODY_ONLY)).toEqual([]);
    // 공개된 제목은 검색된다.
    expect(ids('흥국생명 IT 어플리케이션 유지보수 사업')).toContain('news/news-908');
  });

  it('다른 News는 본문도 색인한다', () => {
    expect(byId('news/news-1429')?.fields.map((f) => f.name)).toEqual(['title', 'body']);
  });

  it('Project: year는 별도 필드로 색인하지 않고 Type/Industry/Status label, Partner 이름을 색인한다', () => {
    const doc = byId('project/project-1097');
    const names = doc?.fields.map((f) => f.name) ?? [];
    expect(names).not.toContain('year');
    expect(doc?.fields.find((f) => f.name === 'partner')?.text).toBe('sc 제일은행');
    expect(doc?.fields.find((f) => f.name === 'industry')?.text).toBe('은행');
    expect(doc?.fields.find((f) => f.name === 'status')?.text).toBeDefined();
  });

  it('Business: section title 블록은 색인하지 않고, tab title/description과 Main Clients 이름을 색인한다', () => {
    for (const doc of documents.filter((d) => d.type === 'business')) {
      const names = doc.fields.map((f) => f.name);
      expect(names).not.toContain('sectionTitle');
      expect(allText(doc)).not.toContain('service summary');
    }
    expect(byId('business/solution')?.fields.find((f) => f.name === 'tabTitle')?.text).toContain('cubeonetm');
    expect(byId('business/infrastructure')?.fields.find((f) => f.name === 'tabTitle')?.text).toContain('cloud');
    expect(byId('business/system-integration')?.fields.find((f) => f.name === 'clients')?.text).toContain(
      'sc 제일은행',
    );
  });

  it('Partner: 미연결 Partner 이름은 Partner 필드에 들어가지 않는다', () => {
    const linked = new Set([
      ...source.projects.flatMap((e) => (e.data.partner ? [e.data.partner] : [])),
      ...source.business.flatMap((e) => e.data.clients),
    ]);
    const linkedNames = new Set(source.partners.filter((p) => linked.has(p.id)).map((p) => normalizeText(p.data.name)));
    const unlinkedOnly = source.partners
      .filter((p) => !linked.has(p.id))
      .map((p) => normalizeText(p.data.name))
      .filter((name) => !linkedNames.has(name));
    expect(source.partners).toHaveLength(67);
    expect(linked.size).toBe(40);
    const partnerTexts = documents.flatMap((d) =>
      d.fields.filter((f) => f.name === 'partner' || f.name === 'clients').map((f) => f.text),
    );
    for (const name of unlinkedOnly) {
      expect(partnerTexts.some((text) => text.includes(name)), name).toBe(false);
    }
  });
});

describe('검색 시나리오 (실제 데이터)', () => {
  it.each<[string, Partial<Record<SearchType, number>>]>([
    ['기업은행', { news: 2, project: 4, business: 1 }],
    ['은행', { team: 1, news: 3, project: 30, business: 3 }],
    ['IT', { company: 1, team: 4, news: 6, project: 6, business: 4 }],
    ['SI', { team: 4, news: 1, project: 25, business: 1 }],
    ['SC', { project: 17, business: 2 }],
    ['CubeOne', { news: 1, business: 1 }],
    ['Cloud', { business: 1 }],
    ['흥국생명', { news: 3, project: 1, business: 2 }],
    ['시스템', { team: 3, news: 5, project: 29, business: 3 }],
    ['ITO', { company: 1, team: 4, news: 2, project: 24 }],
    ['보험', { team: 1, news: 2, project: 8, business: 1 }],
  ])('%s', (query, expected) => {
    expect(countByType(query)).toEqual(expected);
  });

  it('기업은행: IBK기업은행 프로젝트와 Main Clients가 있는 IT OUTSOURCING', () => {
    expect(ids('기업은행')).toEqual(expect.arrayContaining(['project/project-973', 'business/it-outsourcing']));
  });

  it('SI: 영문 단어 내부(Business, Version)는 일치하지 않는다', () => {
    expect(ids('SI')).not.toContain('team/ceo');
    expect(ids('SI')).not.toContain('business/solution');
    expect(ids('SI')).toContain('team/si-team');
  });

  it('IT: ITO/Digital 내부는 일치하지 않는다', () => {
    expect(ids('IT')).not.toContain('team/future-technology-research-center');
    expect(ids('IT')).toContain('business/it-outsourcing');
  });

  it('SC: SC제일은행 프로젝트 17건 + Business 2건 (탭 본문, Main Clients)', () => {
    expect(ids('SC').filter((id) => id.startsWith('business/'))).toEqual([
      'business/it-outsourcing',
      'business/system-integration',
    ]);
    expect(ids('SC 제일')).toEqual(ids('SC'));
  });

  it('CubeOne: 대소문자/™ 무관', () => {
    const expected = ['news/news-1429', 'business/solution'];
    expect(ids('CubeOne')).toEqual(expected);
    expect(ids('cubeone')).toEqual(expected);
    expect(ids('CUBEONE™')).toEqual(expected);
  });

  it('Cloud: Infrastructure 탭 제목', () => {
    expect(ids('Cloud')).toEqual(['business/infrastructure']);
  });

  it('흥국생명: 908은 제목으로만 일치', () => {
    expect(ids('흥국생명')).toEqual(expect.arrayContaining(['news/news-908', 'project/project-406']));
  });

  it('하이픈/공백 변형', () => {
    expect(ids('FIPS-140')).toEqual(['news/news-1429']);
    expect(ids('LGCNS')).toEqual(ids('LG CNS'));
    expect(ids('LG CNS')).toHaveLength(3);
  });

  it('결과가 없는 검색어', () => {
    expect(ids('존재하지않는검색어')).toEqual([]);
    expect(ids('<script>alert(1)</script>')).toEqual([]);
  });
});
