import { z } from 'astro/zod';
import { entryFields, imageSchema, isoDateSchema } from './common';

/**
 * News & Notices (docs/architecture.md §9, docs/requirements.md §7)
 * 원본: 기존 WordPress ACF `description`(plain text) / `gallery`(media 배열)
 * - category/excerpt/author는 기존 데이터에 없으므로 두지 않는다.
 * - body: 빈 줄 기준 문단. 문단 안의 원문 줄바꿈은 '\n'으로 보존한다.
 *   '- '로 시작하는 2줄 이상 연속 줄만 list로 변환한다. (텍스트는 변경하지 않음)
 * - rights: 외부 기사 재사용 권리 (docs/requirements.md §15). unknown이면 본문을 표시하지 않는다.
 */
export const newsBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string().min(1) }),
  z.object({ type: z.literal('list'), items: z.array(z.string().min(1)).min(2) }),
]);

export const newsSchema = z.object({
  ...entryFields,
  title: z.string().min(1),
  /** 기존 게시일 (= 기존 목록 표시 날짜) */
  date: isoDateSchema,
  body: z.array(newsBlockSchema).min(1),
  images: z.array(imageSchema).default([]),
  /** 본문에 명시된 출처 (원문 표기 그대로) */
  source: z
    .object({
      label: z.string().min(1),
      name: z.string().min(1),
      url: z.url().optional(),
    })
    .optional(),
  rights: z
    .object({
      status: z.enum(['unknown', 'confirmed', 'restricted']),
      note: z.string().optional(),
    })
    .optional(),
});

export type NewsBlock = z.infer<typeof newsBlockSchema>;
export type NewsData = z.infer<typeof newsSchema>;
