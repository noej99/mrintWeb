/**
 * 데이터 접근 계층 (docs/architecture.md §12)
 * 페이지/컴포넌트는 astro:content 나 src/data 를 직접 사용하지 않고 이 모듈만 사용한다.
 * 향후 CMS/API로 교체할 때 이 모듈의 구현만 바꾼다.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { BusinessSlug, TaxonomyGroup } from '../schemas';
import { partnerUsage, type PartnerUsage } from './business';
import { resolveReferences, sortByDateDesc, sortByOrder } from './collections';
import type { CountedCollection } from './constants';
import { checkIntegrity, compareCounts } from './integrity';
import { projectHistory, sortProjects } from './projects';

export type ProjectEntry = CollectionEntry<'projects'>;
export type NewsEntry = CollectionEntry<'news'>;
export type TeamEntry = CollectionEntry<'team'>;
export type BusinessEntry = CollectionEntry<'business'>;
export type CompanyEntry = CollectionEntry<'company'>;
export type PartnerEntry = CollectionEntry<'partners'>;
export type TaxonomyEntry = CollectionEntry<'taxonomies'>;

// ── Projects ──
/** 기존 사이트 목록 순서 (Status → Year → 게시일, docs/decisions.md D-08) */
export async function getProjects(): Promise<ProjectEntry[]> {
  const statusTerms = await getTaxonomyTerms('status');
  const statusOrder = Object.fromEntries(statusTerms.map((term, index) => [term.data.key, index]));
  return sortProjects(await getCollection('projects'), statusOrder);
}

export async function getProject(slug: string): Promise<ProjectEntry | undefined> {
  return getEntry('projects', slug);
}

export async function getRelatedProjects(slugs: readonly string[] = []): Promise<ProjectEntry[]> {
  return resolveReferences(await getProjects(), slugs).found;
}

/** History: 같은 partner의 프로젝트 (자기 자신 포함) */
export async function getProjectHistory(project: ProjectEntry): Promise<ProjectEntry[]> {
  return projectHistory(await getProjects(), project);
}

export async function getPartner(id: string | undefined): Promise<PartnerEntry | undefined> {
  return id ? getEntry('partners', id) : undefined;
}

/** 그룹별 key → label */
export async function getTermLabels(group: TaxonomyGroup): Promise<Record<string, string>> {
  const terms = await getTaxonomyTerms(group);
  return Object.fromEntries(terms.map((term) => [term.data.key, term.data.label]));
}

// ── News ──
export async function getNews(): Promise<NewsEntry[]> {
  return sortByDateDesc(await getCollection('news'));
}

export async function getNewsItem(slug: string): Promise<NewsEntry | undefined> {
  return getEntry('news', slug);
}

// ── Team ──
export async function getTeam(): Promise<TeamEntry[]> {
  return sortByOrder(await getCollection('team'));
}

export async function getTeamMember(slug: string): Promise<TeamEntry | undefined> {
  return getEntry('team', slug);
}

// ── Business ──
export async function getBusinessLines(): Promise<BusinessEntry[]> {
  return sortByOrder(await getCollection('business'));
}

export async function getBusinessLine(slug: BusinessSlug): Promise<BusinessEntry | undefined> {
  return getEntry('business', slug);
}

/** Main Clients — 기존 ACF partners 원문 순서 그대로 */
export async function getBusinessClients(line: BusinessEntry): Promise<PartnerEntry[]> {
  return resolveReferences(await getPartners(), line.data.clients).found;
}

// ── Partners ──
/** 67건 전체 (화면 미표시 항목 포함). 표시 대상은 getPartnerUsage().displayed */
export async function getPartners(): Promise<PartnerEntry[]> {
  return sortByOrder(await getCollection('partners'));
}

export async function getPartnerUsage(): Promise<PartnerUsage> {
  const [partners, business, projects] = await Promise.all([
    getCollection('partners'),
    getCollection('business'),
    getCollection('projects'),
  ]);
  return partnerUsage(partners, business, projects);
}

// ── Taxonomies ──
export async function getTaxonomyTerms(group: TaxonomyGroup): Promise<TaxonomyEntry[]> {
  return sortByOrder(await getCollection('taxonomies', (term) => term.data.group === group));
}

export async function getTermLabel(group: TaxonomyGroup, key: string): Promise<string | undefined> {
  const terms = await getTaxonomyTerms(group);
  return terms.find((term) => term.data.key === key)?.data.label;
}

// ── Company (단일 항목) ──
export async function getCompany(): Promise<CompanyEntry | undefined> {
  const entries = await getCollection('company');
  if (entries.length > 1) {
    throw new Error(`company collection에는 항목이 1개만 있어야 합니다. (현재 ${entries.length}개)`);
  }
  return entries[0];
}

// ── 검증 ──
export async function getContentCounts(): Promise<Record<CountedCollection, number>> {
  const [business, projects, news, team, partners] = await Promise.all([
    getCollection('business'),
    getCollection('projects'),
    getCollection('news'),
    getCollection('team'),
    getCollection('partners'),
  ]);
  return {
    business: business.length,
    projects: projects.length,
    news: news.length,
    team: team.length,
    partners: partners.length,
  };
}

export async function getContentReport() {
  const [projects, team, business, partners, taxonomies] = await Promise.all([
    getCollection('projects'),
    getCollection('team'),
    getCollection('business'),
    getCollection('partners'),
    getCollection('taxonomies'),
  ]);
  return {
    issues: checkIntegrity({ projects, team, business, partners, taxonomies }),
    countMismatches: compareCounts(await getContentCounts()),
  };
}
