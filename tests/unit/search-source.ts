/**
 * 단위 테스트용: src/data 실제 JSON → buildSearchDocuments 입력 (content.ts와 같은 정렬 규칙)
 * astro:content 없이 스키마로 파싱해 기본값을 적용한다.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZodType } from 'astro/zod';
import { sortByDateDesc, sortByOrder, type Entry } from '../../src/lib/collections';
import { sortProjects } from '../../src/lib/projects';
import type { SearchSource } from '../../src/lib/search/documents';
import {
  businessSchema,
  companySchema,
  newsSchema,
  partnerSchema,
  projectSchema,
  taxonomyTermSchema,
  teamSchema,
  type TaxonomyTerm,
} from '../../src/schemas';

const DATA_DIR = join(process.cwd(), 'src', 'data');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

function readDir<T>(dir: string, schema: ZodType<T>): Entry<T & { slug: string }>[] {
  return readdirSync(join(DATA_DIR, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const data = schema.parse(readJson(join(DATA_DIR, dir, name))) as T & { slug: string };
      return { id: data.slug, data };
    });
}

function readArray<T>(file: string, schema: ZodType<T>): Entry<T>[] {
  return (readJson(join(DATA_DIR, file)) as { id: string }[]).map((item) => ({ id: item.id, data: schema.parse(item) }));
}

export function loadSearchSource(): SearchSource & { taxonomies: Entry<TaxonomyTerm>[] } {
  const taxonomies = readArray('taxonomies.json', taxonomyTermSchema);
  const terms = (group: TaxonomyTerm['group']) => sortByOrder(taxonomies.filter((term) => term.data.group === group));
  const labels = (group: TaxonomyTerm['group']) => Object.fromEntries(terms(group).map((t) => [t.data.key, t.data.label]));
  const statusOrder = Object.fromEntries(terms('status').map((term, index) => [term.data.key, index]));

  const company = readdirSync(join(DATA_DIR, 'company'))
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ id: 'company', data: companySchema.parse(readJson(join(DATA_DIR, 'company', name))) }))[0];

  return {
    company,
    team: sortByOrder(readDir('team', teamSchema)),
    news: sortByDateDesc(readDir('news', newsSchema)),
    projects: sortProjects(readDir('projects', projectSchema), statusOrder),
    business: sortByOrder(readDir('business', businessSchema)),
    partners: sortByOrder(readArray('partners.json', partnerSchema)),
    termLabels: { type: labels('type'), industry: labels('industry'), status: labels('status') },
    taxonomies,
  };
}
