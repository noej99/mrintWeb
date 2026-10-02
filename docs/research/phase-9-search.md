# Phase 9 — Search 사전조사 및 구현 설계

검색(`/search?q=`) 구현 전에 **무엇을, 어떻게 검색할지** 결정하기 위한 조사 자료. 이 문서는 구현을 포함하지 않는다.

- 실제 사이트에서 **관찰한 사실**은 `[관찰]`, 현재 Astro 데이터에서 **확인한 사실**은 `[데이터]`, 이 문서의 **제안**은 `[제안]`으로 구분한다.
- 확인하지 못한 내용은 `확인 불가` / `TBD`로 남긴다.
- 원본 데이터(`src/data/*`)는 수정하지 않았다.

---

## 1. 조사 일시

- 2026-10-02 13:38 KST (04:38 UTC) ~
- 조사 방식: read-only GET (`curl`), 기존 사이트 검색 페이지를 headless Chromium(Playwright)으로 렌더링해 사용자 화면과 같은 결과 확인. 렌더링 중 사이트 자체 스크립트가 보내는 FacetWP 조회 요청(`POST /wp-json/facetwp/v1/refresh`) 외에 별도 요청을 만들지 않았다.

## 2. 조사 대상

| 대상 | 내용 |
|---|---|
| 기존 사이트 | `https://mrint.co.kr/?s={query}` (HTML, JS 렌더링 후 결과), `/wp-json/wp/v2/search`, `/wp-json/wp/v2/types` |
| 검색어 | `SC`, `sc`, `SC제일`, `SC 제일`, `SC제일은행`, `IT`, `ITO`, `SI`, `은행`, `보험`, `수주`, `시스템`, `미래`, `미래아`, `미래아이엔텍`, `기업은행`, `IBK`, `흥국생명`, `흥국`, `농협은행`, `김학연`, `CEO`, `CubeOne`, `cubeone`, `CubeOne™`, `INFRASTRUCTURE`, `SOLUTION`, `Cloud`, `Framework`, `Help Desk`, `외축환`, `FIPS`, `LG CNS`, `Mirae`, `a` |
| 현재 프로젝트 | `src/data/{company,team,news,projects,business}`, `src/data/partners.json`, `src/data/taxonomies.json`, `src/schemas/*`, `src/lib/content.ts`, `src/components/seo/BaseHead.astro`, `src/data/navigation.ts` |
| 기존 검색 코드 | `src/pages/search*`, `src/lib/*search*`, `src/components/**/*search*`, `tests/**/*search*` — **없음** |

---

## 3. 기존 WordPress 검색 동작

### 3-1. 검색 URL / 페이지 구조 [관찰]

- 검색 URL: `/?s={query}` (form `action="https://mrint.co.kr/" method="get"`, input `name="s"`). 다른 검색 URL 없음.
- 검색 페이지는 **FacetWP 4.1.8** 템플릿(`searched_list`)이다.
  1. 서버 HTML: `<h1>Search</h1>`, `"{query}"로 검색한 결과입니다.`, 결과 영역은 항상 `검색된 내용이 없습니다.`로 출력된다.
  2. JS 로드 후 `FWP.fetchData()`가 `POST /wp-json/facetwp/v1/refresh`로 결과를 받아 목록을 교체하고 URL에 `&_search={query}`를 추가한다.
  3. 따라서 **JS가 동작하지 않으면 어떤 검색어도 결과가 없는 것처럼 보인다.**
- 결과 항목 표시: `콘텐츠 유형 라벨`(PROJECTS / NEWS&NOTICES / TEAM / BUSINESS LINE) + `제목` + `날짜(YYYY.MM.DD, 게시일)`. 요약문/일치 위치 표시 없음.
- Pagination: FacetWP pager, **12건/페이지**, 페이지 번호.
- `<title>미래아이엔텍</title>`(전 페이지 공통), `robots: noindex, follow`, canonical 없음.
- body class: WordPress 기본 query 결과에 따라 `search-results` / `search-no-results` (FacetWP 결과와 무관).

### 3-2. FacetWP 검색 결과 (사용자에게 실제 보이는 결과) [관찰]

| 검색어 | total_rows | 결과 유형 (1페이지 기준) | 비고 |
|---|---|---|---|
| `SC` / `sc` | 17 | PROJECTS | 대소문자 무시 |
| `SC제일` / `SC 제일` | 17 | PROJECTS | 공백 포함 검색도 동일 결과 |
| `은행` | 28 | PROJECTS, NEWS&NOTICES | 부분 일치 (`농협은행`, `저축은행`) |
| `시스템` | 20 | PROJECTS, NEWS&NOTICES | 부분 일치 (`정보시스템`, `차세대시스템`) |
| `IT` | 11 | NEWS, PROJECTS, TEAM(`ITO 팀`), BUSINESS LINE(`IT OUTSOURCING`) | `ITO`, `IT아웃소싱`도 일치 |
| `ITO` | 2 | PROJECTS(`삼성꿈장학재단 ITO 유지보수`), TEAM(`ITO 팀`) | 프로젝트 Type `ITO`(24건)는 검색되지 않음 |
| `미래` | 6 | NEWS 5, TEAM(`미래기술연구소`) | |
| `흥국생명` | 2 | PROJECTS 1, NEWS 1 | |
| `IBK` | 4 | PROJECTS | Partner `IBK 시스템`, `IBK기업은행`은 결과에 없음 |
| `김학연` | 2 | NEWS 1, TEAM(`/team/김학연/`) | |
| `INFRASTRUCTURE` | 1 | BUSINESS LINE | |
| `SOLUTION` | 1 | BUSINESS LINE (`/business_line/managed-service/`) | |
| `CEO`, `Cloud`, `CubeOne`, `cubeone`, `CubeOne™`, `외축환`, `FIPS`, `Help Desk`, `LG CNS`, `Mirae` | 0 | — | 모두 본문/ACF 필드에만 있는 단어 |

