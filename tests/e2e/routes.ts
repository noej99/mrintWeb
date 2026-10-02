/**
 * E2E/접근성 테스트 대상 경로.
 * 페이지를 구현할 때마다 추가한다. (Phase 3~9)
 */
export const TEAM_SLUGS = [
  'ceo',
  'ito-team',
  'si-team',
  'infrastructure-team',
  'solution-team',
  'future-technology-research-center',
] as const;

/** 임시 slug news-{기존 post ID} — 기존 목록 순서 (게시일 최신순) */
export const NEWS_SLUGS = [
  'news-1583',
  'news-1563',
  'news-1528',
  'news-1429',
  'news-1266',
  'news-1126',
  'news-812',
  'news-908',
] as const;

/**
 * 기존 /projects/ 목록 순서 (legacyId, Phase 7 Pre-Research). slug = project-{legacyId}
 */
export const PROJECT_LEGACY_ORDER = [
  1572, 1565, 1542, 1491, 1489, 1487, 1485, 1481, 1456, 1454, 1452, 1450, 1283, 1199, 1519, 1279, 1212, 1135, 1131,
  1080, 1044, 1001, 982, 1512, 1209, 1060, 1057, 406, 1270, 1257, 973, 1086, 1028, 1051, 992, 1537, 1483, 1479, 1477,
  1475, 1473, 1471, 1205, 1149, 1144, 1097, 1232, 1223, 1220, 1072, 1252, 1094, 1083, 1064, 1444, 1076, 1089,
] as const;

/** 접근성/스모크 대표 상세: 설명 없음(1572), 2장+영문(406), Type 없음(982), History 3건(973), 2장(1001), partner 의심(1252) */
export const PROJECT_SAMPLE_SLUGS = ['project-1572', 'project-406', 'project-982', 'project-973', 'project-1001', 'project-1252'] as const;

/** Business Line 기존 목록 순서 (271/278/279/280) */
export const BUSINESS_SLUGS = ['it-outsourcing', 'system-integration', 'infrastructure', 'solution'] as const;

export const ROUTES: readonly string[] = [
  '/',
  '/company',
  '/team',
  ...TEAM_SLUGS.map((slug) => `/team/${slug}`),
  '/news',
  ...NEWS_SLUGS.map((slug) => `/news/${slug}`),
  '/projects',
  ...PROJECT_SAMPLE_SLUGS.map((slug) => `/projects/${slug}`),
  '/business',
  ...BUSINESS_SLUGS.map((slug) => `/business/${slug}`),
  '/search',
  '/dev/components',
];
