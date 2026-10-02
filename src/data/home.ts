/**
 * Home 메인 카드 (docs/requirements.md §4)
 * 출처: 기존 사이트 https://mrint.co.kr/ 메인 HTML (2026-10-01 확인)
 * - 순서는 기존 사이트 그대로 유지한다. (배열 순서 = 표시 순서)
 * - 기존 사이트에 설명(description)이 없으므로 만들지 않는다.
 * - title/type/date는 원문 표기 그대로 유지한다.
 *
 * 이미지 (Phase 9.5, docs/decisions.md D-13)
 * - image: src/assets/images/ 기준 경로 (src/lib/images.ts resolveImage). null이면 placeholder를 표시한다.
 *   다른 영역과 같은 원본은 같은 파일을 참조한다. (카드 2: Business system-integration, 카드 3·4: Projects/News)
 * - legacyImagePath는 기존 이미지 경로 기록용이며 로드하지 않는다.
 * - imageAlt: 기존 HTML이 alt=""였으므로 임의 설명을 만들지 않는다.
 */

export interface HomeCard {
  title: string;
  /** 기존 사이트의 구분 표기 */
  type: string;
  /** 기존 사이트의 날짜 표기 (YYYY.MM.DD) */
  date: string;
  /** 신규 사이트 내부 링크 */
  href: string;
  /** detail: 해당 콘텐츠 상세, list: 목록으로 임시 연결 */
  linkTarget: 'detail' | 'list';
  /** 기존 URL (redirect 대상, docs/migration.md) */
  legacyUrl: string;
  /** src/assets/images/ 기준 경로 */
  image: string | null;
  imageAlt: string;
  legacyImagePath: string;
}

export const HOME_CARDS: readonly HomeCard[] = [
  {
    title: 'IT OUTSOURCING',
    type: 'Business line',
    date: '2024.02.23',
    href: '/business/it-outsourcing',
    linkTarget: 'detail',
    legacyUrl: '/business_line/application-outsourcing/',
    image: 'media/361-unsplash_ZKBzlifgkgw.jpg',
    imageAlt: '',
    legacyImagePath: '/wp-content/uploads/2024/02/unsplash_ZKBzlifgkgw.jpg',
  },
  {
    title: 'SYSTEM INTEGRATION',
    type: 'Business line',
    date: '2024.02.23',
    href: '/business/system-integration',
    linkTarget: 'detail',
    legacyUrl: '/business_line/si/',
    image: 'media/793-kevin-ku-w7ZyuGYNpRQ-unsplash.jpg',
    imageAlt: '',
    legacyImagePath: '/wp-content/uploads/2024/02/kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg',
  },
  {
    title: 'IBK기업은행 정보시스템 운영',
    type: 'Projects',
    date: '2024.04.19',
    href: '/projects/project-973',
    linkTarget: 'detail',
    legacyUrl: '/ibk기업은행-정보시스템-운영/',
    image: 'media/978-기업은행.jpg',
    imageAlt: '',
    legacyImagePath: '/wp-content/uploads/2024/04/기업은행.jpg',
  },
  {
    title: '흥국생명 IT 어플리케이션 유지보수',
    type: 'Projects',
    date: '2024.04.01',
    href: '/projects/project-406',
    linkTarget: 'detail',
    legacyUrl: '/2024-흥국생명-it-어플리케이션-유지보수/',
    image: 'media/620-흥국생명_해머링맨.jpeg',
    imageAlt: '',
    legacyImagePath: '/wp-content/uploads/2024/04/흥국생명_해머링맨.jpeg',
  },
];
