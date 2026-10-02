/**
 * Global Navigation (docs/requirements.md §3, docs/sitemap.md)
 * - COMPANY / BUSINESS는 그룹 label이며 독립 링크가 아니다.
 * - URL은 trailing slash 없이 사용한다. (docs/decisions.md D-06)
 * - "Mirae I&Tec" 표기는 requirements.md §3 기준. 회사 영문 표기 확정 시 함께 검토 (D-04)
 */
export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  type: 'group';
  id: string;
  label: string;
  children: readonly NavLink[];
}

export interface NavLinkItem extends NavLink {
  type: 'link';
}

export type NavItem = NavGroup | NavLinkItem;

export const NAVIGATION: readonly NavItem[] = [
  {
    type: 'group',
    id: 'company',
    label: 'COMPANY',
    children: [
      { label: 'Mirae I&Tec', href: '/company' },
      { label: 'Team', href: '/team' },
      { label: 'News & Notices', href: '/news' },
    ],
  },
  {
    type: 'group',
    id: 'business',
    label: 'BUSINESS',
    children: [
      { label: 'Projects', href: '/projects' },
      { label: 'Business Line', href: '/business' },
    ],
  },
  { type: 'link', label: 'SEARCH', href: '/search' },
];
