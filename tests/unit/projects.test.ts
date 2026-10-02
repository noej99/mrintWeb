import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_CARDS } from '../../src/data/home';
import { checkIntegrity } from '../../src/lib/integrity';
import {
  compareProjects,
  filtersToQuery,
  matchesFilters,
  parsePage,
  parseProjectFilters,
  projectHistory,
  sortProjects,
} from '../../src/lib/projects';
import {
  partnerSchema,
  projectSchema,
  taxonomyTermSchema,
  teamSchema,
  type PartnerData,
  type ProjectData,
  type TaxonomyTerm,
  type TeamData,
} from '../../src/schemas';

const DATA = join(process.cwd(), 'src/data');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const readDir = <T>(dir: string, parse: (value: unknown) => T) =>
  readdirSync(join(DATA, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => parse(readJson(join(DATA, dir, name))));

const projectData = readDir('projects', (value) => projectSchema.parse(value));
const projects = projectData.map((data) => ({ id: data.slug, data }));
const taxonomies = (readJson(join(DATA, 'taxonomies.json')) as (TaxonomyTerm & { id: string })[]).map((raw) => ({
  id: raw.id,
  data: taxonomyTermSchema.parse(raw),
}));
const partners = (readJson(join(DATA, 'partners.json')) as (PartnerData & { id: string })[]).map((raw) => ({
  id: raw.id,
  data: partnerSchema.parse(raw),
}));
const team = readDir('team', (value) => teamSchema.parse(value)).map((data) => ({ id: data.slug, data }));

const statusOrder = Object.fromEntries(
  taxonomies.filter((t) => t.data.group === 'status').map((t) => [t.data.key, t.data.order ?? 0]),
);
const sorted = sortProjects(projects, statusOrder);
const byId = (legacyId: number): ProjectData => {
  const found = projectData.find((p) => p.legacyId === legacyId);
  if (!found) throw new Error(`${legacyId} 없음`);
  return found;
};

/** 기존 사이트 /projects/ 1~3페이지에서 확인한 표시 순서 (Phase 7 Pre-Research) */
const LEGACY_ORDER = [
  1572, 1565, 1542, 1491, 1489, 1487, 1485, 1481, 1456, 1454, 1452, 1450, 1283, 1199, 1519, 1279, 1212, 1135, 1131,
  1080, 1044, 1001, 982, 1512, 1209, 1060, 1057, 406, 1270, 1257, 973, 1086, 1028, 1051, 992, 1537, 1483, 1479, 1477,
  1475, 1473, 1471, 1205, 1149, 1144, 1097, 1232, 1223, 1220, 1072, 1252, 1094, 1083, 1064, 1444, 1076, 1089,
];

describe('Projects 데이터 (기존 57건)', () => {
  it('57건, legacyId/slug 중복 없음, slug = project-{legacyId}', () => {
    expect(projectData).toHaveLength(57);
    expect(new Set(projectData.map((p) => p.legacyId)).size).toBe(57);
    expect(new Set(projectData.map((p) => p.slug)).size).toBe(57);
    for (const p of projectData) expect(p.slug).toBe(`project-${p.legacyId}`);
  });

  it('기존 사이트 목록 순서와 동일 (Status → Year → 게시일)', () => {
    expect(sorted.map((p) => p.data.legacyId)).toEqual(LEGACY_ORDER);
  });

  it('원문 보존: 1572 제목/Overview, title≠name 16건', () => {
    expect(byId(1572).title).toBe('농협은행 NEO 계정계 차세대 구축 / 외국환 개선');
    expect(byId(1572).overview).toBe('NEO 계정계 차세대 구축 / 외축환 개선');
    const diff = projectData.filter((p) => p.title !== p.name).map((p) => Number(p.legacyId)).sort((a, b) => a - b);
    expect(diff).toEqual([1064, 1072, 1076, 1080, 1097, 1131, 1135, 1144, 1149, 1199, 1212, 1223, 1232, 1257, 1279, 1542]);
  });

  it('Period 원문 그대로 (정규화하지 않음)', () => {
    expect(byId(1542).period).toBe('2026.01 ~ 26.12.31');
    expect(byId(1454).period).toBe('25.05 ~ 26.02');
    expect(byId(1028).period).toBe('2021 ~ 현재');
    expect(byId(1086).period).toBe('2021.07 ~ 진행 중');
    expect(byId(1283).period).toBe('2024.12');
  });

  it('982 Nike: type 없음 (임의 지정하지 않음)', () => {
    expect(byId(982).type).toBeUndefined();
    expect(projectData.filter((p) => p.type === undefined).map((p) => p.legacyId)).toEqual([982]);
  });

  it('description: 22건, 원문 기호 유지 (>, 1., ■, 영문 번역)', () => {
    expect(projectData.filter((p) => p.description).length).toBe(22);
    const text = (id: number) =>
      (byId(id).description ?? []).map((block) => (block.type === 'paragraph' ? block.text : block.items.join('\n'))).join('\n');
    expect(text(406)).toContain('> 사내 인력 관리 및 공급을 담당하는 HR전담 팀');
    expect(text(406)).toContain('1. 전략적 파트너를 통해');
    expect(text(406)).toContain('Heungkuk Life Insurance application maintenance');
    expect(text(982)).toContain('■소매 기술지원■');
    for (const p of projectData) for (const block of p.description ?? []) expect(block.type).toBe('paragraph');
  });

  it('이미지: gallery 메타만 보존 (src 없음, alt 빈 값), 2장 = 406/982/1001', () => {
    expect(projectData.filter((p) => p.images.length === 2).map((p) => Number(p.legacyId)).sort((a, b) => a - b)).toEqual([406, 982, 1001]);
    for (const image of projectData.flatMap((p) => p.images)) {
      expect(image.src).toBeUndefined();
      expect(image.alt).toBe('');
      expect(image.legacyMediaId).toBeTypeOf('number');
      expect(image.width).toBeGreaterThan(0);
    }
  });

  it('review: Status/Period 불일치 12건, 원청사 Client 6건 기록', () => {
    const noted = (field: string) =>
      projectData.filter((p) => p.review.notes.some((n) => n.field === field)).map((p) => Number(p.legacyId)).sort((a, b) => a - b);
    expect(noted('status')).toEqual([1001, 1199, 1212, 1450, 1452, 1454, 1456, 1481, 1485, 1487, 1489, 1491]);
    expect(noted('client')).toEqual([973, 982, 1060, 1064, 1080, 1205]);
    expect(noted('partner')).toEqual([1252, 1279]);
    expect(noted('year')).toEqual(expect.arrayContaining([406, 1044, 1283]));
  });
});

describe('taxonomy / partner / 참조 무결성', () => {
  it('taxonomy 27 terms (type 5, industry 9, status 2, year 11), 기존 count 보존', () => {
    const count = (group: string) => taxonomies.filter((t) => t.data.group === group).length;
    expect([count('type'), count('industry'), count('status'), count('year')]).toEqual([5, 9, 2, 11]);
    expect(taxonomies.find((t) => t.data.label === '증권')?.data.legacySlug).toBe('증권권');
    expect(taxonomies.filter((t) => t.data.count === 0).map((t) => t.data.key).sort()).toEqual(['2017', '2019']);
  });

  it('기존 term count = 실제 프로젝트 수', () => {
    for (const term of taxonomies) {
      const value = (p: ProjectData) => (term.data.group === 'year' ? String(p.year) : p[term.data.group]);
      expect(projectData.filter((p) => value(p) === term.data.key).length, term.id).toBe(term.data.count);
    }
  });

  it('checkIntegrity: 문제 없음 (taxonomy/partner/team 참조)', () => {
    // Partner businessLines 역참조 검사는 business 데이터와 함께 tests/unit/business.test.ts에서 수행
    const issues = checkIntegrity({ projects, team, business: [], partners, taxonomies });
    expect(issues.filter((issue) => issue.field !== 'businessLines')).toEqual([]);
  });

  it('모든 프로젝트의 partner가 partners에 존재, 프로젝트에 연결된 partner는 29건 (전체 67건, Phase 8)', () => {
    const ids = new Set(partners.map((p) => p.id));
    for (const p of projectData) expect(ids.has(p.partner ?? '')).toBe(true);
    expect(new Set(projectData.map((p) => p.partner)).size).toBe(29);
    expect(partners).toHaveLength(67);
  });

  it('Team relatedProjects: 실제 Project slug, relatedProjectsLegacy와 같은 순서/기존 URL', () => {
    const bySlug = new Map(projectData.map((p) => [p.slug, p]));
    let total = 0;
    for (const { data } of team as { data: TeamData }[]) {
      expect(data.relatedProjects?.length ?? 0).toBe(data.relatedProjectsLegacy.length);
      data.relatedProjectsLegacy.forEach((legacy, index) => {
        const project = bySlug.get(data.relatedProjects?.[index] ?? '');
        expect(project?.legacyUrl, `${data.slug} ${legacy.title}`).toBe(legacy.legacyUrl);
        total++;
      });
    }
    expect(total).toBe(46);
  });

  it('Home 카드 3 → project-973, 카드 4 → project-406', () => {
    expect(HOME_CARDS[2]?.href).toBe('/projects/project-973');
    expect(HOME_CARDS[3]?.href).toBe('/projects/project-406');
    expect(HOME_CARDS.map((card) => card.linkTarget)).toEqual(['detail', 'detail', 'detail', 'detail']);
  });
});

describe('History (같은 partner, 자기 자신 포함)', () => {
  const entry = (id: number) => sorted.find((p) => p.data.legacyId === id)!;

  it('모든 프로젝트의 History에 자기 자신이 포함되고, 같은 partner만 포함', () => {
    for (const project of sorted) {
      const history = projectHistory(sorted, project);
      expect(history).toContain(project);
      for (const item of history) expect(item.data.partner).toBe(project.data.partner);
    }
  });

  it('기존 사이트와 같은 결과: SC제일은행 17건, 973(IBK 시스템) 3건, 406 자기 자신 1건', () => {
    expect(projectHistory(sorted, entry(1491))).toHaveLength(17);
    expect(projectHistory(sorted, entry(973)).map((p) => p.data.legacyId)).toEqual([1270, 973, 1252]);
    expect(projectHistory(sorted, entry(406)).map((p) => p.data.legacyId)).toEqual([406]);
  });
});

describe('필터/페이지 유틸', () => {
  it('parseProjectFilters: 허용된 값만', () => {
    const params = new URLSearchParams('_type=si&_industry=9&_status=completed&_year=2025&_x=1&_type2=ito');
    expect(parseProjectFilters(params, { type: ['si'], industry: ['9'], status: ['completed'], year: ['2025'] })).toEqual({
      type: 'si',
      industry: '9',
      status: 'completed',
      year: '2025',
    });
    expect(parseProjectFilters(new URLSearchParams('_type=unknown'), { type: ['si'] })).toEqual({});
  });

  it('matchesFilters / filtersToQuery', () => {
    const facets = { type: 'si', industry: '9', status: 'completed', year: '2025' };
    expect(matchesFilters(facets, {})).toBe(true);
    expect(matchesFilters(facets, { type: 'si', year: '2025' })).toBe(true);
    expect(matchesFilters(facets, { type: 'ito' })).toBe(false);
    expect(matchesFilters({ ...facets, type: undefined }, { type: 'si' })).toBe(false);
    expect(filtersToQuery({ type: 'si', year: '2025' })).toEqual({ _type: 'si', _year: '2025' });
  });

  it('parsePage: 범위 보정', () => {
    expect(parsePage(new URLSearchParams(''), 3)).toBe(1);
    expect(parsePage(new URLSearchParams('_paged=3'), 3)).toBe(3);
    expect(parsePage(new URLSearchParams('_paged=9'), 3)).toBe(3);
    expect(parsePage(new URLSearchParams('_paged=-1'), 3)).toBe(1);
  });

  it('compareProjects: Status → Year → 게시일 → legacyId', () => {
    const order = { proceeding: 0, completed: 1 };
    const a = { status: 'completed', year: 2026, date: '2026-01-01', legacyId: 1 };
    const b = { status: 'proceeding', year: 2016, date: '2016-01-01', legacyId: 2 };
    expect(compareProjects(a, b, order)).toBeGreaterThan(0);
    expect(compareProjects({ ...b, year: 2020 }, { ...b, year: 2021 }, order)).toBeGreaterThan(0);
    expect(compareProjects({ ...b, legacyId: 10 }, { ...b, legacyId: 11 }, order)).toBeGreaterThan(0);
  });

  it('페이지 분할: 20 / 20 / 17', () => {
    const pages = [0, 1, 2].map((i) => sorted.slice(i * 20, i * 20 + 20).length);
    expect(pages).toEqual([20, 20, 17]);
  });
});
