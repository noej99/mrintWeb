import { z } from 'astro/zod';
import { legacyFields, orderSchema, termKeySchema } from './common';

/**
 * Projects filter용 taxonomy (docs/architecture.md §15)
 * key/label은 기존 WordPress taxonomy 원본을 그대로 사용한다. 임의 재분류 금지.
 * year 그룹 사용 여부는 고객 결정 후 확정 (docs/decisions.md D-08)
 */
export const TAXONOMY_GROUPS = ['type', 'industry', 'status', 'year'] as const;

export const taxonomyGroupSchema = z.enum(TAXONOMY_GROUPS);

export const taxonomyTermSchema = z.object({
  group: taxonomyGroupSchema,
  key: termKeySchema,
  label: z.string().min(1),
  order: orderSchema,
  /** 기존 taxonomy slug (한글일 수 있음 — redirect map 작성용) */
  legacySlug: z.string().optional(),
  /** 기존 WordPress term count (원문 기록용) */
  count: z.number().int().nonnegative().optional(),
  ...legacyFields,
});

export type TaxonomyGroup = z.infer<typeof taxonomyGroupSchema>;
export type TaxonomyTerm = z.infer<typeof taxonomyTermSchema>;
