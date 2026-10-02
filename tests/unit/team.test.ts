import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sortByOrder } from '../../src/lib/collections';
import { teamSchema, type TeamData } from '../../src/schemas';

const DIR = join(process.cwd(), 'src/data/team');
const members = sortByOrder(
  readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const data = teamSchema.parse(JSON.parse(readFileSync(join(DIR, name), 'utf8')));
      return { id: data.slug, data };
    }),
).map((entry) => entry.data);

const bySlug = (slug: string): TeamData => {
  const member = members.find((m) => m.slug === slug);
  if (!member) throw new Error(`${slug} 없음`);
  return member;
};

const allText = (m: TeamData) => [
  ...(m.introduction ?? []),
  ...(m.functions ?? []),
  ...(m.capabilities ?? []),
  ...(m.biography ?? []).flatMap((b) => [b.title, ...b.items]),
];

describe('Team 데이터 (기존 /team/)', () => {
  it('6건, 기존 사이트 표시 순서', () => {
    expect(members.map((m) => [m.slug, m.nameKo])).toEqual([
      ['ceo', '김학연'],
      ['ito-team', 'ITO 팀'],
      ['si-team', 'SI 팀'],
      ['infrastructure-team', '인프라 팀'],
      ['solution-team', '솔루션 팀'],
      ['future-technology-research-center', '미래기술연구소'],
    ]);
  });

  it('영문명/역할 원문', () => {
    expect(members.map((m) => m.nameEn)).toEqual([
      'Kim Hakyun',
      'IT Outsourcing Team',
      'System Integration Team',
      'Infrastructure Maintenance Team',
      'Solution Team',
      'Future Technology Research Center',
    ]);
    expect([bySlug('ceo').titleKo, bySlug('ceo').titleEn]).toEqual(['대표이사', 'CEO']);
    for (const m of members.filter((m) => m.kind === 'team')) expect(m.titleKo).toBeUndefined();
  });

  it('기존 URL / post ID 보존', () => {
    expect(members.map((m) => [m.legacyUrl, m.legacyId])).toEqual([
      ['/team/김학연/', 145],
      ['/team/ito-팀/', 1409],
      ['/team/si-team/', 1405],
      ['/team/인프라-팀/', 1413],
      ['/team/솔루션-팀/', 1411],
      ['/team/미래기술연구소/', 1415],
    ]);
  });

  it('Markdown 기호가 텍스트에 남아 있지 않다', () => {
    for (const m of members) {
      for (const text of allText(m)) {
        expect(text, `${m.slug}: ${text}`).not.toMatch(/^#|^- |<br|&amp;|&#\d+;/);
        expect(text).toBe(text.trim());
      }
    }
  });

  it('팀 섹션 항목 수 (기존 원문 기준)', () => {
    const counts = members
      .filter((m) => m.kind === 'team')
      .map((m) => [m.slug, m.introduction?.length, m.functions?.length, m.capabilities?.length]);
    expect(counts).toEqual([
      ['ito-team', 3, 4, 4],
      ['si-team', 1, 3, 5],
      ['infrastructure-team', 1, 5, 4],
      ['solution-team', 1, 4, 6],
      ['future-technology-research-center', 1, 4, 5],
    ]);
  });

  it('CEO 약력: 국문/영문 블록', () => {
    expect(bySlug('ceo').biography).toEqual([
      {
        lang: 'ko',
        title: '(주)미래아이엔텍 대표이사',
        items: ['Application Outsourcing 사업 총괄', 'End User Service 사업 총괄', 'Infra Business 사업 총괄'],
      },
      {
        lang: 'en',
        title: 'Mirae I&Tech CEO',
        items: [
          'Application Outsourcing Business Manager',
          'End User Service Business Manager',
          'Infra Business General Manager',
        ],
      },
    ]);
  });

  it('Related Projects 건수 (기존 전체 목록, 빈 항목 제외)', () => {
    expect(members.map((m) => [m.slug, m.relatedProjectsLegacy.length])).toEqual([
      ['ceo', 7],
      ['ito-team', 21],
      ['si-team', 12],
      ['infrastructure-team', 1],
      ['solution-team', 5],
      ['future-technology-research-center', 0],
    ]);
  });

  it('이미지: 원본 미확보(src 없음), alt 빈 값, 원본 비율 기록', () => {
    for (const m of members) {
      expect(m.image?.src).toBeUndefined();
      expect(m.image?.alt).toBe('');
      expect(m.image?.license).toBe('unknown');
      expect(m.image?.legacyUrl).toMatch(/^\/wp-content\/uploads\//);
    }
    expect([bySlug('ceo').image?.width, bySlug('ceo').image?.height]).toEqual([1024, 1024]);
    expect([bySlug('si-team').image?.width, bySlug('si-team').image?.height]).toEqual([683, 1024]);
  });

  it('고객 확인 필요 상태', () => {
    for (const m of members) expect(m.review.status).toBe('needs-confirmation');
  });
});
