# MRINT Design System

신규 사이트 전체(Home / Company / Team / News / Projects / Business)에 적용하는 공통 디자인 기준.
구현 기준 파일: `src/styles/tokens.css`, `src/styles/base.css`, `src/components/{layout,ui}/*`

---

## 1. 참고자료 범위

| 자료 | 용도 | 비고 |
|---|---|---|
| `design/prototype/` (HTML/CSS/JS, handoff README) | **디자인 참고 (유일한 디자인 자료)** | D-02: 디자인만 반영. 프로토타입 문구/섹션 구성/수치는 사용하지 않음 |
| 기존 사이트 mrint.co.kr | **콘텐츠 원문 / 정보 구조 참고** | 디자인은 복제하지 않음. 레이아웃 관례(제목 좌측·내용 우측, Team 카드 그리드 등)만 참고 |

프로젝트 내 다른 디자인 자료(이미지, Figma, PDF 등)는 없음 (2026-10-01 확인).

---

## 2. 참고자료 분석 (design/prototype 추출)

| 항목 | 프로토타입 | 신규 적용 |
|---|---|---|
| Visual direction | 녹흑(ink) + 오프화이트(paper), 단일 그린 accent, 1px hairline 구조, 직각(radius 0), 에디토리얼 대형 타이포 | 그대로 채택 |
| Typography | Pretendard Variable(본문/제목) + JetBrains Mono(라벨, 숫자, 태그, 대문자) | 채택. mono 최소 12px로 상향 (접근성) |
| Color | ink `#0A110F` / paper `#F4F4F1` / white `#FBFBF9` / muted / accent `oklch(.74 .17 152)` / accent-deep | 채택. accent-deep `#1A7A42`로 보정 (AA 대비) |
| Spacing | section `clamp(96px,12vw,180px)`, pad `clamp(20px,4.2vw,72px)`, gutter 24px | 채택 (pad 최소 16px — 390px 기준) |
| Grid | max 1480px, 12-column, 24px gap | 채택 |
| Header/navigation | fixed 76px, hero 위 투명 → 스크롤 후 blur solid, 밑줄 hover, outlined mono CTA, ≤1100 burger + 전체화면 ink overlay | 채택. solid(기본)/overlay 두 가지. 메뉴는 requirements §3 구조, MegaMenu는 disclosure 패턴 |
| Hero | 전체 높이 ink, canvas 격자, veil gradient, 마스크 슬라이드 업 헤드라인, 하단 상태바 | 구조만 채택 (Home slider). canvas/가짜 상태 표시 미사용 |
| Section layout | eyebrow(6px accent square + mono) → H2(7 cols) + 설명(4 cols), 배경 tone 교차 | 채택. 상세 페이지는 SplitSection(제목 1/3 + 내용 2/3) |
| Card | hairline 셀, 상단 번호/태그, glyph, hover 시 ink 패널이 아래에서 올라옴 | Card 컴포넌트로 채택. 카드 전체 링크 1개 |
| Image treatment | 래스터 이미지 없음 (CSS glyph, canvas) | 신규 규칙: §5.6 (단색 처리 + hover 컬러, 확인 전 placeholder) |
| Hover interaction | 밑줄 scaleX, 화살표 확장(18→28px), row indent, ink 패널 | 채택 (transform/opacity 위주) |
| Animation | `.rv` reveal(28px up, 1s, stagger 80ms), counter, marquee, canvas | reveal만 선택적. counter/marquee/canvas 미사용 (가짜 수치, WCAG 2.2.2) |
| Mobile layout | ≤1100 1열 전환, ≤760 카드 1열, 64px header, row → 2줄 카드 | 채택 (breakpoint 767/1100) |
| Page transition | 없음 (단일 페이지) | 신규: CSS cross-document View Transition (JS 없음, reduced-motion 시 끔) |
| Footer | ink 배경, 로고 + 메뉴, 대형 워드마크(ink-3), mono 하단 행 | 채택. 연락처는 company 데이터가 있을 때만. 대형 워드마크는 2026-10-02 제거 (사용자 결정) |

---

## 3. Design Direction — "Precision Editorial"

기존 미래아이엔텍 콘텐츠(사업영역 4, 프로젝트 57, 뉴스 8, 팀 6)는 **문장보다 목록/사실 데이터가 많다.** 따라서 장식보다 **정보 구조를 시각화**하는 방향을 택한다.

