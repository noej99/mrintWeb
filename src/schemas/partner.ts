import { z } from 'astro/zod';
import { imageSchema, legacyFields, orderSchema, reviewSchema } from './common';
import { BUSINESS_SLUGS } from './business';

/**
 * Partner (docs/sitemap.md §10, docs/migration.md §9) — 기존 post type `partners` 67건 전체
 * - 개별 공개 페이지/archive 없이 Business Line Main Clients, Project partner 데이터로만 사용한다.
 * - 화면 표시 대상은 Business Line clients 또는 Project partner로 참조된 항목뿐이다. 미참조 항목은 데이터로만 보존한다.
 * - 이름이 같은 항목(중복 의심)도 병합하지 않는다. (review.notes에 기록)
 * - legacySlug: 기존 slug 원문 (decode). `-2` 접미사 포함 그대로 보존
 * - logo: ACF `bi` media 메타데이터. 로고 사용 권한은 확인 전까지 unknown (CLAUDE.md §3, §14)
 * - businessLines: Business Line clients의 역참조 (integrity test에서 일치 검증)
 */
export const partnerSchema = z.object({
  name: z.string().min(1),
  logo: imageSchema.optional(),
  logoPermission: z.enum(['unknown', 'granted', 'denied']).default('unknown'),
  businessLines: z.array(z.enum(BUSINESS_SLUGS)).default([]),
  order: orderSchema,
  ...legacyFields,
  legacySlug: z.string().min(1).optional(),
  review: reviewSchema,
});

export type PartnerData = z.infer<typeof partnerSchema>;
