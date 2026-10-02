/**
 * src/data 의 실제 JSON 파일을 스키마로 검증한다.
 * (Markdown frontmatter는 Astro 빌드 시 content collection이 검증한다.)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ZodType } from 'astro/zod';
import { findDuplicates } from '../../src/lib/collections';
import {
  businessSchema,
  companySchema,
  newsSchema,
  partnerSchema,
  projectSchema,
  taxonomyTermSchema,
  teamSchema,
} from '../../src/schemas';

const DATA_DIR = join(process.cwd(), 'src', 'data');

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

const jsonFiles = (dir: string) =>
  readdirSync(join(DATA_DIR, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(DATA_DIR, dir, name));

const formatIssues = (error: { issues: { path: PropertyKey[]; message: string }[] }) =>
  error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');

describe.each([
  ['projects', projectSchema],
  ['business', businessSchema],
  ['company', companySchema],
  ['team', teamSchema],
  ['news', newsSchema],
] as const)('src/data/%s/*.json', (dir, schema: ZodType) => {
  const files = jsonFiles(dir);

  it.skipIf(files.length === 0).each(files)('%s', (file) => {
    const result = schema.safeParse(readJson(file));
    expect(result.success, result.success ? '' : formatIssues(result.error)).toBe(true);
  });

  it('slug가 중복되지 않는다', () => {
    const slugs = files
      .map((file) => (readJson(file) as { slug?: unknown }).slug)
      .filter((slug): slug is string => typeof slug === 'string');
    expect(findDuplicates(slugs)).toEqual([]);
  });
});

describe.each([
  ['partners.json', partnerSchema],
  ['taxonomies.json', taxonomyTermSchema],
] as const)('src/data/%s', (file, schema: ZodType) => {
  const items = readJson(join(DATA_DIR, file));

  it('배열이다', () => {
    expect(Array.isArray(items)).toBe(true);
  });

  const list = Array.isArray(items) ? (items as Record<string, unknown>[]) : [];

  it('항목마다 고유한 id가 있다', () => {
    const ids = list.map((item) => item.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(findDuplicates(ids as string[])).toEqual([]);
  });

  it.skipIf(list.length === 0).each(list.map((item, index) => [String(item.id ?? index), item]))(
    '%s',
    (_id, item) => {
      const result = schema.safeParse(item);
      expect(result.success, result.success ? '' : formatIssues(result.error)).toBe(true);
    },
  );
});
