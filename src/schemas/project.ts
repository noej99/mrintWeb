import { z } from 'astro/zod';
import { entryFields, imageSchema, isoDateSchema, slugSchema, termKeySchema } from './common';
import { newsBlockSchema } from './news';

/**
 * Project (docs/architecture.md §8, docs/requirements.md §8)
 * 원본: 기존 WordPress `post` + ACF (scratchpad 조사 결과, Phase 7)
 * - slug: `project-{legacyId}` (docs/decisions.md D-07)
 * - title: post title 원문 / name: ACF `businesss_name` 원문 (제목과 다를 수 있음)
 * - period/status/client/overview: 원문 그대로. 정규화·자동 수정하지 않는다. (CLAUDE.md §3)
 * - client: ACF `background` (기존 라벨 Client = 계약 상대방)
 * - type: #982는 원본에 없음 → optional
 * - description: ACF plain text를 News와 같은 블록 구조로 저장 (문단 안 원문 줄바꿈 보존, 문자 변경 없음)
 * - partner: partners collection id (최종 고객사, History 계산 기준)
 */
export const PROJECT_SLUG_PATTERN = /^project-\d+$/;

export const projectSchema = z.object({
  ...entryFields,
  slug: slugSchema.regex(PROJECT_SLUG_PATTERN, 'Project slug는 project-{legacyId} 형식이어야 합니다.'),
  title: z.string().min(1),
  name: z.string().min(1),
  /** 기존 게시일 (정렬 기준) */
  date: isoDateSchema,
  year: z.number().int(),
  type: termKeySchema.optional(),
  industry: termKeySchema,
  status: termKeySchema,
  period: z.string(),
  client: z.string(),
  overview: z.string(),
  description: z.array(newsBlockSchema).optional(),
  images: z.array(imageSchema).default([]),
  partner: z.string().min(1).optional(),
  relatedProjects: z.array(slugSchema).optional(),
});

export type ProjectData = z.infer<typeof projectSchema>;
