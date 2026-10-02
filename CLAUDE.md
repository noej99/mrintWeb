# CLAUDE.md

## 1. Project Overview

이 프로젝트는 `(주)미래아이엔텍(Mirae I&Tec)`의 기존 기업 홈페이지 `mrint.co.kr`을 분석하고 신규 웹사이트로 재구축하는 프로젝트이다.

### 기존 사이트

- URL: https://mrint.co.kr/
- 기존 CMS: WordPress 6.6.9
- 기존 Theme: `mrint`
- 주요 메뉴:
  - Company
  - Team
  - News & Notices
  - Projects
  - Business Line
  - Search

### 신규 사이트의 기본 원칙

1. 기존 콘텐츠를 임의로 삭제하지 않는다.
2. 기존 콘텐츠의 의미를 임의로 변경하지 않는다.
3. 고객 확인이 필요한 오탈자/기간/상태/중복 데이터는 임의 수정하지 않는다.
4. 기존 URL이 변경되는 경우 반드시 migration/redirect 전략을 적용한다.
5. 콘텐츠와 UI를 분리한다.
6. SEO, 접근성, 반응형, 성능을 개발 초기부터 고려한다.
7. 기존 사이트의 문제를 신규 사이트에서 반복하지 않는다.

---

## 2. Source of Truth

개발 시 다음 문서를 우선적으로 참조한다.

```text
CLAUDE.md
    ↓
docs/requirements.md
    ↓
docs/sitemap.md
    ↓
docs/architecture.md
    ↓
docs/seo.md
    ↓
docs/migration.md
```

문서 간 충돌이 있을 경우:

1. 고객이 확정한 요구사항
2. `docs/requirements.md`
3. `docs/sitemap.md`
4. `docs/architecture.md`
5. `docs/seo.md`
6. `docs/migration.md`

순으로 판단한다.

불확실한 내용은 임의로 결정하지 말고 `TODO`, `TBD`, `확인 필요`로 표시한다.

---

## 3. Content Preservation Rule

기존 사이트 콘텐츠는 우선 원문 그대로 보존한다.

특히 다음 콘텐츠를 유지한다.

- Business Line 4건
- Projects 57건
- News & Notices 8건
- Team 6건
- Partners 67건

다음 항목은 고객 확인 전까지 수정하지 않는다.

- 프로젝트 기간
- 프로젝트 상태
- 고객사명
- 프로젝트 Type
- Project Overview
- 오탈자로 의심되는 문구
- 중복 데이터
- 이미지 저작권/라이선스
- AI 생성 이미지 사용 여부
- 고객사 로고 사용 권한

오탈자가 의심되더라도 원문을 먼저 유지하고 `확인 필요` 상태로 관리한다.

---

## 4. Development Principles

### 4.1 Analyze Before Implementing

코드를 바로 작성하지 않는다.

작업 시작 전:

1. 관련 문서 확인
2. 현재 프로젝트 구조 확인
3. 요구사항 확인
4. 영향을 받는 페이지 확인
5. 구현 계획 수립
6. 구현
7. 테스트
8. 결과 검증

순으로 진행한다.

### 4.2 Do Not Guess

다음 정보가 없으면 임의로 생성하지 않는다.

- 회사 소개 문구
- CEO 인사말
- 회사 연혁
- 비전/미션
- 고객사 정보
- 프로젝트 정보
- 인증/수상 정보
- 개인정보처리방침
- 법적 고지 내용

필요한 경우 `TODO: CLIENT CONFIRMATION REQUIRED`를 사용한다.

---

## 5. Existing Site Issues To Fix

### Functional

- 검색 기능 오류
- 404 페이지의 `index page 입니다.` 노출
- taxonomy archive의 개발용 문구
- Project History 중복 출력
- Project H1/H2 중복
- Team 상세 Markdown 기호 노출
- 메인 슬라이드 순서 불안정

### SEO

- 모든 페이지 동일 title
- 모든 페이지 동일 meta description
- 동일 OG description
- 불필요한 sitemap URL
- `/home/` 중복
- 빈 Partners 페이지 색인
- taxonomy archive 색인
- 한글/숫자 slug 문제
- 구조화 데이터 부족

### Accessibility

- 이미지 alt 없음
- 낮은 색상 대비
- 작은 글자
- 모바일 메뉴 가독성 문제
- 키보드 접근성 부족 가능성

### Performance

- 원본 고해상도 이미지 사용
- WebP/AVIF 미사용
- lazy loading 부족
- 반응형 이미지 부족
- 모든 페이지에서 Naver Map script 로드

### Security

- WordPress version 노출
- REST API 노출
- user sitemap 노출 가능성

---

## 6. URL Rules

신규 URL은 다음 원칙을 사용한다.

- lowercase
- 영문 slug
- 단어 구분은 `-`
- 의미가 명확한 URL
- 콘텐츠 타입별 namespace 분리

예:

```text
/company
/team
/team/{slug}
/news
/news/{slug}
/projects
/projects/{slug}
/business
/business/it-outsourcing
/business/system-integration
/business/infrastructure
/business/solution
/search?q={query}
```

---

## 7. Component Rules

공통 UI는 재사용 가능한 컴포넌트로 만든다.

예:

```text
Header
MegaMenu
MobileMenu
Footer
PageHeader
Card
ProjectCard
ProjectFilter
NewsList
NewsPanel
TeamCard
BusinessCard
StatusBadge
Pagination
SearchForm
```

동일한 UI를 페이지마다 복사해서 구현하지 않는다.

---

## 8. Responsive Rules

최소한 다음 환경을 고려한다.

- Mobile: 390px
- Tablet: 768px
- Desktop: 1440px

