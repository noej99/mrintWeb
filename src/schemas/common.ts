import { z } from 'astro/zod';

/**
 * 신규 URL slug 규칙 (CLAUDE.md §6, docs/sitemap.md §13)
 * - lowercase 영문/숫자, 단어 구분은 '-'
 * - 한글 slug 금지
 * - 숫자만으로 된 slug 금지 (기존 사이트의 numeric slug 문제)
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NUMERIC_ONLY_PATTERN = /^[0-9]+(?:-[0-9]+)*$/;

export const slugSchema = z
  .string()
  .regex(SLUG_PATTERN, 'slug는 lowercase 영문/숫자 kebab-case여야 합니다.')
  .refine((value) => !NUMERIC_ONLY_PATTERN.test(value), 'slug는 숫자만으로 구성할 수 없습니다.');

/** filter query 등에 쓰이는 taxonomy key. 연도(2026 등) 때문에 숫자만으로 된 key를 허용한다. */
export const termKeySchema = z
  .string()
  .regex(SLUG_PATTERN, 'taxonomy key는 lowercase 영문/숫자 kebab-case여야 합니다.');

/** YYYY-MM-DD 형식의 원문 날짜 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다.');

/**
 * 고객 확인 상태 (CLAUDE.md §3)
 * - original: 기존 사이트 원문 그대로 (기본값)
 * - needs-confirmation: 오탈자/기간/상태/중복 등 고객 확인 필요
 * - confirmed: 고객 확인 완료
 */
export const reviewStatusSchema = z.enum(['original', 'needs-confirmation', 'confirmed']);

export const reviewSchema = z
  .object({
    status: reviewStatusSchema.default('original'),
    notes: z
      .array(
        z.object({
          field: z.string().min(1),
          note: z.string().min(1),
        }),
      )
      .default([]),
  })
  .default({ status: 'original', notes: [] });

/**
 * 페이지별 SEO 문구. 승인(approved)된 값만 배포에 사용한다. (CLAUDE.md §14, docs/decisions.md D-12)
 */
export const seoSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    status: z.enum(['draft', 'approved']).default('draft'),
  })
  .default({ status: 'draft' });

/** 기존 WordPress 데이터와의 매핑 (docs/migration.md §5) */
export const legacyFields = {
  legacyId: z.union([z.string().min(1), z.number().int()]).optional(),
  legacyUrl: z.string().startsWith('/', 'legacyUrl은 /로 시작하는 경로여야 합니다.').optional(),
};

/**
 * 이미지 메타데이터 (CLAUDE.md §9, §11, §14)
 * - src: 프로젝트에 확보된 이미지 경로. 원본/라이선스 확인 전에는 비워 두고 placeholder를 표시한다.
 * - legacyUrl: 기존 사이트 이미지 경로 (기록용, 로드하지 않음)
 * - width/height: 원본 크기 (placeholder 비율 유지용)
 * - alt: 장식용 이미지는 빈 문자열('')
 * - license / aiGenerated: 확인 전까지 unknown
 */
export const imageSchema = z.object({
  src: z.string().min(1).optional(),
  legacyUrl: z.string().startsWith('/').optional(),
  /** 기존 WordPress media ID */
  legacyMediaId: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string(),
  license: z.enum(['unknown', 'confirmed']).default('unknown'),
  aiGenerated: z.enum(['unknown', 'yes', 'no']).default('unknown'),
  credit: z.string().optional(),
});

/** 목록 표시 순서. 지정되지 않은 항목은 뒤로 정렬된다. */
export const orderSchema = z.number().int().optional();

/** slug를 가진 콘텐츠의 공통 필드 */
export const entryFields = {
  slug: slugSchema,
  order: orderSchema,
  ...legacyFields,
  review: reviewSchema,
  seo: seoSchema,
};

export type Review = z.infer<typeof reviewSchema>;
export type Seo = z.infer<typeof seoSchema>;
export type ImageMeta = z.infer<typeof imageSchema>;
