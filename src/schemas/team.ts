import { z } from 'astro/zod';
import { entryFields, imageSchema, slugSchema } from './common';

/**
 * Team (docs/architecture.md §10, docs/requirements.md §6)
 * 기존 사이트 상세 본문은 Markdown 기호(`# 제목`, `- 항목`)가 그대로 노출되는 텍스트였다.
 * 신규에서는 기호를 구조로 변환해 저장한다. (텍스트 원문은 변경하지 않음)
 * - team: Team Introduction(introduction) / Main Functions(functions) / Key Capabilities(capabilities)
 * - person(CEO): 약력 블록(biography) — 기존 원문의 블록 제목 + 항목
 */
const relatedProjectLegacySchema = z.object({
  title: z.string().min(1),
  year: z.string().regex(/^\d{4}$/).optional(),
  /** 기존 프로젝트 URL (Projects 이관 후 신규 slug와 매핑) */
  legacyUrl: z.string().startsWith('/'),
});

export const teamSchema = z.object({
  ...entryFields,
  kind: z.enum(['person', 'team']),
  nameKo: z.string().min(1),
  nameEn: z.string().min(1),
  titleKo: z.string().optional(),
  titleEn: z.string().optional(),
  image: imageSchema.optional(),
  /** 문단 배열 */
  introduction: z.array(z.string().min(1)).optional(),
  functions: z.array(z.string().min(1)).optional(),
  capabilities: z.array(z.string().min(1)).optional(),
  biography: z
    .array(
      z.object({
        lang: z.enum(['ko', 'en']),
        title: z.string().min(1),
        items: z.array(z.string().min(1)),
      }),
    )
    .optional(),
  /** 신규 Project slug (Phase 7 이관 후) */
  relatedProjects: z.array(slugSchema).optional(),
  /** 기존 사이트의 Related Projects 원문 (순서 유지) */
  relatedProjectsLegacy: z.array(relatedProjectLegacySchema).default([]),
});

export type TeamData = z.infer<typeof teamSchema>;
export type RelatedProjectLegacy = z.infer<typeof relatedProjectLegacySchema>;
