import { describe, expect, it } from 'vitest';
import { HOME_CARDS } from '../../src/data/home';
import { normalizePath } from '../../src/lib/url';

describe('HOME_CARDS (기존 mrint.co.kr 메인 카드)', () => {
  it('기존 사이트 순서 그대로 4개', () => {
    expect(HOME_CARDS.map((card) => card.title)).toEqual([
      'IT OUTSOURCING',
      'SYSTEM INTEGRATION',
      'IBK기업은행 정보시스템 운영',
      '흥국생명 IT 어플리케이션 유지보수',
    ]);
  });

  it('type/date 원문 표기', () => {
    expect(HOME_CARDS.map((card) => [card.type, card.date])).toEqual([
      ['Business line', '2024.02.23'],
      ['Business line', '2024.02.23'],
      ['Projects', '2024.04.19'],
      ['Projects', '2024.04.01'],
    ]);
  });

  it('신규 내부 URL (trailing slash 없음)', () => {
    expect(HOME_CARDS.map((card) => card.href)).toEqual([
      '/business/it-outsourcing',
      '/business/system-integration',
      '/projects/project-973',
      '/projects/project-406',
    ]);
    for (const card of HOME_CARDS) expect(normalizePath(card.href)).toBe(card.href);
  });

  it('카드 4개 모두 상세로 연결 (Project 카드: D-07 project-{legacyId})', () => {
    expect(HOME_CARDS.map((card) => card.linkTarget)).toEqual(['detail', 'detail', 'detail', 'detail']);
  });

  it('기존 URL을 redirect 매핑용으로 보존한다', () => {
    expect(HOME_CARDS.map((card) => card.legacyUrl)).toEqual([
      '/business_line/application-outsourcing/',
      '/business_line/si/',
      '/ibk기업은행-정보시스템-운영/',
      '/2024-흥국생명-it-어플리케이션-유지보수/',
    ]);
  });

  it('이미지는 확인 전까지 null(placeholder), alt는 원문과 같이 빈 값', () => {
    for (const card of HOME_CARDS) {
      expect(card.image).toBeNull();
      expect(card.imageAlt).toBe('');
      expect(card.legacyImagePath).toMatch(/^\/wp-content\/uploads\//);
    }
  });
});