1. **구조가 곧 장식** — 그림자/라운드 대신 1px hairline, ink top rule, 12-column 정렬로 질서를 만든다.
2. **단색 + 한 가지 accent** — ink/paper 모노톤 위에 로고 슬래시 그린만 포인트로 쓴다. 상태/구분은 색 + 텍스트.
3. **mono = 데이터** — 연도, 구분(type), 번호, 날짜, 라벨은 JetBrains Mono 대문자. 본문과 데이터가 시각적으로 분리된다.
4. **원문 우선** — 레이아웃은 문구가 짧거나 없어도 성립해야 한다. 카피를 만들어 빈칸을 채우지 않는다.
5. **이미지 비의존** — 이미지 권리 확인 전에도 placeholder로 동일한 비율/레이아웃을 유지한다.
6. **접근성 기본값** — 대비 AA, focus-visible, 키보드, reduced-motion을 컴포넌트 기본 동작으로 둔다.

---

## 4. Tokens

`src/styles/tokens.css`가 단일 기준이다.

### 4.1 Color

| Token | 값 | 용도 |
|---|---|---|
| `--ink` | `#0A110F` | 어두운 배경 / 기본 텍스트 |
| `--ink-2` / `--ink-3` | `#101916` / `#18231F` | placeholder, 대형 워드마크 |
| `--paper` / `--paper-2` / `--white` | `#F4F4F1` / `#EAEBE6` / `#FBFBF9` | 밝은 배경 |
| `--muted` / `--muted-d` | `#5E6763` / `#8C9792` | 보조 텍스트 (밝은/어두운 배경) |
| `--line` / `--line-d` | 12% / 14% alpha | hairline |
| `--accent` | `#50D682` | 강조 (어두운 배경 텍스트, 버튼 배경) |
| `--accent-deep` | `#1A7A42` | 밝은 배경 위 강조 텍스트 / focus (≈5.1:1) |
| `--logo-accent` | `#39B54A` | 로고 슬래시 전용 |

**Tone**: `.tone-white` / `.tone-paper` / `.tone-ink`가 semantic 변수(`--surface`, `--text`, `--text-muted`, `--border`, `--border-strong`, `--accent-text`, `--focus-color`)를 재정의한다. 컴포넌트는 semantic 변수만 사용한다.

### 4.2 Typography

| 역할 | 크기 | 굵기 / 자간 |
|---|---|---|
| Display (Home slide) | `clamp(40px, 6.4vw, 112px)` | 700 / -0.045em |
| H1 (PageHeader) | `--fs-h1` `clamp(38px, 5vw, 80px)` | 700 / -0.045em |
| H2 (section) | `--fs-h2` `clamp(32px, 4.4vw, 68px)`, SplitSection `clamp(24px, 2.2vw, 34px)` | 700 / -0.03~-0.04em |
| H3 (card) | `--fs-h3` `clamp(22px, 2vw, 30px)` | 700 / -0.035em |
| Lead | `--fs-lead` `clamp(19px, 1.6vw, 24px)` | 500 |
| Body | 16px (모바일 포함), 본문 강조 18px | 400~600 / -0.01em, line-height 1.7~1.8 |
| Label (mono) | 12px, uppercase, 0.06~0.08em | 400~500 |

한국어 본문은 `word-break: keep-all`.

### 4.3 Spacing / Grid / Breakpoints

| 항목 | 값 |
|---|---|
| Container | max 1480px, 좌우 `--pad` `clamp(16px, 4.2vw, 72px)` |
| Grid | 12 columns, gap `--gutter` 24px |
| Section | `--space-section` (default), `--space-section-compact` |
| Header | 76px (≤767: 64px) |
| Breakpoints | mobile ≤767 / tablet ≤1100 / desktop ≥1101 — 검수 390 / 768 / 1440 |
| Touch target | 44px 이상 |

---

## 5. Patterns

### 5.1 Page header
Breadcrumb(mono) → eyebrow(선택) → H1 → 설명(선택, 원문이 있을 때만). 페이지당 H1 1개.

