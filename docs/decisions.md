# Decisions

구현에 영향을 주는 결정 사항 기록. 확정되지 않은 항목은 임의로 결정하지 않는다. (CLAUDE.md §2)

| ID | 항목 | 상태 | 결정 내용 | 영향 Phase |
|---|---|---|---|---|
| D-01 | Framework / 호스팅 | 일부 확정 | Framework: **Astro** (TypeScript, 순수 CSS). 호스팅: TBD — 301 및 query 유지 redirect(`/?s=` → `/search?q=`) 지원 필요 | 1, 11 |
| D-02 | 프로토타입 반영 범위 (디자인만 / 섹션 구성까지) | **확정** | **디자인만 반영** (토큰, 폰트, 색상, 여백, 컴포넌트 시각 디자인). 프로토타입 HTML/JS/콘텐츠/섹션 구성은 사용하지 않음 | 2, 3 |
| D-03 | WordPress 원본 확보 (XML export, DB, `/wp-content/uploads/`) | 미결정 | | 1, 4~8 |
| D-04 | 회사 영문 표기 (Mirae I&Tec / Mirae I&N Tech) | 잠정 | 기존 사이트 h1/메뉴 표기 `Mirae I&Tec` 사용 (Phase 4). 기존 텍스트 로고는 `MIRAE I&TEC`, 프로토타입은 `I&N Tech` — 최종 확정은 고객 확인 | 2, 4, 10 |
| D-05 | 공식 로고 SVG, 기본 OG 이미지 | 일부 확정 | 로고: 2026-10-02 **확정** — 원본 `design/brand/mrint-logo.svg` (184×50, 슬래시 `#39B54A` + 워드마크 black). `LogoMark.astro`는 동일 path에 워드마크 `currentColor`, 슬래시 `--logo-accent`로 배경 tone 대응. 기본 OG 이미지: 미결정 | 2, 10 |
| D-06 | trailing slash 정책 | **확정** | trailing slash 없음 (`/company`). `trailingSlash: 'never'`, `build.format: 'file'` | 1, 10, 11 |
| D-07 | Project slug 규칙 | **확정** | `/projects/project-{legacyId}` (예: `/projects/project-1572`, D-06에 따라 trailing slash 없음). 영문 SEO slug는 전체 URL 정책 결정 시 별도 검토. Home 카드 3·4 → project-973 / project-406 | 3, 7, 11 |
| D-08 | Year 필터, Pagination 방식 | **확정** | 필터 Type / Industry / Status / **Year** (0건 연도 2017·2019 숨김), query `_type`·`_industry`·`_status`·`_year`(기존 FacetWP 이름). Pagination 20건(20/20/17), `_paged`, 페이지 번호. 정렬: Status(진행중→완료) → Year 내림차순 → 게시일 내림차순(→ legacyId). JS 미동작 시 57건 전체 표시. canonical은 `/projects` (Phase 10 재검토) | 7, 10 |
| D-09 | CEO URL / Team slug | **확정** | CEO는 역할 기반 `/team/ceo` (기존 `/team/김학연/`, `/ceo/ceo/` → 301 대상). 팀: `/team/ito-team`, `/team/si-team`, `/team/infrastructure-team`, `/team/solution-team`, `/team/future-technology-research-center` (기존 영문명 기반) | 5, 11 |
| D-10 | News panel + 상세 페이지 병행 여부 | **확정** | **Option A: 목록 + 상세 페이지** (`/news`, `/news/{slug}`), SidePanel 미사용 | 6 |
| D-17 | News 영문 slug 규칙 | 미결정 | 확정 전 임시 slug `news-{기존 post ID}` (예: `/news/news-1583`). 규칙 확정 후 교체 (기존 한글 URL은 legacyUrl 보존, Phase 11 301) | 6, 11 |
| D-18 | 외부 기사(아이티비즈, post 908) 표시 | 보류 | 재사용 권리 확인 전: 본문은 데이터에 보존, 화면에는 제목·날짜·원문 출처 표기만 표시 (`rights.status: unknown`). 확인 시 `confirmed`로 변경 | 6 |
| D-20 | Project industry filter key | 임시 | 기존 industry slug가 한글이라 기존 term ID를 key로 사용 (`?_industry=9` = 은행). 영문 key는 URL 정책 결정 시 검토. type/status/year는 기존 slug 그대로 | 7, 11 |
| D-21 | Business Line URL / 데이터 | **확정** | `/business`, `/business/{it-outsourcing,system-integration,infrastructure,solution}` (기존 `/business_line/{application-outsourcing,si,infra,managed-service}/`, `/business-line/` → Phase 11 301). ACF contents 블록(title/description/image/tabs)을 원문 순서·문자열 그대로 보존, title 블록 = 섹션 h2. Service Features는 접근 가능한 탭(JS 미동작 시 전체 표시). Related Projects 없음 (Business Line ↔ Project 관계 미생성) | 8, 11 |
| D-22 | Partner 데이터 범위 / 표시 | **확정** | 67건 전체 보존 (미연결 27건 포함), 이름 중복(400/486, 728/1375) 병합 안 함, `-2` slug는 `legacySlug`로 보존, ID는 `partner-{legacyId}`(영문 slug 미정). 화면 표시는 Business Line Main Clients(ACF 순서, 이름 텍스트)와 Project partner뿐. 개별 페이지/archive 없음 | 8, 11 |
| D-19 | News 원문 Markdown 기호 `**CubeOne™**` (post 1429) | 보류 | 변환하지 않고 원문 그대로 표시 | 6 |
| D-11 | Home 추가 섹션, Hero 문구 | 미결정 | 고객 원문/승인 필요 | 3 |
| D-12 | meta description 작성/승인 절차 | 미결정 | 데이터 `seo.status: approved` 항목만 배포 | 10 |
| D-13 | 이미지, 고객사 로고 사용권 | 미결정 | 데이터 `image.license`, `partner.logoPermission`으로 관리 | 4~8 |
| D-14 | 지도 서비스 / API key | 일부 확정 | Phase 4: **외부 지도 링크만** 제공 (API/key 미사용). 좌표는 기존 사이트 실제 표시 지도(Google Maps) 기준 `37.5631966, 126.9900875`, zoom 16 보존. 기존 사이트는 Naver script를 로드하지만 미사용(초기화 주석 처리). API 연결 여부/서비스는 미결정 | 4 |
| D-15 | 개인정보처리방침, 법적 고지 원문 | 미결정 | | 2 |
| D-16 | 410 사용 여부 | 미결정 | | 11 |
| D-23 | Search 범위 / 매칭 / 정렬 / 구현 방식 | **확정** | **범위**: Company(회사명·introduction·address, 연락처 제외) / Team(이름 ko·en, 직함, introduction·functions·capabilities·biography, Related Projects 제외) / News(title·body, 본문 비공개 908은 title만 — D-18) / Projects(title·name·client·overview·description, Type·Industry·Status label, 연결 Partner 이름, year 제외) / Business(title·summary·description 블록·tab title/description·Main Clients 이름, section title 블록 제외). **Partner**: 독립 결과 없음, 연결된 Project/Business 문서 필드로만 색인 (D-22 유지). **매칭**: NFKC·lowercase·hyphen/공백 정규화, 공백 기준 단어 AND + 공백 제거 비교, 1~3자 영문/숫자 단어는 영문/숫자 단어 경계(한글·기호와 붙으면 일치). 형태소·동의어·ranking 없음. **정렬**: 유형 그룹(Company → Team → News → Projects → Business, 메뉴 순서) → 각 목록의 기존 순서. **구현**: build 시 정적 색인 `/search-index.json` + 브라우저 검색(`src/lib/search/*`, `src/scripts/search.ts`), 외부 서비스 없음. 결과 표시: 유형 그룹 heading + 제목 + 날짜/연도·Type/영문명, 요약문 없음. JS 미동작 시 안내 문구. `/search` noindex·canonical 없음 (title·sitemap 정책은 Phase 10), `/?s=` → `/search?q=` redirect는 Phase 11. 상세: `docs/research/phase-9-search.md` §18 | 9, 10, 11 |

## 기술 결정 (Phase 1)

| 항목 | 내용 |
|---|---|
| Astro | 7.x, `output: static` |
| TypeScript | 6.x, `astro/tsconfigs/strict` + `noUncheckedIndexedAccess`. (`@astrojs/check`가 TypeScript 7을 아직 지원하지 않음) |
| 스키마 | `astro/zod` (zod v4), `src/schemas/*` |
| 데이터 | `src/data/*` + Content Collections (`src/content.config.ts`) |
| 데이터 접근 | `src/lib/content.ts`만 사용 |
| 테스트 | Vitest 5, Playwright 1.63 (Chromium, 390/768/1440), @axe-core/playwright (WCAG 2.2 AA 태그) |
| Node | 24 LTS |
