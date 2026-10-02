import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_CARDS } from '../../src/data/home';
import { groupBusinessSections, imageRatio, partnerUsage, toParagraphs } from '../../src/lib/business';
import { findDuplicates } from '../../src/lib/collections';
import { checkIntegrity } from '../../src/lib/integrity';
import { resolvePageSeo } from '../../src/lib/seo';
import {
  businessSchema,
  partnerSchema,
  projectSchema,
  teamSchema,
  taxonomyTermSchema,
  type BusinessData,
  type PartnerData,
  type TaxonomyTerm,
} from '../../src/schemas';

const DATA = join(process.cwd(), 'src/data');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const readDir = <T>(dir: string, parse: (value: unknown) => T) =>
  readdirSync(join(DATA, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => parse(readJson(join(DATA, dir, name))));

const businessData = readDir('business', (value) => businessSchema.parse(value)).sort(
  (a, b) => (a.order ?? 0) - (b.order ?? 0),
);
const business = businessData.map((data) => ({ id: data.slug, data }));
const partnersRaw = readJson(join(DATA, 'partners.json')) as (PartnerData & { id: string })[];
const partners = partnersRaw.map((raw) => ({ id: raw.id, data: partnerSchema.parse(raw) }));
const projects = readDir('projects', (value) => projectSchema.parse(value)).map((data) => ({ id: data.slug, data }));
const team = readDir('team', (value) => teamSchema.parse(value)).map((data) => ({ id: data.slug, data }));
const taxonomies = (readJson(join(DATA, 'taxonomies.json')) as (TaxonomyTerm & { id: string })[]).map((raw) => ({
  id: raw.id,
  data: taxonomyTermSchema.parse(raw),
}));

const line = (legacyId: number): BusinessData => {
  const found = businessData.find((data) => data.legacyId === legacyId);
  if (!found) throw new Error(`${legacyId} 없음`);
  return found;
};
const partner = (legacyId: number) => {
  const found = partners.find((entry) => entry.data.legacyId === legacyId);
  if (!found) throw new Error(`partner ${legacyId} 없음`);
  return found;
};
const descriptions = (data: BusinessData) =>
  data.contents.flatMap((block) =>
    block.type === 'description'
      ? [block.description]
      : block.type === 'tabs'
        ? block.tabs.map((tab) => tab.description)
        : [],
  );

/** 기존 사이트 Phase 8 Pre-Research 기준값 (REST business_line ACF) */
const LEGACY = [
  {
    legacyId: 271,
    slug: 'it-outsourcing',
    title: 'IT OUTSOURCING',
    legacyUrl: '/business_line/application-outsourcing/',
    blocks: ['title', 'description', 'image', 'title', 'description', 'title', 'image', 'description', 'title', 'tabs'],
    sections: ['Service Summary', '어플리케이션운영 서비스', 'Mirae I&Tec Application Outsourcing Framework', 'Service Features'],
    tabs: ['프로젝트 수행 경험', '분야별 전문 인력 보유', '고객 중심 맞춤 서비스'],
    clients: [698, 472, 509, 396, 518, 516, 400, 728, 670, 754, 490, 464, 460, 456, 837, 422, 662],
  },
  {
    legacyId: 278,
    slug: 'system-integration',
    title: 'SYSTEM INTEGRATION',
    legacyUrl: '/business_line/si/',
    blocks: ['title', 'description', 'image'],
    sections: ['Service Summary'],
    tabs: [],
    clients: [474, 518, 456, 679, 717, 713, 498, 728, 707, 657, 545, 674, 266],
  },
  {
    legacyId: 279,
    slug: 'infrastructure',
    title: 'INFRASTRUCTURE',
    legacyUrl: '/business_line/infra/',
    blocks: ['title', 'description', 'image', 'title', 'tabs'],
    sections: ['Service Summary', 'Service Features'],
    tabs: ['IT 인프라 구축', 'IT 인프라 운영관리', 'Cloud'],
    clients: [807, 1375],
  },
  {
    legacyId: 280,
    slug: 'solution',
    title: 'SOLUTION',
    legacyUrl: '/business_line/managed-service/',
    blocks: ['title', 'description', 'image', 'title', 'tabs'],
    sections: ['Service Summary', 'Service features'],
    tabs: ['CubeOne™ Plug-In', 'CubeOne™ API', 'CubeOne™ SAP'],
    clients: [1284],
  },
] as const;

const UNLINKED = [
  28, 420, 443, 446, 448, 450, 454, 458, 462, 466, 468, 479, 481, 483, 486, 494, 496, 501, 506, 512, 514, 575, 651,
  858, 892, 1030, 1130,
];

describe('Business Line 데이터 (기존 4건)', () => {
  it('4건, 기존 목록 순서, slug/legacyId 중복 없음', () => {
    expect(businessData.map((data) => data.legacyId)).toEqual([271, 278, 279, 280]);
    expect(findDuplicates(businessData.map((data) => data.slug))).toEqual([]);
    expect(findDuplicates(businessData.map((data) => String(data.legacyId)))).toEqual([]);
  });

  it.each(LEGACY)('$legacyId $title: URL/title/legacyUrl/게시일', (legacy) => {
    const data = line(legacy.legacyId);
    expect(data.slug).toBe(legacy.slug);
    expect(data.title).toBe(legacy.title);
    expect(data.legacyUrl).toBe(legacy.legacyUrl);
    expect(data.date).toBe('2024-02-23');
  });

  it.each(LEGACY)('$legacyId: 블록 구조와 순서 (ACF contents 1:1)', (legacy) => {
    expect(line(legacy.legacyId).contents.map((block) => block.type)).toEqual(legacy.blocks);
  });

  it.each(LEGACY)('$legacyId: 섹션 수/순서/제목 원문', (legacy) => {
    const sections = groupBusinessSections(line(legacy.legacyId).contents);
    expect(sections.map((section) => section.title)).toEqual(legacy.sections);
    expect(sections.map((section) => section.id)).toEqual(legacy.sections.map((_, index) => `section-${index + 1}`));
  });

  it.each(LEGACY)('$legacyId: Service Features 탭 제목/순서', (legacy) => {
    const tabs = line(legacy.legacyId).contents.flatMap((block) => (block.type === 'tabs' ? block.tabs : []));
    expect(tabs.map((tab) => tab.title)).toEqual(legacy.tabs);
    for (const tab of tabs) expect(tab.description.length).toBeGreaterThan(0);
  });

  it.each(LEGACY)('$legacyId: Main Clients 수/순서 (ACF partners)', (legacy) => {
    expect(line(legacy.legacyId).clients).toEqual(legacy.clients.map((id) => `partner-${id}`));
  });

  it('summary 원문 (기존 목록 description-summary)', () => {
    expect(businessData.map((data) => data.summary)).toEqual([
      '안정적이고 효율적인 IT 운영 서비스를 제공합니다.',
      '고객에게 최적화된 정보 시스템과 전문적이고 효율적인 IT 솔루션을 제공합니다.',
      '고객이 필요로 하는 최적의 IT 인프라 서비스를 제공합니다.',
      '고객이 필요로 하는 사업관리 및 운영 전반을 통합한 전문적인 서비스를 제공합니다.',
    ]);
  });

  it('원문 줄바꿈(\\r\\n)·기호를 정리하지 않고 보존한다', () => {
    const text = descriptions(line(271));
    expect(text[0]).toContain('과정입니다. \r\n\r\n');
    expect(text[1]).toContain('•\t어플리케이션 유지보수\r\n 어플리케이션에 대한');
  });

  it('고객 확인 대상 문구를 수정하지 않고 review에 기록한다', () => {
    const checks: [number, string][] = [
      [271, '지난 21년 간'],
      [271, '20년 이상'],
      [279, 'GDPR, HIPAA'],
      [280, '타 제품 대비 2~3배 성능'],
      [280, '경쟁제품 대비 약 50% 이상 빠름'],
    ];
    for (const [legacyId, phrase] of checks) {
      const data = line(legacyId);
      expect(descriptions(data).some((text) => text.includes(phrase)), `${legacyId} ${phrase}`).toBe(true);
      expect(data.review.status).toBe('needs-confirmation');
      expect(data.review.notes.some((note) => note.note.includes(phrase)), `${legacyId} note ${phrase}`).toBe(true);
    }
  });

  it('이미지: 로컬 asset 연결(Phase 9.5) + 메타데이터 (alt 빈 값, license confirmed(D-13), AI unknown, 원본 크기)', () => {
    const images = businessData.flatMap((data) => [
      ...(data.thumbnail ? [data.thumbnail] : []),
      ...data.contents.flatMap((block) =>
        block.type === 'image' ? [block.image] : block.type === 'tabs' ? block.tabs.flatMap((tab) => tab.image ?? []) : [],
      ),
    ]);
    expect(images).toHaveLength(18);
    for (const image of images) {
      expect(image.src).toMatch(new RegExp(`^media/${image.legacyMediaId}-`));
      expect(image.legacyUrl).toMatch(/^\/wp-content\/uploads\//);
      expect(image.legacyMediaId).toBeGreaterThan(0);
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
      expect(image.alt).toBe('');
      expect(image.license).toBe('confirmed');
      expect(image.aiGenerated).toBe('unknown');
    }
    expect(line(271).thumbnail).toMatchObject({ legacyMediaId: 283, width: 1688, height: 301 });
  });

  it('SEO는 승인 전 draft (임의 문구 없음)', () => {
    for (const data of businessData) expect(data.seo).toEqual({ status: 'draft' });
  });

  it('Business Line ↔ Project 관계 필드가 없다', () => {
    for (const data of businessData) expect(Object.keys(data)).not.toContain('relatedProjects');
  });
});

describe('Partner 데이터 (기존 67건)', () => {
  it('67건, legacyId/id 중복 없음, id = partner-{legacyId}', () => {
    expect(partners).toHaveLength(67);
    expect(findDuplicates(partners.map((entry) => entry.id))).toEqual([]);
    expect(findDuplicates(partners.map((entry) => String(entry.data.legacyId)))).toEqual([]);
    for (const entry of partners) expect(entry.id).toBe(`partner-${entry.data.legacyId}`);
  });

  it('이름이 같은 항목을 병합하지 않고 각각 보존한다 (400/486, 728/1375)', () => {
    for (const [a, b] of [
      [400, 486],
      [728, 1375],
    ] as const) {
      expect(partner(a).data.name).toBe(partner(b).data.name);
      for (const [self, other] of [
        [a, b],
        [b, a],
      ] as const) {
        expect(partner(self).data.review.notes.some((note) => note.note.includes(`partner-${other}`))).toBe(true);
      }
    }
    expect(partner(400).data.name).toBe('애큐온캐피탈');
    expect(partner(728).data.name).toBe('한국투자캐피탈');
  });

  it('-2 slug를 원문대로 보존한다', () => {
    const suffixed = partners.filter((entry) => entry.data.legacySlug?.endsWith('-2')).map((entry) => entry.data.legacyId);
    expect(suffixed).toEqual([472, 486, 518, 1375]);
    expect(partner(486).data.legacyUrl).toBe('/partners/애큐온캐피탈-2/');
    for (const entry of partners) expect(entry.data.legacyUrl).toBe(`/partners/${entry.data.legacySlug}/`);
  });

  it('로고: partners/ asset 연결(Phase 9.5), 권리 확인(D-13), 화면은 이름 텍스트 유지 (65건, 미등록 1030/1130)', () => {
    expect(partners.filter((entry) => !entry.data.logo).map((entry) => entry.data.legacyId)).toEqual([1030, 1130]);
    for (const entry of partners) {
      if (entry.data.logo) {
        expect(entry.data.logo.src).toMatch(new RegExp(`^partners/${entry.data.logo.legacyMediaId}-`));
        expect(entry.data.logo.license).toBe('confirmed');
        expect(entry.data.logoPermission).toBe('granted');
      } else {
        // 로고가 없는 Partner는 확인 대상 로고가 없으므로 기록값 유지
        expect(entry.data.logoPermission).toBe('unknown');
      }
    }
  });

  it('표시 대상 40건 / 미연결 27건 (데이터 보존)', () => {
    const usage = partnerUsage(partners, business, projects);
    expect(usage.displayed.size).toBe(40);
    expect(usage.unlinked).toEqual(UNLINKED.map((id) => `partner-${id}`));
    for (const id of UNLINKED) {
      expect(partner(id).data.review.notes.some((note) => note.field === 'usage')).toBe(true);
    }
  });

  it('businessLines는 Business clients 역참조와 일치한다', () => {
    for (const entry of partners) {
      const expected = businessData.filter((data) => data.clients.includes(entry.id)).map((data) => data.slug);
      expect(entry.data.businessLines, entry.id).toEqual(expected);
    }
    expect(partner(728).data.businessLines).toEqual(['it-outsourcing', 'system-integration']);
  });

  it('Project ↔ Partner 관계(Phase 7)는 그대로 29건 partner를 참조한다', () => {
    const projectPartners = new Set(projects.flatMap((project) => project.data.partner ?? []));
    expect(projectPartners.size).toBe(29);
    for (const id of projectPartners) expect(partners.some((entry) => entry.id === id)).toBe(true);
  });
});

describe('collection 간 참조 무결성 (실제 데이터)', () => {
  it('문제가 없다', () => {
    expect(checkIntegrity({ projects, team, business, partners, taxonomies })).toEqual([]);
  });
});

describe('Home 카드 1/2 → Business Line 상세', () => {
  it.each([
    [0, 271],
    [1, 278],
  ] as const)('카드 %i → legacyId %i', (index, legacyId) => {
    const card = HOME_CARDS[index];
    const data = line(legacyId);
    expect(card?.href).toBe(`/business/${data.slug}`);
    expect(card?.legacyUrl).toBe(data.legacyUrl);
    expect(card?.title).toBe(data.title);
  });
});

describe('groupBusinessSections', () => {
  it('title 블록 기준으로 나누고 블록 순서를 유지한다', () => {
    const sections = groupBusinessSections([
      { type: 'description', description: 'A' },
      { type: 'title', title: 'T1' },
      { type: 'image', image: { alt: '', license: 'unknown', aiGenerated: 'unknown' } },
      { type: 'description', description: 'B' },
      { type: 'title', title: 'T2' },
    ]);
    expect(sections.map((section) => [section.id, section.title, section.blocks.map((block) => block.type)])).toEqual([
      ['section-1', undefined, ['description']],
      ['section-2', 'T1', ['image', 'description']],
      ['section-3', 'T2', []],
    ]);
  });
});

describe('toParagraphs', () => {
  it('빈 줄은 문단, 줄바꿈은 줄로 나누고 공백만 있는 줄은 제외한다', () => {
    expect(toParagraphs('A \r\n\r\nB\r\n C\t\r\n \r\nD\r\n')).toEqual([['A '], ['B', ' C\t'], ['D']]);
  });

  it('줄 안의 기호/탭은 그대로 둔다', () => {
    expect(toParagraphs('•\t항목\r\n 설명')).toEqual([['•\t항목', ' 설명']]);
  });
});

describe('imageRatio', () => {
  it('원본 크기 비율, 없으면 fallback', () => {
    expect(imageRatio({ width: 1536, height: 1024 }, 1)).toBe(1.5);
    expect(imageRatio({}, 1)).toBe(1);
    expect(imageRatio(undefined, 2)).toBe(2);
  });
});

describe('resolvePageSeo', () => {
  it('approved 전에는 fallback title만 사용하고 description을 출력하지 않는다', () => {
    expect(resolvePageSeo({ status: 'draft', title: 'X', description: 'Y' }, 'Fallback')).toEqual({ title: 'Fallback' });
    expect(resolvePageSeo(undefined, 'Fallback')).toEqual({ title: 'Fallback' });
  });

  it('approved이면 데이터 값을 사용한다', () => {
    expect(resolvePageSeo({ status: 'approved', title: 'X', description: 'Y' }, 'Fallback')).toEqual({
      title: 'X',
      description: 'Y',
    });
    expect(resolvePageSeo({ status: 'approved' }, 'Fallback')).toEqual({ title: 'Fallback' });
  });
});