결론 [관찰]:

- **검색 대상 유형**: Projects(`post`), News(`news_notices`), Team(`team`), Business Line(`business_line`).
- **검색되지 않는 유형**: Company(`page` 33 `/mirae/` — 제목 `Mirae I&Tec`이어도 `Mirae` 0건), Partners(`partners`), attachment.
- **검색 필드**: **제목(post title)만.** ACF 본문(Project Overview/Client, News description, Team 본문, Business Line contents)은 검색되지 않는다.
  - 예: `외축환`(Project Overview), `LG CNS`(Project Client), `FIPS`(News 본문), `Cloud`/`CubeOne`(Business Line tab), `CEO`(Team 직함) → 0건.
- **매칭**: 대소문자 무시 부분 일치. 공백이 있는 `SC 제일`도 `SC제일은행 …`과 일치(공백 처리 방식 — 단어별 AND인지 공백 제거인지 — 는 확인 불가).
- **정렬**: 1페이지 결과는 유형 혼합, 게시일 내림차순으로 보인다. 같은 날짜 안의 순서 규칙은 확인 불가.
- 2페이지 이후: URL `&_paged=N`으로 직접 열었을 때 항목 합계가 total_rows보다 많게 집계되어(예: `은행` 28 → 36) 페이지 이동 동작은 **확인 불가**로 남긴다.

### 3-3. `SC` 검색 문제 (requirements §10) [관찰]

requirements의 "기존 사이트에서 `SC` 검색 결과가 나오지 않는 문제"는 다음과 같이 재현된다.

- 서버 HTML(= JS 미동작, 검색엔진, 미리보기): `검색된 내용이 없습니다.`
- WordPress 기본 검색(REST `/wp/v2/search`, 서버 query): `SC` 0건 (아래 §4).
- JS 렌더링 후(FacetWP): 17건 표시.

즉 FacetWP가 동작하는 브라우저에서는 결과가 보이지만, 서버 응답과 WordPress 기본 검색은 결과가 없다.

### 3-4. 기존 검색 페이지의 기타 문제 [관찰]

- **검색어가 escape 없이 서버 HTML에 삽입된다.** `?s=<i>x</i>"'` 요청 시 `<span class='keyword'><i>x</i>\"\'</span>`, inline script `FWP.facets['search'] = '<i>x</i>\"\'';`로 출력됨 (JS가 이후 innerText로 덮어씀). 신규 사이트에서 반복하지 않는다 (architecture §20 "검색 query는 그대로 HTML에 삽입하지 않는다").
- 검색 form이 페이지에 2개 있고 `id="s"`, `id="searchform"`이 중복된다.
- `</body>` 뒤에 `<footer>`가 출력된다.
- 결과 링크가 기존 한글/숫자 slug(`/1537-2/`, `/team/ito-팀/` 등) — 신규에서는 신규 URL로 연결.

---

## 4. REST API 검색 결과 [관찰]

### 4-1. Post type (`/wp-json/wp/v2/types`, 공개)

| type | rest_base | 이름 | 신규 대응 |
|---|---|---|---|
| `post` | posts | 글 | Projects |
| `page` | pages | 페이지 | Company(`/mirae/`) 등 |
| `attachment` | media | 미디어 | — |
| `business_line` | business_line | Business line | Business |
| `news_notices` | news_notices | News&Notices | News |
| `team` | team | Team | Team |
| `partners` | partners | 파트너 | Partner (공개 페이지 없음) |
| `forms` | forms | forms | — |
| (`nav_menu_item`, `wp_block`, `wp_template` 등 시스템 type) | | | — |

### 4-2. `/wp-json/wp/v2/search?search={q}&per_page=100`

- 응답 필드: `id`, `title`, `url`, `type`(`post`), `subtype`(post type).
- 검색 대상 subtype: `post`, `page`, `news_notices`, `team`, `partners`, `attachment`이 결과에 나타남. `business_line`은 이번 검색어에서 나타나지 않음.
- **FacetWP 결과와 다르다.** 단어(공백·문장부호로 구분된 토큰) 단위로만 일치하는 것으로 관찰됨:

| 검색어 | REST 결과 | FacetWP 결과 |
|---|---|---|
| `SC` | 0 | 17 |
| `SC제일` | 0 | 17 |
| `SC제일은행` | 17 (post) | — |
| `은행` | 0 | 28 |
| `시스템` | 10 (post 6, partners 1, attachment 3) — 제목에 `시스템`이 **독립 단어**인 6건만 일치, `정보시스템` 등 12건 불일치 | 20 |
| `IT` | 0 | 11 |
| `ITO` | 2 (team 1, post 1) | 2 |
| `미래` / `미래아` | 0 / 0 | 6 / — |
| `미래아이엔텍` | 4 (news) — `㈜미래아이엔텍,` 제목(1429)은 불일치 | — |
| `보험` | 1 (news 1563, 제목에 독립 단어 `보험`) | — |
| `LG CNS` | 2 (partners 1, attachment 1) | 0 |
| `Mirae` | 3 (page 1, attachment 2) | 0 |
| `CubeOne` | 1 (attachment) | 0 |

