import type { BusinessBlock, BusinessData, PartnerData, ProjectData } from '../schemas';
import type { Entry } from './collections';

/** 섹션에 포함되는 본문 블록 (title 블록은 섹션 제목이 된다) */
export type BusinessContentBlock = Exclude<BusinessBlock, { type: 'title' }>;

export interface BusinessSection {
  /** heading id (aria-labelledby) */
  id: string;
  /** 원문 title 블록. 첫 title 블록 이전의 블록은 제목 없는 섹션이 된다. */
  title?: string;
  blocks: BusinessContentBlock[];
}

/**
 * 원문 블록 순서를 유지한 채 title 블록 기준으로 섹션을 나눈다. (블록을 추가/삭제/재정렬하지 않는다)
 * 기존 사이트의 title_layout(h3)은 신규에서 섹션 제목(h2)으로 표시한다.
 */
export function groupBusinessSections(contents: readonly BusinessBlock[]): BusinessSection[] {
  const sections: BusinessSection[] = [];
  for (const block of contents) {
    if (block.type === 'title') {
      sections.push({ id: `section-${sections.length + 1}`, title: block.title, blocks: [] });
      continue;
    }
    let current = sections.at(-1);
    if (!current) {
      current = { id: `section-${sections.length + 1}`, blocks: [] };
      sections.push(current);
    }
    current.blocks.push(block);
  }
  return sections;
}

/**
 * 원문 description 문자열 → 문단(빈 줄 기준) → 줄 목록. 표시용 분리이며 원문 데이터는 바꾸지 않는다.
 * 공백만 있는 줄/문단은 표시하지 않는다. 줄 안의 공백/탭/기호는 그대로 둔다.
 */
export function toParagraphs(text: string): string[][] {
  return text
    .split(/\r?\n[ \t]*\r?\n/)
    .map((paragraph) => paragraph.split(/\r?\n/).filter((line) => line.trim() !== ''))
    .filter((lines) => lines.length > 0);
}

/** 이미지 원본 비율 (placeholder 비율 유지용) */
export function imageRatio(image: { width?: number; height?: number } | undefined, fallback: number): number {
  return image?.width && image.height ? image.width / image.height : fallback;
}

export interface PartnerUsage {
  /** Business Line clients 또는 Project partner로 참조되는 Partner id (화면 표시 대상) */
  displayed: Set<string>;
  /** 어디에도 참조되지 않는 Partner id (데이터로만 보존) */
  unlinked: string[];
}

/** Partner 표시 대상 계산 — 데이터(67건 전체)와 표시 대상을 분리한다. */
export function partnerUsage(
  partners: readonly Entry<PartnerData>[],
  business: readonly Entry<BusinessData>[],
  projects: readonly Entry<ProjectData>[],
): PartnerUsage {
  const displayed = new Set<string>([
    ...business.flatMap((line) => line.data.clients),
    ...projects.flatMap((project) => (project.data.partner ? [project.data.partner] : [])),
  ]);
  return {
    displayed,
    unlinked: partners.filter((partner) => !displayed.has(partner.id)).map((partner) => partner.id),
  };
}
