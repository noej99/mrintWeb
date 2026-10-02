/**
 * 단위 테스트 전용 가짜 데이터. 실제 사이트 콘텐츠가 아니다.
 * 모든 값은 FIXTURE 로 표시하고, src/data 에 복사하지 않는다.
 */
import type { Entry } from '../../src/lib/collections';
import type {
  BusinessData,
  PartnerData,
  ProjectData,
  TaxonomyTerm,
  TeamData,
} from '../../src/schemas';

const review = { status: 'original', notes: [] } as const;
const seo = { status: 'draft' } as const;

export function projectEntry(slug: string, overrides: Partial<ProjectData> = {}): Entry<ProjectData> {
  return {
    id: slug,
    data: {
      slug,
      title: `FIXTURE ${slug}`,
      name: `FIXTURE ${slug}`,
      date: '2000-01-01',
      year: 2000,
      images: [],
      type: 'fixture-type',
      industry: 'fixture-industry',
      status: 'fixture-status',
      period: 'FIXTURE',
      client: 'FIXTURE',
      overview: 'FIXTURE',
      review: { ...review, notes: [] },
      seo: { ...seo },
      ...overrides,
    },
  };
}

export function teamEntry(slug: string, overrides: Partial<TeamData> = {}): Entry<TeamData> {
  return {
    id: slug,
    data: {
      slug,
      kind: 'team',
      nameKo: 'FIXTURE',
      nameEn: 'FIXTURE',
      relatedProjectsLegacy: [],
      review: { ...review, notes: [] },
      seo: { ...seo },
      ...overrides,
    },
  };
}

export function businessEntry(
  slug: BusinessData['slug'],
  overrides: Partial<BusinessData> = {},
): Entry<BusinessData> {
  return {
    id: slug,
    data: {
      slug,
      title: 'FIXTURE',
      date: '2000-01-01',
      summary: 'FIXTURE',
      contents: [{ type: 'title', title: 'FIXTURE' }],
      clients: [],
      review: { ...review, notes: [] },
      seo: { ...seo },
      ...overrides,
    },
  };
}

export function partnerEntry(id: string, overrides: Partial<PartnerData> = {}): Entry<PartnerData> {
  return {
    id,
    data: {
      name: `FIXTURE ${id}`,
      logoPermission: 'unknown',
      businessLines: [],
      review: { ...review, notes: [] },
      ...overrides,
    },
  };
}

export function termEntry(group: TaxonomyTerm['group'], key: string): Entry<TaxonomyTerm> {
  return { id: `${group}-${key}`, data: { group, key, label: `FIXTURE ${key}` } };
}

/** projectEntry 기본값에 대응하는 taxonomy */
export const fixtureTerms = [
  termEntry('type', 'fixture-type'),
  termEntry('industry', 'fixture-industry'),
  termEntry('status', 'fixture-status'),
  termEntry('year', '2000'),
];