### 5.2 Section
- **Section head**: eyebrow + H2 + 설명 (목록형 페이지)
- **SplitSection**: 좌 1/3 H2(desktop sticky) + 우 2/3 내용, ≤1100 1열 (상세 페이지: Company, Team, Business, Project)
- 배경 tone 교차는 콘텐츠 구분이 필요할 때만 사용

### 5.3 Card
- hairline border, 상단 meta(mono eyebrow + badge), 제목 H2/H3, 내용
- href가 있으면 **제목 링크 하나**가 카드 전체를 덮는다 (탭 1회, 접근 가능한 이름 = 제목)
- hover/focus: ink 패널이 아래에서 올라오고 텍스트 반전

### 5.4 List row (Projects, Related Projects, News)
연도/날짜(mono) · 제목 · 메타 · 구분 badge. 데스크톱 1행 grid, 모바일 2줄. hairline 구분.

### 5.5 Badge
StatusBadge — 항상 텍스트 표시 (neutral / outline / strong / accent).

### 5.6 Image treatment
- **권리 확인 전**: `ImagePlaceholder` (원본 비율 유지, `aria-hidden`), 실제 이미지/외부 URL 로드 금지
- **확인 후**: `ResponsiveImage` (AVIF/WebP, srcset, width/height, lazy; LCP만 priority)
- **단색 처리**: 인물/팀 이미지는 `.media-mono` — 기본 grayscale, 링크 카드 hover/focus 시 컬러 (기존 사이트 Team의 흑백→컬러 관례를 CSS로 대체, reduced-motion 시 전환 없음)
- 이미지 안의 텍스트에 정보를 의존하지 않는다 (WCAG 1.4.5). 이름/제목은 항상 HTML 텍스트로 표시

### 5.7 Motion
- easing `--ease: cubic-bezier(.2,.7,.1,1)`, 0.3~0.6s, transform/opacity 위주
- 자동 회전/무한 marquee/카운트업 사용 안 함
- `prefers-reduced-motion: reduce` → 전환 0.01ms

### 5.8 Page transition
CSS cross-document View Transition (`@view-transition { navigation: auto; }`) — JS 없음, 미지원 브라우저는 일반 이동, reduced-motion 시 비활성.

### 5.9 Focus / Accessibility
`:focus-visible` 3px outline (`--focus-color`, tone별 대비), skip link, 메뉴/패널/dialog ARIA, 링크는 밑줄 또는 명확한 형태로 구분.

---

### 5.10 구현 주의 (Astro scoped CSS)
Astro 7의 scoped style은 속성 방식이다. 부모 컴포넌트가 `class`를 넘겨도 자식 컴포넌트 루트에는 부모의 scope 속성이 붙지 않는다.
자식(예: Card) 내부 요소를 부모(예: TeamCard)에서 조정할 때는 고유 클래스 기준 `:global(.team-card.card .card__title)` 형태를 사용한다.

---

## 6. Page templates

| 페이지 | 구성 | 주요 컴포넌트 |
|---|---|---|
| Home `/` | 메인 카드 4개 full-screen slider (원문 type/title/date) | HomeSlider, ImagePlaceholder |
| Company `/company` | PageHeader → SplitSection INTRODUCTION / CONTACT US | CompanyIntro, ContactInfo, LocationMap |
| Team `/team` | PageHeader → CEO 카드 → 팀 카드 그리드(4/2/2열, 2:3 portrait) | TeamCard(Card), ImagePlaceholder |
| Team detail `/team/{slug}` | PageHeader(이름 ko/en, 역할) → SplitSection (Team Introduction / Main Functions / Key Capabilities 또는 CEO 약력) → Related Projects 목록 | TeamDetail, RelatedProjectList |
| News `/news`, `/news/{slug}` | 목록 row + SidePanel(JS) / 상세 페이지 | NewsList, SidePanel |
| Projects `/projects`, `/projects/{slug}` | 필터 바 + 목록 row(모바일 카드) / 상세 SplitSection + meta(dl) | ProjectFilter, ProjectTable, ProjectMeta |
| Business `/business`, `/business/{slug}` | 카드 4개 / 상세 SplitSection(섹션 종류별) + Main Clients | BusinessCard, ClientLogoGrid |
| Search / 404 | PageHeader + SearchForm + 결과 row / EmptyState | SearchResults, EmptyState |
