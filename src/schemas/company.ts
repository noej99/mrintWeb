import { z } from 'astro/zod';
import { imageSchema, legacyFields, reviewSchema, seoSchema } from './common';

/**
 * Company (docs/requirements.md §5)
 * 필수: 회사 소개, 회사 이미지, 주소, 전화, 팩스, 이메일, 지도
 * History/Vision/Mission/CEO Greeting/Certifications는 고객 원문 제공 시에만 추가한다. (CLAUDE.md §4.2)
 */

/** 문단 배열. 문단 안의 원문 줄바꿈은 '\n'으로 보존한다. */
const paragraphsSchema = z.array(z.string().min(1)).min(1);

export const companySchema = z.object({
  name: z.object({
    ko: z.string().min(1),
    en: z.string().min(1).optional(),
  }),
  introduction: z
    .object({
      ko: paragraphsSchema,
      en: paragraphsSchema.optional(),
    })
    .optional(),
  images: z.array(imageSchema).default([]),
  address: z.object({
    ko: z.string().min(1),
    en: z.string().min(1).optional(),
  }),
  tel: z.string().min(1),
  fax: z.string().min(1),
  email: z.email(),
  /** 좌표 기록. API 연결 여부와 별개 (docs/decisions.md D-14) */
  map: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      zoom: z.number().int().min(1).max(21).optional(),
      provider: z.enum(['google', 'naver']),
    })
    .optional(),
  ...legacyFields,
  review: reviewSchema,
  seo: seoSchema,
});

export type CompanyData = z.infer<typeof companySchema>;
