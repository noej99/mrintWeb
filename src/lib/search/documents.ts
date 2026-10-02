/**
 * SearchDocument 생성 (docs/research/phase-9-search.md §17, docs/decisions.md D-23)
 * src/data 원본(Source of Truth)을 읽기만 하고, 검색 전용 파생 데이터를 만든다. 원본은 변경하지 않는다.
 *
 * 검색 대상 / 필드
 * - Company : 회사명(ko/en), introduction, address (tel/fax/email 제외)
 * - Team    : 이름(ko/en), 직함(ko/en), introduction, functions, capabilities, biography (Related Projects 제외)
 * - News    : title, body — 본문 비공개 기사(rights 미확인, D-18)는 title만
 * - Project : title, name, client, overview, description, Type/Industry/Status label, 연결 Partner 이름 (year 제외)
 * - Business: title, summary, description 블록, tab title/description, Main Clients(Partner) 이름 (section title 블록 제외)
 * - Partner : 독립 문서를 만들지 않는다. 화면에 표시되는 Project/Business 문서의 필드로만 색인한다. (D-22)
 *
 * 순서: 유형 그룹(사이트 메뉴 순서 Company → Team → News → Projects → Business) → 각 목록 화면의 기존 순서
 * 입력 배열은 content.ts의 목록 함수(getTeam/getNews/getProjects/getBusinessLines)가 정렬한 순서 그대로 받는다.
 */
import type { Entry } from '../collections';
import { formatDotDate } from '../date';
import { isNewsBodyWithheld } from '../news';
import type {
  BusinessData,
  CompanyData,
  NewsBlock,
  NewsData,
  PartnerData,
  ProjectData,
  TeamData,
} from '../../schemas';
import { normalizeText } from './normalize';

export const SEARCH_TYPES = ['company', 'team', 'news', 'project', 'business'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/** 결과 화면의 유형 라벨 */
export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  company: 'COMPANY',
  team: 'TEAM',
  news: 'NEWS',
  project: 'PROJECT',
  business: 'BUSINESS',
};

export interface SearchField {
  /** 필드 이름 (테스트/디버깅용) */
  name: string;
  /** 정규화된 검색용 텍스트 (normalizeText) */
  text: string;
}

export interface SearchDocument {
  /** '{type}/{slug}' */
  id: string;
  type: SearchType;
  /** 표시용 원문 제목 */
  title: string;
  /** 사이트 기준 경로 (base 미포함, 표시 시 withBase 적용) — 실제 route와 같은 규칙 */
  url: string;
  /** 표시용 보조 정보 원문 (연도·유형, 날짜, 영문명) */
  meta?: string | undefined;
  /** meta가 날짜일 때 <time datetime> 값 (YYYY-MM-DD) */
  datetime?: string | undefined;
  fields: SearchField[];
}

export interface SearchSource {
  company?: Entry<CompanyData> | undefined;
  team: readonly Entry<TeamData>[];
  news: readonly Entry<NewsData>[];
  projects: readonly Entry<ProjectData>[];
  business: readonly Entry<BusinessData>[];
  /** Partner 이름 조회용 (67건). 참조된 항목만 문서 필드에 들어간다. */
  partners: readonly Entry<PartnerData>[];
  /** taxonomy key → label (getTermLabels) */
  termLabels: { type: Record<string, string>; industry: Record<string, string>; status: Record<string, string> };
}

/** 실제 route와 같은 경로 규칙 (src/pages/**) */
export const searchUrl = {
  company: () => '/company',
  team: (slug: string) => `/team/${slug}`,
  news: (slug: string) => `/news/${slug}`,
  project: (slug: string) => `/projects/${slug}`,
  business: (slug: string) => `/business/${slug}`,
} as const;

type RawField = [name: string, value: string | readonly string[] | undefined];

/** 빈 값은 제외하고 정규화한다. 배열은 항목을 공백으로 잇는다. */
function toFields(raw: readonly RawField[]): SearchField[] {
  return raw.flatMap(([name, value]) => {
    const joined = typeof value === 'string' ? value : value?.join(' ');
    const text = joined ? normalizeText(joined) : '';
    return text ? [{ name, text }] : [];
  });
}

const blockText = (blocks: readonly NewsBlock[] = []) =>
  blocks.map((block) => (block.type === 'paragraph' ? block.text : block.items.join(' ')));