- 정렬: 이번 관찰에서는 대체로 post 게시일 내림차순 → partners/attachment 순으로 보였으나 규칙은 확인 불가.
- 이 단어 단위 동작이 WordPress 설정/테마/플러그인 중 무엇 때문인지는 **확인 불가** (원본 코드/DB 미확보, D-03).

---

## 5. 현재 Astro 데이터 구조 [데이터]

| 콘텐츠 | 건수 | 데이터 | 상세 URL | 텍스트 필드 |
|---|---|---|---|---|
| Company | 1 | `src/data/company/company.json` | `/company` | `name.ko/en`, `introduction.ko[]`(280자), `address.ko/en`, `tel`, `fax`, `email` |
| Team | 6 (person 1, team 5) | `src/data/team/*.json` | `/team/{slug}` | `nameKo`, `nameEn`, `titleKo/En`(CEO만), `introduction[]`, `functions[]`, `capabilities[]`, `biography[{title,items[]}]`(CEO만), `relatedProjectsLegacy[{title,year}]` |
| News | 8 | `src/data/news/*.json` | `/news/{slug}` (`news-{ID}`, D-17 임시) | `title`, `date`, `body[paragraph/list]`, `source`(908만), `rights`(908 `unknown`) |
| Projects | 57 | `src/data/projects/*.json` | `/projects/{slug}` (`project-{ID}`, D-07) | `title`, `name`(16건 title과 다름), `date`, `year`, `type`(1건 없음), `industry`, `status`, `period`, `client`, `overview`(5건 빈 값), `description[]`(22건), `partner` |
| Business Line | 4 | `src/data/business/*.json` | `/business/{slug}` | `title`, `summary`, `contents[title/description/image/tabs]`, `clients[]` |
| Partners | 67 | `src/data/partners.json` | 없음 | `name` (+ `legacySlug`) |
| Taxonomy | 27 terms | `src/data/taxonomies.json` | (`/projects?_type=…` 필터) | `label` (`SI`, `ITO`, `은행`, `진행중` 등) |

추가 확인 사항:

- 모든 데이터 접근은 `src/lib/content.ts`를 통한다 (`getProjects`, `getNews`, `getTeam`, `getBusinessLines`, `getCompany`, `getPartners`, `getPartnerUsage`, `getTermLabels`).
- 화면 표시 여부
  - Project 상세는 Partner 이름을 `Partner` 항목으로 **표시한다** (`ProjectMeta.astro`).
  - Business 상세는 Main Clients(Partner 이름 텍스트, 링크 없음)를 **표시한다** (`MainClients.astro`).
  - News 908은 `rights.status: unknown` → **본문을 표시하지 않고** 제목·날짜·출처만 표시 (`NewsBody.astro`, D-18).
  - Team 상세는 Related Projects 목록(기존 제목·연도)을 표시한다.
- 텍스트 특이사항
  - Business Line 문자열에 `\r` 83개, `\t` 14개 (원문 보존) — 검색/요약 생성 시 정규화 필요. 다른 콘텐츠에는 없음.
  - `™`: `business/solution`(3), `news-1429`(3). `‑`(U+2011 non-breaking hyphen): `news-1429` `FIPS‑140`. `㈜`(U+3231): `news-1429` 제목.
  - 표기 변형: `SC제일은행`(Project 제목) / `SC 제일은행`(Partner 이름) / `한국스탠다드차타드은행`(Project client) / `SCBK`(Project name). `CubeOne™` / `큐브원`(news-1429). `IBK기업은행` / `기업은행`.
- 전체 텍스트 규모: 검색 후보 문서 143개(Company 1, Team 6, News 8, Projects 57, Business 4, Partner 67), 필드 원문 합계 약 **69KB**(UTF-8, 압축 전). Partner를 제외하면 76개 문서, 약 67KB.

---

## 6. 콘텐츠별 검색 후보

| 콘텐츠 | 데이터 위치 | 상세 페이지 | 검색 후보 | 검색할 필드 (제안) | 근거 |
|---|---|---|---|---|---|
| Company | `company/company.json` | `/company` | **예** | `name.ko/en`, `introduction.ko`, `address.ko/en` (tel/fax/email은 TBD) | requirements §10, sitemap §8 검색 대상. 기존 사이트는 미검색 |
| Team | `team/*.json` | `/team/{slug}` | **예** | `nameKo`, `nameEn`, `titleKo/En`, `introduction`, `functions`, `capabilities`, `biography` (`relatedProjectsLegacy`는 TBD — §16 Q7) | 기존 사이트 검색 대상(제목만) |
| News | `news/*.json` | `/news/{slug}` | **예** | `title`, `body` (단 `rights.status`가 `confirmed`가 아닌 908은 `title`만 — §16 Q4) | 기존 사이트 검색 대상(제목만) |
| Projects | `projects/*.json` | `/projects/{slug}` | **예** | `title`, `name`, `client`, `overview`, `description`, Partner 이름(§8), taxonomy label(TBD — §16 Q6) | 기존 사이트 검색 대상(제목만) |
| Business Line | `business/*.json` | `/business/{slug}` | **예** | 범위 A/B/C 결정 필요 (§7), Main Clients 이름(§8) | 기존 사이트 검색 대상(제목만) |
| Partners | `partners.json` | 없음 | **독립 결과로는 아니오** (§8) | — | 이동 가능한 페이지 없음 (D-22, sitemap §10) |

---

## 7. Business Line 검색 범위