반응형 레이아웃은 특정 화면 크기에 종속되지 않도록 한다.

---

## 9. Accessibility Rules

모든 이미지에는 의미에 맞는 `alt`를 제공한다.

장식용 이미지는:

```html
alt=""
```

를 사용한다.

기능 요소는 키보드로 접근 가능해야 한다.

메뉴, modal, panel, filter 등의 상태는 적절한 ARIA 속성을 사용한다.

색상만으로 상태를 전달하지 않는다.

---

## 10. SEO Rules

모든 indexable 페이지는 고유한:

- title
- meta description
- canonical
- Open Graph metadata

를 가져야 한다.

페이지 내용과 관계없는 URL을 sitemap에 포함하지 않는다.

redirect가 필요한 기존 URL은 301을 사용한다.

---

## 11. Image Rules

이미지는 가능한 경우:

- AVIF
- WebP

를 우선 사용한다.

원본 이미지를 그대로 브라우저에 전달하지 않는다.

가능하면:

```text
srcset
sizes
width
height
loading="lazy"
decoding="async"
```

를 적용한다.

Hero/LCP 이미지는 필요한 경우 lazy loading을 사용하지 않는다.

---

## 12. Testing

### Desktop

- 1440px

### Mobile

- 390px

### Functional

- navigation
- mega menu
- mobile menu
- search
- project filter
- pagination
- project detail
- news detail/panel
- team detail
- business detail
- redirect
- 404

### SEO

- title
- description
- canonical
- sitemap
- robots
- OG
- structured data

### Accessibility

- keyboard navigation
- image alt
- heading hierarchy
- contrast
- focus state

---

## 13. Claude Code Working Rules

작업 요청을 받으면 먼저 관련 파일을 읽는다.

예:

```text
@CLAUDE.md
@docs/requirements.md
@docs/sitemap.md
```

구현 전에 변경 범위를 설명하고, 큰 변경은 단계별로 진행한다.

기존 코드를 삭제하기 전에 반드시 의존성을 확인한다.

작업 완료 후 다음을 보고한다.

```text
변경 파일
변경 내용
테스트 결과
남은 TODO
```

---

## 14. Forbidden

다음 작업을 임의로 하지 않는다.

- 기존 콘텐츠 삭제
- 고객 데이터 임의 변경
- URL 변경 후 redirect 누락
- SEO metadata 임의 생성
- 존재하지 않는 회사 정보 생성
- 인증/수상 경력 생성
- 프로젝트 성과 수치 생성
- 고객사 로고 임의 추가
- 라이선스가 불명확한 이미지 사용
- 보안 설정 임의 완화

---

## 15. Current Project Status

Phase 1(프로젝트 기반 구성), Phase 2(공통 Layout), Phase 3(Home), Phase 4(Company), Phase 5(Team), Phase 6(News), Phase 7(Projects), Phase 8(Business Line), Phase 9(Search, 404) 완료. SEO/Redirect 등은 아직 진행하지 않았다.

- Search: `/search?q=` (build 시 `/search-index.json` 생성, `src/lib/search/*` 정규화·문서·매칭, `src/scripts/search.ts`). 원본 data 불변, Partner는 Project/Business 문서 필드로만 색인, News 908 본문 미색인 (D-23)
- 404: `src/pages/404.astro` (홈 이동 + 검색 form)
- 배포 미리보기: GitHub Pages (`.github/workflows/deploy-pages.yml`, base `/mrintWeb`), 내부 링크는 `withBase()` 사용
- Business Line 데이터: `src/data/business/*.json` (기존 4건, ACF contents 블록 원문, Main Clients = ACF partners 순서, 이미지는 placeholder, Project 관계 없음)
- Partners 데이터: `src/data/partners.json` (기존 67건 전체, 중복 미병합, 화면 표시는 BL/Project 참조 40건, 개별 페이지 없음)
- Projects 데이터: `src/data/projects/*.json` (기존 57건, slug `project-{legacyId}`), `src/data/taxonomies.json`(27 terms)

- News 데이터: `src/data/news/*.json` (기존 8건, 임시 slug `news-{post ID}`, 외부 기사 908은 권리 확인 전 본문 미표시)

- 디자인 시스템: `docs/design-system.md` (참고자료 분석, Design Direction, 공통 패턴/페이지 템플릿)
- Team 데이터: `src/data/team/*.json` (기존 /team/ 6건, 이미지는 placeholder, Related Projects는 Project 상세와 연결)

- Home 카드 데이터: `src/data/home.ts` (기존 사이트 메인 4개, 이미지는 placeholder)
- Company 데이터: `src/data/company/company.json` (기존 /mirae/ 원문, 지도는 외부 링크만, 이미지는 placeholder)

- 공통 Layout/컴포넌트: `src/layouts/BaseLayout.astro`, `src/components/{layout,ui,seo}/*`
- 컴포넌트 미리보기: `/dev/components` (dev/test 빌드 전용, production 미포함)

- 기술 스택: Astro + TypeScript + 순수 CSS, URL은 trailing slash 없음 (`docs/decisions.md`)
- 콘텐츠 데이터: `src/data/*` (WordPress 원본에서만 이관), 스키마: `src/schemas/*`
- 데이터 접근: `src/lib/content.ts`
- 디자인 프로토타입: `design/prototype/` (참고용, 삭제 금지)
- 고객 확인 checklist: `docs/content-validation.md`

다음 구현 단계에서는:

1. 문서 확정
2. 콘텐츠 데이터 구조화
3. 디자인 시스템 정의
4. 공통 Layout 구현
5. 페이지 구현
6. 콘텐츠 이관
7. SEO 구현
8. redirect 구현
9. 테스트
10. 최종 검수

순으로 진행한다.