export function companyDocument(entry: Entry<CompanyData>): SearchDocument {
  const { data } = entry;
  return {
    id: 'company',
    type: 'company',
    // /company 페이지 h1과 같은 표기 (D-04)
    title: data.name.en ?? data.name.ko,
    url: searchUrl.company(),
    fields: toFields([
      ['name', [data.name.ko, data.name.en ?? ''].filter(Boolean)],
      ['introduction', [...(data.introduction?.ko ?? []), ...(data.introduction?.en ?? [])]],
      ['address', [data.address.ko, data.address.en ?? ''].filter(Boolean)],
    ]),
  };
}

export function teamDocument(entry: Entry<TeamData>): SearchDocument {
  const { data } = entry;
  return {
    id: `team/${data.slug}`,
    type: 'team',
    title: data.nameKo,
    url: searchUrl.team(data.slug),
    meta: data.nameEn,
    fields: toFields([
      ['nameKo', data.nameKo],
      ['nameEn', data.nameEn],
      ['title', [data.titleKo ?? '', data.titleEn ?? ''].filter(Boolean)],
      ['introduction', data.introduction],
      ['functions', data.functions],
      ['capabilities', data.capabilities],
      ['biography', data.biography?.flatMap((block) => [block.title, ...block.items])],
    ]),
  };
}

export function newsDocument(entry: Entry<NewsData>): SearchDocument {
  const { data } = entry;
  return {
    id: `news/${data.slug}`,
    type: 'news',
    title: data.title,
    url: searchUrl.news(data.slug),
    meta: formatDotDate(data.date),
    datetime: data.date,
    fields: toFields([
      ['title', data.title],
      // 화면에 표시하지 않는 본문은 색인하지 않는다. (D-18)
      ['body', isNewsBodyWithheld(data) ? undefined : blockText(data.body)],
    ]),
  };
}

export function projectDocument(
  entry: Entry<ProjectData>,
  context: { termLabels: SearchSource['termLabels']; partnerName?: string | undefined },
): SearchDocument {
  const { data } = entry;
  const { termLabels, partnerName } = context;
  const typeLabel = data.type ? termLabels.type[data.type] : undefined;
  return {
    id: `project/${data.slug}`,
    type: 'project',
    title: data.title,
    url: searchUrl.project(data.slug),
    meta: [String(data.year), typeLabel].filter(Boolean).join(' · '),
    fields: toFields([
      ['title', data.title],
      ['name', data.name],
      ['client', data.client],
      ['overview', data.overview],
      ['description', blockText(data.description)],
      ['type', typeLabel],
      ['industry', termLabels.industry[data.industry]],
      ['status', termLabels.status[data.status]],
      ['partner', partnerName],
    ]),
  };
}

export function businessDocument(entry: Entry<BusinessData>, clientNames: readonly string[]): SearchDocument {
  const { data } = entry;
  const tabs = data.contents.flatMap((block) => (block.type === 'tabs' ? block.tabs : []));
  return {
    id: `business/${data.slug}`,
    type: 'business',
    title: data.title,
    url: searchUrl.business(data.slug),
    fields: toFields([
      ['title', data.title],
      ['summary', data.summary],
      ['description', data.contents.flatMap((block) => (block.type === 'description' ? [block.description] : []))],
      ['tabTitle', tabs.map((tab) => tab.title)],
      ['tabDescription', tabs.map((tab) => tab.description)],
      ['clients', clientNames],
    ]),
  };
}

/** 전체 SearchDocument (유형 그룹 → 기존 목록 순서) */
export function buildSearchDocuments(source: SearchSource): SearchDocument[] {
  const partnerNames = new Map(source.partners.map((partner) => [partner.id, partner.data.name]));
  const nameOf = (id: string | undefined) => (id ? partnerNames.get(id) : undefined);

  return [
    ...(source.company ? [companyDocument(source.company)] : []),
    ...source.team.map(teamDocument),
    ...source.news.map(newsDocument),
    ...source.projects.map((project) =>
      projectDocument(project, { termLabels: source.termLabels, partnerName: nameOf(project.data.partner) }),
    ),
    ...source.business.map((line) =>
      businessDocument(
        line,
        line.data.clients.flatMap((id) => nameOf(id) ?? []),
      ),
    ),
  ];
}