블록 구성 [데이터]:

| slug | summary | title 블록 | description | tabs (탭 수) | 텍스트(자) title / description / tab title / tab description |
|---|---|---|---|---|---|
| it-outsourcing | 28자 | 4 (`Service Summary`, `어플리케이션운영 서비스`, `Mirae I&Tec Application Outsourcing Framework`, `Service Features`) | 3 | 1 (3: 프로젝트 수행 경험 / 분야별 전문 인력 보유 / 고객 중심 맞춤 서비스) | 88 / 853 / 34 / 579 |
| system-integration | 43자 | 1 (`Service Summary`) | 1 | 0 | 15 / 440 / 0 / 0 |
| infrastructure | 33자 | 2 (`Service Summary`, `Service Features`) | 1 | 1 (3: IT 인프라 구축 / IT 인프라 운영관리 / Cloud) | 31 / 300 / 25 / 1,358 |
| solution | 45자 | 2 (`Service Summary`, `Service features`) | 1 | 1 (3: CubeOne™ Plug-In / CubeOne™ API / CubeOne™ SAP) | 31 / 328 / 40 / 689 |

| | Option A — title + summary | Option B — + description | Option C — + tabs (title/description) |
|---|---|---|---|
| 대상 텍스트 | 약 150자 | 약 2,060자 | 약 4,780자 |
| `CubeOne` | 0건 | 0건 | solution 1건 (탭 제목) |
| `Cloud` | 0건 | 0건 | infrastructure 1건 (탭 제목) |
| `SC` (`SC제일은행` 언급) | 0건 | 0건 | it-outsourcing 1건 (탭 본문 고객사 나열) |
| `흥국생명` | 0건 | 0건 | it-outsourcing 1건 (탭 본문) |
| 장점 | 기존 사이트와 거의 동일, 결과 노이즈 최소 | 서비스 소개 문단 검색 | 화면에 보이는 모든 텍스트가 검색됨. Solution의 제품명(CubeOne™)은 탭에만 있음 |
| 단점 | `SOLUTION` 상세의 제품명·서비스명 검색 불가 | Solution/Infrastructure 핵심 키워드가 탭에 있어 누락 | 탭 본문의 고객사 나열로 고객사명 검색 시 Business 결과도 함께 나옴. `\r`/`\t` 정규화 필요 |
| 표시 일치 | ○ | ○ | ○ — 탭은 JS 미동작 시 전체 표시, 동작 시 탭 전환(D-21)이라 일치 위치가 비활성 탭일 수 있음 |

- section title 블록(`Service Summary` 등)은 4건 공통 문구라 검색 가치가 낮다. 포함 여부는 A/B/C와 함께 결정.
- 이번 Phase에서는 A/B/C를 확정하지 않는다 (§16 Q1).

---

## 8. Partner 검색 여부

전제 [데이터, D-22]: 67건 보존 / 화면 표시 40건(Business Line clients 30, Project partner 29, 중복 19) / 미연결 27건 / 상세·archive 없음 / 이름 중복(400/486, 728/1375) 병합 안 함.

| Option | 동작 | 문제점 / 영향 |
|---|---|---|
| A. 검색하지 않음 | Partner 이름은 어디에도 색인하지 않음 | `SC 제일은행`(Partner 표기, 공백 포함)처럼 Partner 이름에만 있는 표기는 Project/Business 결과로도 찾을 수 없다. 단 Project 제목에 `SC제일은행`이 있어 `SC`는 검색됨 |
| B. Partner 이름으로 Project/Business 페이지 검색 | Partner를 독립 결과로 만들지 않고, **Partner 이름을 그 이름이 실제로 표시되는 문서의 필드로 색인** (Project 상세의 `Partner`, Business 상세의 Main Clients) | 결과 = 이미 존재하는 페이지. 미연결 27건은 표시 페이지가 없으므로 자연히 검색되지 않음. 이름 중복 Partner는 각각 연결된 문서로만 나타남(병합 불필요). 고객사명 검색 시 결과 수가 늘어남 (예: `흥국생명` → it-outsourcing, system-integration 추가) |
| C. Partner 결과를 링크 없이 표시 | 결과 목록에 Partner 이름만 표시 | 결과 클릭 대상이 없어 다른 결과와 동작이 다르다. 미연결 27건 표시 여부 결정 필요. 어느 페이지에 나오는지 알 수 없어 사용자에게 의미가 적다. 접근성상 link가 아닌 row 혼재 |
| D. 향후 Partner 페이지 전제 | Partner 결과 → `/partners/{slug}` | 존재하지 않는 URL 생성 — sitemap §10, D-22에 반함. **채택하지 않음** |

- `검색 결과에 존재하는 콘텐츠 = 실제 이동 가능한 페이지` 원칙을 지키는 것은 A, B. B는 "화면에 보이는 텍스트만 검색한다"는 기준과도 일치한다 (Project 상세와 Business 상세는 Partner 이름을 표시한다).
- B를 택해도 `partners.json`과 Phase 8 결정은 바꾸지 않는다. 색인 생성 단계에서 `getPartner()`/`getBusinessClients()`로 이름을 읽기만 한다.
- Project `client`(계약 상대, 예: `LG CNS`, `한국스탠다드차타드은행`)는 Partner와 별개의 Project 필드이며 37건이 Partner 이름과 다르다. Project 검색 필드에 포함할지는 §6(Projects)와 함께 결정.

---

## 9. 검색 결과 URL

