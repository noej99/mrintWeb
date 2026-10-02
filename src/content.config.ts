import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  businessSchema,
  companySchema,
  newsSchema,
  partnerSchema,
  projectSchema,
  taxonomyTermSchema,
  teamSchema,
} from './schemas';

/**
 * 콘텐츠는 src/data 아래에서만 관리한다. (docs/architecture.md §12)
 * 데이터는 기존 WordPress 원본에서만 이관한다. 임의 작성 금지. (CLAUDE.md §3, §4.2)
 *
 * glob 로더는 데이터의 slug 값을 entry id로 사용하고, slug가 중복되면 빌드를 실패시킨다.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/projects' }),
  schema: projectSchema,
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/news' }),
  schema: newsSchema,
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/team' }),
  schema: teamSchema,
});

const business = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/business' }),
  schema: businessSchema,
});

const company = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/company' }),
  schema: companySchema,
});

const partners = defineCollection({
  loader: file('./src/data/partners.json'),
  schema: partnerSchema,
});

const taxonomies = defineCollection({
  loader: file('./src/data/taxonomies.json'),
  schema: taxonomyTermSchema,
});

export const collections = { projects, news, team, business, company, partners, taxonomies };
