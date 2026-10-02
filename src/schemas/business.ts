import { z } from 'astro/zod';
import { entryFields, imageSchema, isoDateSchema } from './common';

/** 신규 Business Line URL (docs/requirements.md §9, CLAUDE.md §6) */
export const BUSINESS_SLUGS = [
  'it-outsourcing',
  'system-integration',
  'infrastructure',
  'solution',
] as const;

/**
 * 본문 블록 — 기존 ACF flexible content `contents`의 layout과 1:1 대응
 * - title_layout{title}             → { type: 'title', title }
 * - description_layout{description} → { type: 'description', description }
 * - img_layout{img}                 → { type: 'image', image }
 * - tabs_layout{tabs[{title,img,description}]} → { type: 'tabs', tabs[{ title, image, description }] }
 * 블록 순서와 문자열(줄바꿈·탭·공백·특수문자)은 원문 그대로 보존한다. 섹션 구분은 표시 단계에서 title 블록 기준으로 계산한다.
 */
export const BUSINESS_BLOCK_TYPES = ['title', 'description', 'image', 'tabs'] as const;

export const businessTabSchema = z.object({
  title: z.string().min(1),
  image: imageSchema.optional(),
  description: z.string().min(1),
});

export const businessBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('title'), title: z.string().min(1) }),
  z.object({ type: z.literal('description'), description: z.string().min(1) }),
  z.object({ type: z.literal('image'), image: imageSchema }),
  z.object({ type: z.literal('tabs'), tabs: z.array(businessTabSchema).min(1) }),
]);

/**
 * Business Line (docs/architecture.md §11) — 기존 post type `business_line`
 * - title: 기존 post title (ACF에 별도 name 필드 없음)
 * - summary: ACF `description-summary` (기존 목록 카드 문구)
 * - thumbnail: ACF `thumbnail` (기존 목록 카드 이미지, 메타데이터만 보존)
 * - clients: ACF `partners` 배열 → partners collection id, 원문 순서 그대로 (Main Clients)
 * - Project와의 관계 필드는 두지 않는다. (원본에 관계 데이터 없음)
 */
export const businessSchema = z.object({
  ...entryFields,
  slug: z.enum(BUSINESS_SLUGS),
  title: z.string().min(1),
  date: isoDateSchema,
  summary: z.string().min(1),
  thumbnail: imageSchema.optional(),
  contents: z.array(businessBlockSchema).min(1),
  clients: z.array(z.string().min(1)).default([]),
});

export type BusinessSlug = (typeof BUSINESS_SLUGS)[number];
export type BusinessBlock = z.infer<typeof businessBlockSchema>;
export type BusinessTab = z.infer<typeof businessTabSchema>;
export type BusinessData = z.infer<typeof businessSchema>;