| 콘텐츠 | 결과 URL | 존재 확인 |
|---|---|---|
| Company | `/company` | `src/pages/company.astro` |
| Team | `/team/{slug}` (`ceo`, `ito-team`, `si-team`, `infrastructure-team`, `solution-team`, `future-technology-research-center`) | `src/pages/team/[slug].astro` |
| News | `/news/{slug}` (`news-{ID}`, D-17 임시) | `src/pages/news/[slug].astro` |
| Project | `/projects/{slug}` (`project-{ID}`) | `src/pages/projects/[slug].astro` |
| Business Line | `/business/{slug}` | `src/pages/business/[slug].astro` |
| Partner | **없음** — 독립 결과로 만들지 않음 (Option B면 해당 Project/Business URL) | — |

- `[제안]` URL은 색인 생성 시 페이지 route와 같은 함수(slug → path)로 만들고, 단위 테스트로 "모든 결과 URL이 build 산출 페이지에 존재"를 검증한다.
- D-17(News slug)이 바뀌면 색인 URL도 자동으로 따라가도록 slug를 하드코딩하지 않는다.
- 탭/섹션 anchor(`/business/solution#...`)로 연결할지는 TBD (현재 탭에 고정 anchor 없음).

---

## 10. 검색 결과 표시 정보

requirements §10: `title`, `type/category`, `date 또는 year`, `link` 필수. 기존 사이트: 유형 라벨 + 제목 + 게시일.

| 유형 | 유형 라벨 | 제목 | 날짜/연도 | 보조 정보 (데이터 있음) | 요약(excerpt) 후보 |
|---|---|---|---|---|---|
| Company | `COMPANY` (TBD) | `name.ko` (기존 h1은 `Mirae I&Tec`, D-04) | 없음 | — | `introduction.ko` 앞부분 |
| Team | `TEAM` | `nameKo` (+`nameEn`) | 데이터에 날짜 없음 (기존 게시일은 미보존) | CEO: `titleKo` | `introduction` 앞부분 / CEO는 biography 첫 항목 |
| News | `NEWS` (기존 `NEWS&NOTICES`) | `title` | `date` | 908: 출처 | `body` 앞부분 — **908은 본문 표시 금지**(D-18) |
| Project | `PROJECTS` | `title` | `year` 또는 `date`(게시일) — 목록 화면은 Year | Type·Status label, `client` | `overview`(5건 빈 값) |
| Business | `BUSINESS` | `title` | `date`(4건 모두 2024-02-23, 의미 낮음) | — | `summary` |

- `[제안]` 일치 필드 표시(예: "Partner에서 일치")는 결과 이해에 도움이 되나 필수 아님 — TBD.
- 요약은 원문을 자르기만 하고(문자 변경 없음), 검색어 강조는 텍스트 노드 분리 방식으로만 한다 (HTML 삽입 금지).
- 데이터에 없는 정보(카테고리, 작성자, 요약문)는 만들지 않는다.

---

## 11. 검색 구현 방식 후보

전제: Astro `output: static`, 서버 런타임 없음, 호스팅 미정(D-01). 색인 대상 76~143개 문서, 약 67~69KB.

| | Option A — 빌드 시 정적 색인 + 자체 검색 함수 | Option B — 페이지 데이터에서 단순 JS 필터 | Option C — 라이브러리/외부 서비스 |
|---|---|---|---|
| 방식 | build 때 `src/lib/content.ts` 데이터로 정규화한 search document JSON 생성 → `/search` 페이지에서 fetch 후 검색 | `/search` HTML에 전체 데이터를 내장하거나, 각 목록 페이지 DOM을 검색 | Pagefind(빌드 후 HTML 색인), Lunr/Fuse.js(브라우저 색인), Algolia(외부 SaaS) |
| 의존성 | 없음 | 없음 | 패키지 추가 또는 외부 계정/API key |
| 한글 부분 일치 | 직접 구현(정규화 + `includes`) — 요구사항 그대로 제어 | 동일 | 라이브러리별 토큰화 방식에 따름 — 한국어 부분 일치 동작은 **도입 전 검증 필요** (이번 Phase 미검증) |
| 원문 보존 | 색인은 파생 데이터, 원본 JSON 불변 | 동일 | Pagefind는 렌더링된 HTML 기준 → 908 숨김 본문은 자동 제외되나 필드 단위 제어 어려움 |
| 테스트 | Vitest로 검색 함수 단위 테스트 용이 | DOM 의존 | 라이브러리 동작 의존 |
| 규모 적합성 | ○ (수십 KB) | △ (HTML 비대, 재사용성 낮음) | 과함 — 외부 서비스는 비용·key 관리·개인정보 검토 필요 |

- 외부 검색 서비스: **현재 규모에서는 필요하지 않다** `[제안]`.
- 어느 방식이든 JS 미동작 시 정적 사이트는 검색할 수 없다. 기존 사이트의 "JS 없으면 결과 없음처럼 보임" 문제를 반복하지 않도록 `<noscript>`/초기 상태 문구로 명확히 안내해야 한다 (§16 Q9).

---

## 12. 문자열 처리

현재 데이터 기준 시뮬레이션 (정규화 없는 대소문자 무시 부분 일치) [데이터]:

