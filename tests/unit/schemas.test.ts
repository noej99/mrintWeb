import { describe, expect, it } from 'vitest';
import {
  businessSchema,
  companySchema,
  imageSchema,
  newsSchema,
  projectSchema,
  reviewSchema,
  seoSchema,
  slugSchema,
  termKeySchema,
} from '../../src/schemas';

describe('slugSchema', () => {
  it.each(['company', 'it-outsourcing', 'ibk-bank-information-system-operation', '2026-nonghyup-bank'])(
    '허용: %s',
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(true);
    },
  );

  it.each([
    ['한글', '프로젝트'],
    ['대문자', 'IT-Outsourcing'],
    ['underscore', 'business_line'],
    ['trailing slash', 'company/'],
    ['연속 하이픈', 'it--outsourcing'],
    ['숫자만', '1572'],
    ['숫자-숫자', '2026-01'],
    ['빈 문자열', ''],
  ])('거부: %s', (_label, slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });
});

describe('termKeySchema', () => {
  it('연도 key(숫자)를 허용한다', () => {
    expect(termKeySchema.safeParse('2026').success).toBe(true);
  });

  it('한글 key를 거부한다', () => {
    expect(termKeySchema.safeParse('은행').success).toBe(false);
  });
});

describe('기본값', () => {
  it('review가 없으면 original 상태로 둔다', () => {
    expect(reviewSchema.parse(undefined)).toEqual({ status: 'original', notes: [] });
  });

  it('seo가 없으면 draft 상태로 둔다', () => {
    expect(seoSchema.parse(undefined)).toEqual({ status: 'draft' });
  });

  it('이미지 license/aiGenerated는 unknown이 기본값이다', () => {
    expect(imageSchema.parse({ src: '/x.webp', alt: '' })).toMatchObject({
      alt: '',
      license: 'unknown',
      aiGenerated: 'unknown',
    });
  });

  it('이미지 alt는 생략할 수 없다', () => {
    expect(imageSchema.safeParse({ src: '/x.webp' }).success).toBe(false);
  });
});

describe('projectSchema', () => {
  const base = {
    slug: 'project-1',
    title: 'FIXTURE',
    name: 'FIXTURE',
    date: '2000-01-01',
    year: 2000,
    type: 'si',
    industry: 'bank',
    status: 'ongoing',
    period: 'FIXTURE',
    client: 'FIXTURE',
    overview: 'FIXTURE',
  };

  it('필수 필드를 갖추면 통과한다', () => {
    expect(projectSchema.safeParse(base).success).toBe(true);
  });

  it('slug는 project-{legacyId} 형식만 허용한다', () => {
    expect(projectSchema.safeParse({ ...base, slug: 'fixture-project' }).success).toBe(false);
  });

  it('type은 선택 항목이다 (#982)', () => {
    const { type: _type, ...rest } = base;
    expect(projectSchema.safeParse(rest).success).toBe(true);
  });

  it.each(['title', 'name', 'date', 'year', 'industry', 'status', 'period', 'client', 'overview'])(
    '%s 누락 시 실패한다',
    (field) => {
      const { [field as keyof typeof base]: _omitted, ...rest } = base;
      expect(projectSchema.safeParse(rest).success).toBe(false);
    },
  );

  it('원문 텍스트를 변형하지 않는다', () => {
    const original = { ...base, title: '  FIXTURE  공백·오탈자 원문 유지  ' };
    expect(projectSchema.parse(original).title).toBe(original.title);
  });
});

describe('newsSchema', () => {
  it('날짜는 YYYY-MM-DD 형식만 허용한다', () => {
    const base = { slug: 'fixture-news', title: 'FIXTURE', body: [{ type: 'paragraph', text: 'FIXTURE' }] };
    expect(newsSchema.safeParse({ ...base, date: '2025-01-31' }).success).toBe(true);
    expect(newsSchema.safeParse({ ...base, date: '2025.01.31' }).success).toBe(false);
  });

  it('본문 블록이 없거나, 1줄짜리 list는 거부한다', () => {
    const base = { slug: 'fixture-news', title: 'FIXTURE', date: '2025-01-31' };
    expect(newsSchema.safeParse({ ...base, body: [] }).success).toBe(false);
    expect(newsSchema.safeParse({ ...base, body: [{ type: 'list', items: ['FIXTURE'] }] }).success).toBe(false);
  });
});

describe('businessSchema', () => {
  const base = {
    title: 'FIXTURE',
    date: '2000-01-01',
    summary: 'FIXTURE',
    contents: [{ type: 'title', title: 'FIXTURE' }],
  };

  it.each(['it-outsourcing', 'system-integration', 'infrastructure', 'solution'])('허용 slug: %s', (slug) => {
    expect(businessSchema.safeParse({ ...base, slug }).success).toBe(true);
  });

  it.each(['application-outsourcing', 'si', 'infra', 'managed-service'])('기존 slug 거부: %s', (slug) => {
    expect(businessSchema.safeParse({ ...base, slug }).success).toBe(false);
  });

  it('기존 ACF layout 4종(title/description/image/tabs)을 허용한다', () => {
    const image = { alt: '' };
    const result = businessSchema.safeParse({
      ...base,
      slug: 'solution',
      contents: [
        { type: 'title', title: 'FIXTURE' },
        { type: 'description', description: 'FIXTURE\r\n\r\nFIXTURE' },
        { type: 'image', image },
        { type: 'tabs', tabs: [{ title: 'FIXTURE', image, description: 'FIXTURE' }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('정의되지 않은 block type, 빈 contents, 빈 tabs를 거부한다', () => {
    expect(businessSchema.safeParse({ ...base, slug: 'solution', contents: [{ type: 'unknown' }] }).success).toBe(false);
    expect(businessSchema.safeParse({ ...base, slug: 'solution', contents: [] }).success).toBe(false);
    expect(businessSchema.safeParse({ ...base, slug: 'solution', contents: [{ type: 'tabs', tabs: [] }] }).success).toBe(
      false,
    );
  });
});

describe('companySchema', () => {
  const base = {
    name: { ko: 'FIXTURE' },
    address: { ko: 'FIXTURE' },
    tel: 'FIXTURE',
    fax: 'FIXTURE',
    email: 'fixture@example.com',
  };

  it('필수 필드를 갖추면 통과한다', () => {
    expect(companySchema.safeParse(base).success).toBe(true);
  });

  it('잘못된 이메일을 거부한다', () => {
    expect(companySchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });
});
