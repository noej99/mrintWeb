import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sortByDateDesc } from '../../src/lib/collections';
import { formatDotDate } from '../../src/lib/date';
import { newsSchema, type NewsData } from '../../src/schemas';

const DIR = join(process.cwd(), 'src/data/news');
const items: NewsData[] = sortByDateDesc(
  readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const data = newsSchema.parse(JSON.parse(readFileSync(join(DIR, name), 'utf8')));
      return { id: data.slug, data };
    }),
).map((entry) => entry.data);

const byId = (id: number) => {
  const item = items.find((news) => news.legacyId === id);
  if (!item) throw new Error(`${id} 없음`);
  return item;
};

describe('News 데이터 (기존 /newsnotices/)', () => {
  it('8건, 기존 목록과 같은 게시일 최신순', () => {
    expect(items.map((news) => [news.legacyId, formatDotDate(news.date)])).toEqual([
      [1583, '2026.03.31'],
      [1563, '2026.02.11'],
      [1528, '2025.12.02'],
      [1429, '2025.07.09'],
      [1266, '2024.12.18'],
      [1126, '2024.08.08'],
      [812, '2024.04.05'],
      [908, '2023.07.07'],
    ]);
  });

  it('제목 원문 (HTML entity 디코딩)', () => {
    expect(byId(1583).title).toBe('미래아이엔텍, 김학연 신임 대표이사 선임… “금융 IT 혁신 이끄는 제2의 도약 선언”');
    expect(byId(908).title).toBe('미래아이엔텍, ‘흥국생명 IT 어플리케이션 유지보수 사업’ 수주');
    expect(byId(1429).title).toBe('㈜미래아이엔텍, DB암호화 솔루션 전문업체 ‘이글로벌시스템’과 전략적 파트너십 체결');
    for (const news of items) expect(news.title).not.toMatch(/&#\d+;|&amp;/);
  });

  it('임시 slug news-{post ID}, 기존 URL 보존', () => {
    for (const news of items) {
      expect(news.slug).toBe(`news-${news.legacyId}`);
      expect(news.legacyUrl).toMatch(/^\/news_notices\/.+\/$/);
    }
    expect(byId(812).legacyUrl).toBe('/news_notices/홈페이지-리뉴얼-오픈/');
  });

  it('본문 블록 수 (원문 문단 기준)', () => {
    expect(items.map((news) => [news.legacyId, news.body.length])).toEqual([
      [1583, 7],
      [1563, 7],
      [1528, 10],
      [1429, 8],
      [1266, 3],
      [1126, 8],
      [812, 1],
      [908, 8],
    ]);
  });

  it("목록 변환은 '- ' 2줄 이상 연속(1583)만, 1563의 한 줄은 원문 문단 유지", () => {
    expect(byId(1583).body[0]).toEqual({
      type: 'list',
      items: [
        '10년간 핵심 프로젝트 이끈 현장형 IT 전문가… 4월 1일 공식 취임',
        '흥국화재·한국투자저축은행 수주 등 금융권 통합 ITO 입지 공고화 주도',
        '"기존 금융 IT 역량 고도화 및 혁신적 가치 제공하는 신뢰의 파트너 될 것"',
      ],
    });
    const first = byId(1563).body[0];
    expect(first?.type).toBe('paragraph');
    expect(first && first.type === 'paragraph' ? first.text : '').toMatch(/^- 흥국생명에 이어/);
  });

  it('문단 안 원문 줄바꿈 보존 (1266)', () => {
    const second = byId(1266).body[1];
    expect(second?.type === 'paragraph' ? second.text.split('\n') : []).toHaveLength(3);
  });

  it("보류 항목: 1429 '**CubeOne™**' 원문 유지", () => {
    const text = byId(1429).body.map((block) => (block.type === 'paragraph' ? block.text : '')).join('\n');
    expect(text).toContain('**CubeOne™**');
  });

  it('외부 기사(908): 출처 원문 표기, 권리 unknown', () => {
    const news = byId(908);
    expect(news.source).toEqual({
      label: '출처 : 아이티비즈(http://www.it-b.co.kr)',
      name: '아이티비즈',
      url: 'http://www.it-b.co.kr',
    });
    expect(news.rights?.status).toBe('unknown');
    for (const other of items.filter((item) => item.legacyId !== 908)) expect(other.rights).toBeUndefined();
  });

  it('이미지: gallery 원본 크기, 로컬 asset 연결(Phase 9.5), alt 빈 값, 권리 기록 유지', () => {
    expect(items.map((news) => [news.legacyId, news.images.map((image) => `${image.width}x${image.height}`)])).toEqual([
      [1583, []],
      [1563, ['1280x853']],
      [1528, ['1280x720']],
      [1429, ['1024x1024']],
      [1266, ['530x333']],
      [1126, ['856x671']],
      [812, ['2560x2048']],
      [908, []],
    ]);
    for (const image of items.flatMap((news) => news.images)) {
      expect(image.src).toMatch(new RegExp(`^media/${image.legacyMediaId}-`));
      expect(image.alt).toBe('');
      expect(image.license).toBe('confirmed');
      expect(image.legacyMediaId).toBeTypeOf('number');
    }
  });

  it('category/excerpt 필드 없음 (기존 데이터에 없음)', () => {
    for (const news of items) {
      expect(news).not.toHaveProperty('category');
      expect(news).not.toHaveProperty('excerpt');
    }
  });

  it('formatDotDate', () => {
    expect(formatDotDate('2024-04-05')).toBe('2024.04.05');
  });
});