| 검색어 | 결과 | 관찰 |
|---|---|---|
| `CubeOne` / `cubeone` | news-1429 본문, solution 탭 | 대소문자 무시로 충분 |
| `CubeOne™` | 동일 2건 | `™` 그대로 일치. 단 데이터 `CubeOne™` ↔ 검색어 `CubeOne TM` 등은 불일치 |
| `큐브원` | news-1429 본문만 | 한글 표기는 별도 — 동의어 처리 안 함 |
| `SC` | Projects 17, news-908, it-outsourcing 탭, system-integration(Main Clients) | |
| `SC 제일` | Partner 이름 일치(Project 17, system-integration) — Project **제목**(`SC제일은행`)과는 불일치 | 공백 처리 필요 |
| `기업은행` | `IBK기업은행` 포함 일치 | 부분 일치로 해결 |
| `IBK` | Project 6, it-outsourcing 등 | |
| `LG CNS` / `lgcns` | Project client 3건 / 0건 | 공백 제거 비교 시 `lgcns`도 일치 가능 |
| `FIPS-140` | 0건 (데이터는 `FIPS‑140`, U+2011) | 하이픈 변형 정규화 필요 |

짧은 영문 검색어의 부분 일치 false positive [데이터]:

| 검색어 | 영문 단어 내부 일치 (단어 경계 기준이면 제외되는 것) |
|---|---|
| `SI` | `Business`(CEO 약력, project-973), `TSIS`(news-1563, project-406), `Version`(solution) |
| `IT` | `ITO`(Team 3, project-1044), `Digital`(project-982), `Integrity`(solution) |
| `SC` | `SCBK`(project-1223, 1232 name) |
| `ITO` | `competitors`(project-406) |

`[제안]` 정규화 규칙 (검색어와 색인 텍스트에 동일 적용, 원본은 변경하지 않음):

1. Unicode NFKC (`㈜` → `(주)`, 전각 → 반각, `™` → `TM`이 되므로 `™` 처리와 함께 결정)
2. 소문자화
3. `\r`, `\t`, 연속 공백 → 공백 1개
4. 하이픈 변형(U+2010~2015, U+2212) → `-`
5. 공백 처리: 검색어를 공백으로 나눠 **모든 단어 포함(AND)** + 공백 제거 문자열 비교를 함께 적용 (`SC 제일` ↔ `SC제일은행`)
6. 짧은 영문(ASCII) 검색어: 부분 일치 유지 vs 단어 경계 적용 — §16 Q5
7. 형태소 분석, 동의어(`큐브원`↔`CubeOne`, `SC제일은행`↔`한국스탠다드차타드은행`), 오타 보정은 하지 않음
8. 검색어 길이: 최소 1자, 최대 길이 제한(예: 100자) — TBD

---

## 13. 정렬 방식 후보

| 후보 | 내용 | 관찰/데이터 |
|---|---|---|
| 게시일 내림차순 (유형 혼합) | 기존 사이트 FacetWP 1페이지 결과와 같은 방식으로 보임 | Team/Company에는 날짜 데이터가 없음 → 위치 규칙 필요 |
| 유형별 그룹 | Company → Business → Projects → News → Team 등 고정 순서, 그룹 안에서 기존 목록 순서 | 기존 목록 순서는 이미 확정(D-08 Projects, News 날짜순, Team order) — 재사용 가능 |
| 관련도 | 제목 일치 > 이름/요약 > 본문 > Partner/label 순 가중치 | 기준을 임의로 정해야 하므로 승인 필요 |
| 기존 콘텐츠 순서 | 각 목록 화면과 동일 | 유형별 그룹과 결합 가능 |

- 결과 수: `은행` 시뮬레이션(Q1=C, Q2=B, taxonomy label 포함) 기준 38건(Team 1, News 4, Projects 30, Business 3) — pagination 여부(기존 12건/페이지) 또는 유형별 "더 보기" 결정 필요.
- 정렬 기준은 확정하지 않는다 (§16 Q8).

---

## 14. SEO 고려사항

- 현재 `BaseHead.astro`: `noindex` 페이지는 `robots: noindex, follow` + canonical 미출력 — 이미 구현됨.
- `docs/seo.md` §14: 내부 검색 결과 `noindex, follow` 권장. §7 XML Sitemap 포함 목록에 `/search` 없음.
- `docs/sitemap.md` §2 사이트맵 트리에는 `search`가 있음 (페이지 구조 표기) — XML sitemap 포함 여부는 문서 간 표현이 다르므로 Phase 10에서 명확히 한다.
- 후보:
  - `/search`, `/search?q=…` 모두 `noindex, follow`, canonical 없음 (현재 BaseHead 동작)
  - 또는 `/search`(빈 상태)만 canonical `/search` + noindex
- title: `검색 | {SITE_NAME}` 고정, 검색어를 title/description에 넣을지 여부 (넣으면 반드시 escape) — Phase 10.
- 기존 `/?s=` → `/search?q=` 301(query 보존, migration §12)은 호스팅(D-01) 의존 — Phase 11.
- **이번 Phase에서 SEO 정책을 확정하지 않는다.**

---

## 15. 발견된 문제

