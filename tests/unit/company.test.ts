import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toMailtoHref, toTelHref } from '../../src/lib/contact';
import { buildExternalMapUrl } from '../../src/lib/map';
import { companySchema } from '../../src/schemas';

const raw = JSON.parse(readFileSync(join(process.cwd(), 'src/data/company/company.json'), 'utf8'));
const company = companySchema.parse(raw);

describe('company.json (기존 /mirae/ 원문)', () => {
  it('기존 페이지 매핑', () => {
    expect(company.legacyUrl).toBe('/mirae/');
    expect(company.legacyId).toBe(33);
  });

  it('회사명', () => {
    expect(company.name).toEqual({ ko: '미래아이엔텍', en: 'Mirae I&Tec' });
  });

  it('소개: 국문 3개 문단, 문단마다 원문 줄바꿈 1개, 영문 없음', () => {
    const paragraphs = company.introduction?.ko ?? [];
    expect(paragraphs).toHaveLength(3);
    for (const paragraph of paragraphs) expect(paragraph.split('\n')).toHaveLength(2);
    expect(paragraphs[0]).toMatch(/^\(주\)미래아이엔텍은 최고의 기술력과/);
    expect(paragraphs[1]).toContain('Help Desk 까지');
    expect(paragraphs[1]).toContain('극대화 하기');
    expect(company.introduction?.en).toBeUndefined();
  });

  it('연락처', () => {
    expect(company.address).toEqual({
      ko: '서울시 중구 수표로 23, 1001호, 1101호',
      en: '23 Supyo-ro, Jung-gu, Seoul, Republic of Korea',
    });
    expect([company.tel, company.fax, company.email]).toEqual(['02-557-5267', '02-557-5268', 'mrint01@mrint.co.kr']);
  });

  it('지도: 기존 사이트 Google Maps 좌표', () => {
    expect(company.map).toEqual({ lat: 37.5631966, lng: 126.9900875, zoom: 16, provider: 'google' });
  });

  it('이미지: 원본 미확보 상태(src 없음), alt 빈 값, 라이선스 unknown', () => {
    expect(company.images).toHaveLength(1);
    const [image] = company.images;
    expect(image?.src).toBeUndefined();
    expect(image?.legacyUrl).toBe('/wp-content/uploads/2024/04/35nd-large-e1712245987379.jpg');
    expect(image?.alt).toBe('');
    expect(image?.license).toBe('unknown');
  });

  it('SEO 문구는 아직 없다 (Phase 10)', () => {
    expect(company.seo).toEqual({ status: 'draft' });
  });
});

describe('contact links', () => {
  it('tel: 링크는 숫자만 남긴다', () => {
    expect(toTelHref('02-557-5267')).toBe('tel:025575267');
  });

  it('mailto: 링크', () => {
    expect(toMailtoHref('mrint01@mrint.co.kr')).toBe('mailto:mrint01@mrint.co.kr');
  });
});

describe('buildExternalMapUrl', () => {
  it('Google 지도 좌표 검색 링크 (API key 없음)', () => {
    const url = buildExternalMapUrl({ lat: 37.5631966, lng: 126.9900875, zoom: 16, provider: 'google' });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=37.5631966%2C126.9900875');
    expect(url).not.toMatch(/key=/);
  });
});
