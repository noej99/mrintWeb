import type {
  BusinessData,
  PartnerData,
  ProjectData,
  TaxonomyGroup,
  TaxonomyTerm,
  TeamData,
} from '../schemas';
import { findDuplicates, resolveReferences, type Entry } from './collections';
import { EXPECTED_CONTENT_COUNTS, type CountedCollection } from './constants';

export interface IntegrityIssue {
  collection: string;
  id: string;
  field: string;
  message: string;
}

export interface IntegrityInput {
  projects: readonly Entry<ProjectData>[];
  team: readonly Entry<TeamData>[];
  business: readonly Entry<BusinessData>[];
  partners: readonly Entry<PartnerData>[];
  taxonomies: readonly Entry<TaxonomyTerm>[];
}

const PROJECT_TERM_FIELDS = ['type', 'industry', 'status', 'year'] as const satisfies readonly TaxonomyGroup[];

/**
 * collection 간 참조 무결성을 검사한다. (스키마 단위 검증은 Astro 빌드가 수행)
 * - Project의 type/industry/status/year key가 taxonomies에 존재하는지 (type 없음은 원본 그대로 허용: #982)
 * - Project partner가 partners에 존재하는지
 * - relatedProjects, Business clients, Partner businessLines 참조가 존재하는지
 * - Business clients 안의 중복, Partner businessLines ↔ Business clients 역참조 일치
 * - taxonomy (group, key) 중복
 */
export function checkIntegrity(input: IntegrityInput): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  const termKeys = new Map<TaxonomyGroup, Set<string>>();
  for (const term of input.taxonomies) {
    const keys = termKeys.get(term.data.group) ?? new Set<string>();
    keys.add(term.data.key);
    termKeys.set(term.data.group, keys);
  }

  for (const duplicate of findDuplicates(
    input.taxonomies.map((term) => `${term.data.group}:${term.data.key}`),
  )) {
    issues.push({ collection: 'taxonomies', id: duplicate, field: 'key', message: 'taxonomy key가 중복되었습니다.' });
  }

  for (const project of input.projects) {
    for (const field of PROJECT_TERM_FIELDS) {
      const value = project.data[field];
      if (value === undefined) continue;
      const key = String(value);
      if (!termKeys.get(field)?.has(key)) {
        issues.push({
          collection: 'projects',
          id: project.id,
          field,
          message: `taxonomies에 없는 ${field} key입니다: ${key}`,
        });
      }
    }
  }

  const checkRefs = <T extends Entry>(
    collection: string,
    id: string,
    field: string,
    target: readonly T[],
    ids: readonly string[] | undefined,
  ) => {
    for (const missing of resolveReferences(target, ids).missing) {
      issues.push({ collection, id, field, message: `존재하지 않는 참조입니다: ${missing}` });
    }
  };

  for (const project of input.projects) {
    checkRefs('projects', project.id, 'relatedProjects', input.projects, project.data.relatedProjects);
    if (project.data.partner) checkRefs('projects', project.id, 'partner', input.partners, [project.data.partner]);
  }
  for (const member of input.team) {
    checkRefs('team', member.id, 'relatedProjects', input.projects, member.data.relatedProjects);
  }
  for (const line of input.business) {
    checkRefs('business', line.id, 'clients', input.partners, line.data.clients);
    for (const duplicate of findDuplicates(line.data.clients)) {
      issues.push({ collection: 'business', id: line.id, field: 'clients', message: `clients에 중복된 참조입니다: ${duplicate}` });
    }
  }
  for (const partner of input.partners) {
    checkRefs('partners', partner.id, 'businessLines', input.business, partner.data.businessLines);
    const expected = input.business
      .filter((line) => line.data.clients.includes(partner.id))
      .map((line) => line.id)
      .sort();
    const actual = [...partner.data.businessLines].sort();
    if (expected.join(',') !== actual.join(',')) {
      issues.push({
        collection: 'partners',
        id: partner.id,
        field: 'businessLines',
        message: `Business Line clients 역참조와 다릅니다: [${actual.join(', ')}] / clients 기준 [${expected.join(', ')}]`,
      });
    }
  }

  return issues;
}

export interface CountMismatch {
  collection: CountedCollection;
  expected: number;
  actual: number;
}

/** 이관 건수를 기존 사이트 건수와 비교한다. */
export function compareCounts(actual: Record<CountedCollection, number>): CountMismatch[] {
  return (Object.keys(EXPECTED_CONTENT_COUNTS) as CountedCollection[])
    .filter((collection) => actual[collection] !== EXPECTED_CONTENT_COUNTS[collection])
    .map((collection) => ({
      collection,
      expected: EXPECTED_CONTENT_COUNTS[collection],
      actual: actual[collection],
    }));
}