| # | 구분 | 내용 |
|---|---|---|
| P1 | 신규 사이트 | Header/MobileMenu의 `SEARCH` 링크(`src/data/navigation.ts:45`)가 `/search`를 가리키지만 페이지가 없음 → 현재 build에서 404 (404 페이지도 미구현) |
| P2 | 기존 사이트 | 서버 HTML/JS 미동작 시 모든 검색어가 "검색된 내용이 없습니다" — `SC` 문제의 실제 원인 (§3-3) |
| P3 | 기존 사이트 | 제목만 검색 — Company, Partner, 본문/ACF 필드 미검색 |
| P4 | 기존 사이트 (보안) | 검색어가 escape 없이 서버 HTML·inline script에 삽입됨 (§3-4) |
| P5 | 기존 사이트 | WordPress 기본 검색(REST)과 FacetWP 결과 불일치 |
| P6 | 데이터 | 같은 고객사 표기 변형 (`SC제일은행`/`SC 제일은행`/`한국스탠다드차타드은행`/`SCBK`, `CubeOne™`/`큐브원`) — 원문 유지, 검색 정규화로만 대응 |
| P7 | 데이터 | Business Line 원문의 `\r`, `\t` — 검색·요약 시 정규화 필요 (원본 유지) |
| P8 | 문서 | `docs/sitemap.md` 트리의 `search`와 `docs/seo.md` §7 XML sitemap 목록의 차이 |
| P9 | 문서 | Phase 9 요청서의 Decision 번호 표기가 실제와 다름: 실제 **D-21 = Business Line URL/데이터**, **D-22 = Partner 데이터 범위/표시**. 두 결정 모두 변경하지 않음 |

---

## 16. 사용자 결정 필요 사항

| # | 항목 | 선택지 | 제안 |
|---|---|---|---|
| Q1 | Business Line 검색 범위 | A(title+summary) / B(+description) / C(+tabs) / section title 블록 포함 여부 | C, section title 블록 제외 — Solution 제품명·Infrastructure Cloud가 탭에만 있음 |
| Q2 | Partner 검색 | A(미검색) / B(표시되는 Project·Business 문서의 필드로 색인) / C(링크 없는 결과) | B |
| Q3 | Company 검색 필드 | name, introduction, address / + tel·fax·email | name, introduction, address |
| Q4 | News 908 (rights unknown) 본문 | 색인 제외(title만) / 색인 포함 | 제외 — 화면에 없는 본문으로 일치하면 결과를 설명할 수 없음 |
| Q5 | 짧은 영문 검색어 매칭 | 부분 일치(`SI`→`Business` 포함) / ASCII 단어 경계(`SI`→`SI`, `SI팀`만) | 단어 경계 — 단, 한글과 붙은 경우(`SC제일은행`, `IT아웃소싱`)는 일치 |
| Q6 | Project taxonomy label 색인 | Type/Industry/Status label 포함 / 제외 | 결정 필요 — 포함 시 `ITO` 24건+, `은행` 26건+ (requirements 예시 `ITO`, `SI`, `은행`과 관련) |
| Q7 | Team `relatedProjectsLegacy` 제목 색인 | 포함 / 제외 | 제외 — ITO 팀에 21건, 프로젝트명 검색 시 Team 결과가 중복 증가 |
| Q8 | 결과 정렬 / 분할 | 날짜순 혼합 / 유형별 그룹 / 관련도 + pagination(12, 20) 또는 유형별 더 보기 | 유형별 그룹 + 그룹 안 기존 목록 순서 |
| Q9 | JS 미동작 시 `/search` | 안내 문구 + 주요 목록 링크 / 기타 | 안내 문구 + 목록 링크 |
| Q10 | 결과 표시 | 요약 표시 여부, 일치 필드 표시 여부, 유형 라벨 표기(`NEWS` vs `NEWS&NOTICES`) | 요약 표시, 일치 필드 표시 없음, 라벨은 신규 메뉴명 |
| Q11 | 구현 방식 | 정적 색인 + 자체 검색 / 라이브러리 / 외부 서비스 | 정적 색인 + 자체 검색 (의존성 없음) |

Phase 10/11로 넘기는 항목 (이번 결정 대상 아님): `/search` robots·canonical·title 정책, XML sitemap 포함 여부, `/?s=` → `/search?q=` redirect (D-01, migration §12).

---

## 17. Phase 9 구현을 위한 권장 설계안 `[제안]`

> Q1~Q11의 제안안을 기준으로 한 구조. 결정 결과에 따라 필드 목록만 바뀐다.

### 17-1. 파일 구조

```text
src/lib/search/
  normalize.ts        정규화 함수 (§12) — 검색어/색인 공용, 순수 함수
  documents.ts        content.ts 데이터 → SearchDocument[] 변환 (원본 불변, 읽기 전용)
  match.ts            검색어 파싱(AND), 매칭, 정렬, 요약 추출 — 순수 함수
src/pages/search-index.json.ts   build 시 SearchDocument[] 정적 출력 (endpoint)
src/pages/search.astro           PageHeader + SearchForm + 결과 영역 + EmptyState + noscript 안내 (noindex)
src/components/search/
  SearchForm.astro    GET form (action=/search, name=q, label, role=search)
  SearchResults.astro 결과 row 템플릿 (<template>) / 상태 영역 (aria-live)
src/scripts/search.ts           q 읽기 → index fetch → match → DOM 렌더 (textContent만 사용)
tests/unit/search-*.test.ts     정규화, 매칭, 문서 생성(건수·URL·제외 규칙)
tests/e2e/search.spec.ts        검색 시나리오, 키보드, axe, 390/768/1440
```

### 17-2. SearchDocument (파생 데이터)

```ts
interface SearchDocument {
  id: string;                 // 'projects/project-1572'
  type: 'company' | 'team' | 'news' | 'project' | 'business';
  url: string;                // 실제 route에서 생성 (/projects/project-1572)
  title: string;              // 표시용 원문
  meta?: string;              // 날짜/연도/유형 label 등 표시용 원문
  excerpt?: string;           // 표시용 원문 앞부분 (908 등 표시 금지 본문 제외)
  fields: { name: string; text: string; weight?: number }[]; // 검색용 정규화 텍스트
  order: number;              // 유형 안 기존 목록 순서
}
```

### 17-3. 데이터 흐름

```text
src/data/* (원본, 불변)
  → src/lib/content.ts (기존 접근 계층)
  → src/lib/search/documents.ts (필드 선택 + 정규화, Partner 이름은 getPartner/getBusinessClients로 읽기만)
  → /search-index.json (build 산출물)
  → /search?q= (브라우저) → src/scripts/search.ts → match.ts → 결과 DOM
```

### 17-4. 안전/품질 규칙

- 검색어는 `URLSearchParams`로 읽고 `textContent`로만 출력 (HTML 삽입 금지, P4 재발 방지). input value도 DOM property로 설정.
- 색인에 화면 비표시 데이터(908 본문, 미연결 Partner, review notes, legacy URL/slug, 이미지 파일명)를 넣지 않는다.
- 결과 상태는 `aria-live="polite"`로 건수 안내, 결과 목록은 `<ol>`/링크, heading 계층 유지.
- 단위 테스트: 모든 문서 URL이 실제 route와 일치, 문서 수(Company 1 / Team 6 / News 8 / Projects 57 / Business 4), Partner 독립 문서 0, 908 본문 미포함, `SC`·`SC 제일`·`기업은행`·`CubeOne`·`FIPS-140` 기대 결과.

---

## 18. 구현 결과 (2026-10-02, D-23 확정)

### 18-1. 결정 결과

| # | 결정 | 비고 |
|---|---|---|
| Q1 | C — title, summary, description 블록, tab title/description | section title 블록(`Service Summary`, `어플리케이션운영 서비스`, `Mirae I&Tec Application Outsourcing Framework` 등)은 색인하지 않음 |
| Q2 | B — Partner 이름은 연결된 Project(`partner`)·Business(`clients`) 문서 필드로만 | Partner 독립 문서 0, 미연결 27건 미색인 |
| Q3 | name(ko/en), introduction, address(ko/en) | tel/fax/email 제외 |
| Q4 | 908 본문 제외 (title만) | 화면과 같은 함수 `isNewsBodyWithheld()` (`src/lib/news.ts`) 사용 |
| Q5 | 1~3자 영문/숫자 단어는 영문/숫자 단어 경계 | 4자 이상·한글은 부분 일치 |
| Q6 | Type/Industry/Status label 포함, year 제외 | |
| Q7 | Team Related Projects 제외 | |
| Q8 | 유형 그룹 → 기존 목록 순서, 분할 없음 | 그룹 순서 = 사이트 메뉴 순서 Company → Team → News → Projects → Business |
| Q9 | 안내 문구 | `html:not(.js)`에서만 표시 (Playwright의 JS 비활성화는 `<noscript>`를 렌더링하지 않아 기존 프로젝트 패턴 사용) |
| Q10 | 요약문 없음, 일치 필드 표시 없음 | 결과 row = 제목 + 보조 정보(Project `연도 · Type`, News 날짜, Team 영문명). 유형 라벨은 그룹 heading(`PROJECT 17건` 등) |
| Q11 | 정적 색인 + 자체 검색 | 의존성 추가 없음 |

### 18-2. 설계안(§17)과 달라진 점

- `SearchResults.astro` 대신 결과 DOM은 `src/scripts/search.ts`가 DOM API(`createElement`/`textContent`)로 생성하고, 스타일은 `src/pages/search.astro`의 `.search :global(...)`로 범위를 제한했다.
- SearchDocument에서 `excerpt`, `weight`, `order` 제거 — 요약문 없음, ranking 없음, 순서는 배열 순서. `datetime`(News `<time>`) 추가.
- 공백 차이 처리: 단어 AND 외에 공백을 제거한 검색어와 공백을 제거한 필드 비교를 추가 (`LGCNS` ↔ `LG CNS`).
- 데이터 접근은 `src/lib/content.ts`의 `getSearchDocuments()`를 통한다 (`documents.ts`는 astro:content에 의존하지 않는 순수 함수).
- `Button`이 `type` prop을 받도록 변경 (기본값 `button` 유지) — 검색 제출 버튼에 사용.
- 404 페이지(`src/pages/404.astro`)에 홈 이동 + 같은 SearchForm.

### 18-3. 산출물

- `/search-index.json`: 76문서 (Company 1, Team 6, News 8, Project 57, Business 4), 약 86KB (gzip 약 21KB)
- 검색 결과 건수 (실제 데이터, 단위·E2E 테스트 기준): 기업은행 7 / 은행 37 / IT 21 / SI 31 / SC 19 / CubeOne 2 / Cloud 1 / 흥국생명 6 / 시스템 40 / ITO 31 / 보험 12

### 18-4. 알려진 제약

- section title 블록을 색인하지 않으므로 `Framework` 등 title 블록에만 있는 단어는 Business 결과로 나오지 않는다.
- `IT`는 단어 경계 규칙으로 `ITO`를 포함하지 않는다. `ITO`로 따로 검색해야 한다.
- 동의어(`큐브원` ↔ `CubeOne`, `SC제일은행` ↔ `한국스탠다드차타드은행`)는 처리하지 않는다.

---

## 참고

- 조사 스크립트·원본 응답은 세션 scratchpad에만 저장했고 저장소에는 추가하지 않았다.
- 관련 결정: D-01, D-03, D-07, D-12, D-17, D-18, D-21, D-22 (변경 없음), D-23 (이번 Phase 확정).
