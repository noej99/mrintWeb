# Handoff: Mirae I&N Tech (미래아이엔텍) Corporate Website

## Overview
A single-page corporate homepage redesign for Mirae I&N Tech, a Korean financial IT company (SI, ITO/SM, infrastructure, and solutions). The page should read as a premium, trustworthy technology partner to banks, insurers, and other financial institutions. It has 7 sections: Hero, About, Business Areas, Core Competencies, Project Experience, Technology & Innovation (with Careers), and Contact. There is also a sticky header, a mobile menu, and a footer.

## About the Design Files
The files in this bundle are **design references created in HTML**. They are working prototypes that show the intended look and behavior, not production code to ship as-is. Recreate them in the target codebase's environment (e.g. Next.js/React, Vue/Nuxt, or a CMS theme such as WordPress, which the current site runs on) using its established patterns. If no environment exists yet, a static-first framework such as Next.js or Astro is recommended. The design has no backend requirements beyond content management for the project list.

## Fidelity
**High-fidelity.** Colors, typography, spacing, motion, and copy are final-intent. Recreate them pixel-accurately.

---

## Global Layout
- Container: `max-width: 1480px`, horizontal padding `--pad = clamp(20px, 4.2vw, 72px)`, centered.
- 12-column CSS grid with a `24px` gap is used for editorial layouts.
- Section vertical padding: `clamp(96px, 12vw, 180px)`.
- **No rounded corners anywhere** (radius 0), except small circular dots. Structure comes from 1px hairlines (`--line`) and 1px solid ink top rules on grids.
- Korean text uses `word-break: keep-all`.

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0A110F` | Primary dark bg / text (green-black) |
| `--ink-2` | `#101916` | Alt dark |
| `--ink-3` | `#18231F` | Footer giant wordmark |
| `--paper` | `#F4F4F1` | Light bg (Business, Projects) |
| `--paper-2` | `#EAEBE6` | Alt light |
| `--white` | `#FBFBF9` | Light bg (About, Competency, Contact), solid header |
| `--muted` | `#5E6763` | Secondary text on light |
| `--muted-d` | `#8C9792` | Secondary text on dark |
| `--line` | `rgba(10,17,15,.12)` | Hairlines on light |
| `--line-d` | `rgba(244,244,241,.12)` | Hairlines on dark |
| `--accent` | `oklch(0.74 0.17 152)` ≈ `#50D682` | Brand green, taken from the mrint logo slash |
| `--accent-deep` | `oklch(0.52 0.13 152)` ≈ `#1F8A4C` | Accent text on light bg |

Section background rhythm: Hero `ink` → About `white` → Business `paper` → Competency `white` → Projects `paper` → Technology `ink` → Contact `white` → Footer `ink`.

### Typography
- Sans: **Pretendard Variable** (CDN: `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`)
- Mono: **JetBrains Mono** 400/500 (Google Fonts), used for eyebrows, labels, numbers, and tags. Always uppercase, `letter-spacing: .04–.08em`, 10.5–12px.
- Body: 16px (15px on mobile), line-height 1.7, letter-spacing -0.01em.

| Role | Size | Weight | LH | Tracking |
|---|---|---|---|---|
| Hero H1 | `clamp(44px, 7.6vw, 128px)` | 700 | 1.08 | -0.045em |
| Section H2 | `clamp(34px, 4.4vw, 68px)` | 700 | 1.16 | -0.04em |
| About H2 | `clamp(38px, 5vw, 80px)` | 700 (the second phrase is 300 + muted) | 1.14 | -0.045em |
| Contact H2 | `clamp(40px, 6.6vw, 112px)` | 700 / 300 dim | 1.1 | -0.05em |
| Fact number | `clamp(40px, 4.6vw, 72px)` | 600, tabular-nums | 1.1 | -0.05em |
| Card H3 | `clamp(24px, 2vw, 30px)` | 700 | 1.25 | -0.035em |
| Lead | `clamp(19px, 1.6vw, 24px)` | 500 | 1.7 | -0.025em |

### Eyebrow pattern
A 6×6 accent square, a 12px gap, then mono uppercase text, e.g. `01 — About Mirae I&N Tech`.

### Motion
- Easing: `--ease: cubic-bezier(.2,.7,.1,1)`.
- Reveal (`.rv`): opacity 0 → 1 and translateY 28px → 0 over 1s. Stagger with 80ms delays (`.d1`–`.d5`). Triggered by IntersectionObserver (threshold .15, rootMargin -40px bottom), once.
- All motion is disabled under `prefers-reduced-motion`.

---

## Sections

### Header
- Fixed, 76px tall (64px on mobile). It is transparent with paper text over the hero.
- After scrolling past 85% of the viewport height it becomes `rgba(251,251,249,.92)` with a 14px backdrop blur, a bottom hairline, and ink text.
- Past 100vh it hides when scrolling down and reappears when scrolling up (translateY -100%).
- Logo: the "mrint" wordmark in 900 weight at 26px, with a skewed accent bar replacing the "i". This is a placeholder: **replace with the official SVG logo.** It is followed by "미래아이엔텍" at 13px/600 with a 1px left divider.
- Nav: 회사소개, 사업영역, 핵심역량, 사업실적, 인재채용, and Contact (outlined mono button that fills with accent on hover). Links are 15px/500. On hover, an underline scales in from the left.
- ≤1100px: the nav is replaced by a 2-line burger, which opens a fullscreen ink overlay with a numbered list (28px/600) and contact info.

### 01 Hero
- Full viewport height on an `ink` background.
- **Canvas:** a perspective lattice (16×10 nodes; 9×14 on mobile). About 14% of nodes are raised "pillars" with accent gradient stems and square caps. Accent "packets" with fading tails travel along the edges. The lattice slowly waves, and mouse position lightly rotates and tilts it. It is centered at x=66% on desktop and 50% on mobile. The loop pauses when the canvas is off-screen.
- Veil gradients darken the left side and the bottom so the text stays readable.
- Content: eyebrow "Mirae I&N Tech — Financial IT Partner since 2003", then H1 "금융의 미래를 / **연결**하는 기술" ("연결" in accent). Each line is masked and slides up (1.2s, second line +120ms).
- Sub copy (max 520px, 72% paper) fades in at +0.5s: "금융 IT의 깊이 있는 경험과 기술력을 바탕으로 시스템 구축부터 운영까지, 기업의 디지털 혁신을 함께합니다."
- Buttons: 56px tall, square corners. Primary "사업영역 보기" uses the accent fill. Ghost "사업실적" has a 30% paper border. Each has an arrow that extends from 18 to 28px on hover.
- Bottom status bar: 4 cells separated by hairlines. Pulsing accent dot + "System Status Operational", "Est. 2003", "SI · ITO · Infra · Solution", and "Seoul, KR" with a live Asia/Seoul clock. On mobile only the first 2 cells show.

### 02 About (`#about`)
- 12-column grid. Left (cols 1–6): eyebrow and H2 "기술을 넘어, / 신뢰를 설계합니다." Right (cols 8–12, offset down by up to 120px): lead paragraph and a muted paragraph.
- Facts row: 4 columns under a 1px ink top rule with hairline dividers. The values are Established 2003, Business Lines 04, Organization 05 Units, and Recent Projects 21. Numbers count up with ease-out cubic over 1.4s when visible, zero-padded to 2 digits.
- Organization: label on the left, and on the right 5 columns: ITO 팀, SI 팀, 인프라 팀, 솔루션 팀, 미래기술연구소, each with its English name in mono. The layout is 3 columns at tablet and 2 on mobile.

### 03 Business Areas (`#business`)
- Section head: eyebrow, H2 on cols 1–7, and a description on cols 9–12.
- 3×2 grid (2 columns at tablet, 1 on mobile) with hairline cell borders and an ink top rule. Cells are at least 400px tall with 32px padding.
- Each cell contains: number (mono), tag chip (mono, 1px border), a 64×64 abstract glyph built from CSS primitives (squares, bars, circle, and cross, each with one accent element), a small English mono label above a Korean H3, and a description (max 34ch).
- **Hover:** an ink panel scales up from the bottom (0.6s) and the text turns paper. The number turns accent, and each glyph animates: the square rotates 45°, bars shift ±10px, the orbit dot spins 360° over 1.6s, a bar grows, a block translates, or the diamond rotates 225° and scales 1.5×.
- The 6 areas are Financial IT/금융 IT, System Integration/시스템 통합, System Management/시스템 운영, IT Consulting/IT 컨설팅, Enterprise Solutions/엔터프라이즈 솔루션, and Digital Transformation/디지털 전환. Copy is in the HTML.

### 04 Core Competencies (`#competency`)
- Left sticky column (cols 1–4, top 120px) holds H2 "멈추지 않는 / 시스템을 위한 / 다섯 가지 원칙". The right side (cols 6–12) is a numbered list under an ink rule.
- Each item has a 64px number column (mono, accent-deep), an H3 with an English mono suffix, a paragraph, and optional chips (13px, 1px border).
- Item 04 has an **industry breakdown bar**: a 44px-tall flex bar whose segments are proportional to project counts. From left to right: 은행 `#0A110F`, 보험 `#3C4843`, 저축은행 `#7A8680`, 기타 금융 accent-deep, 제조·서비스 accent. Segments scale in from the left with 80ms stagger. A legend with counts sits below, labeled "N = 21 · 2024–2026".
- Item 05 has a **5-step lifecycle**: 컨설팅, 설계, 구축, 운영, 고도화. An accent underline draws in sequentially with 150ms stagger. It stacks vertically on mobile.

### 05 Project Experience (`#projects`)
- Filter bar: buttons 전체 / SI / ITO / Solution, each with a zero-padded count in a superscript. The active button is ink-filled. A counter on the right reads "08 / 21 PROJECTS".
- List rows use the grid `90px | 1fr | 140px | 110px | 40px` and show year, title, industry, category chip, and an arrow.
- Category chip styles: SI is ink-filled, ITO is ink-outlined, Solution is accent-filled.
- Row hover: an ink top line draws in, the row indents 12px, and the arrow fades in.
- The first 8 rows show by default. The "전체 실적 보기" / "접기" button toggles the rest.
- Mobile rows are 2-row cards with year and chip on top, then title and industry.
- **Main Clients:** two marquee rows running in opposite directions (60s and 70s). Each name is separated by an accent diamond, and the animation pauses on hover. **The grid columns must use `minmax(0, …)` so the max-content track doesn't overflow the page.**

### 06 Technology & Innovation (`#tech`, dark)
- Text on cols 1–5, with "끊김 없이" in the H2 set in accent. A square canvas sits on cols 6–12 (max 720px).
- **Canvas:** a rotating Fibonacci-sphere point cloud (900 points) with depth-based opacity and accent "latitude bands". Three tilted orbit rings each carry a square satellite (the first one accent). Crosshair ticks and mono readouts ("LAT …", "SYNC 100.000%") complete it. The loop only runs while in view.
- Feature row: 4 columns (DB 암호화 CubeOne™, Daemonless API, 클라우드 전환, MIRAE_IN) with mono accent labels.
- **Careers block** (`#careers`): a 1px bordered panel with a label, the H4 "금융의 내일을 만드는 엔지니어를 기다립니다.", and copy with a link to contact.

### 07 Contact (`#contact`)
- Large H2 "미래를 위한 / 기술 파트너, / 미래아이엔텍" (the middle line is 300 weight and muted).
- A row with the sub copy and an 80px-tall ink button, "프로젝트 문의하기" (`mailto:mrint01@mrint.co.kr`), which fills with accent on hover. It is full width on mobile.
- Info grid of 4 columns under an ink rule: Address (서울시 중구 수표로 23, 1001호, 1101호 / 23 Supyo-ro, Jung-gu, Seoul), Tel 02-557-5267, Fax 02-557-5268, Email mrint01@mrint.co.kr.

### Footer
- Ink background: logo and nav links, a giant `ink-3` wordmark (`clamp(90px, 21vw, 360px)`), then a bottom row with copyright and "대표이사 김학연" in mono 11px.

---

## Responsive Breakpoints
- **≤1100px:** burger nav; all 12-column splits collapse to full width; Business grid becomes 2 columns; competency side is no longer sticky; features become 2 columns; contact info becomes 2 columns.
- **≤760px:** header 64px; Korean logo text hidden; hero veil becomes a bottom-weighted gradient; facts become 2 columns; Business grid becomes 1 column; project rows stack; features and contact info become 1 column.

## State Management
- `filter`: `'전체' | 'SI' | 'ITO' | 'Solution'`, defaulting to `'전체'`.
- `expanded`: boolean, reset to false when the filter changes.
- `menuOpen`: mobile menu; the class is set on `body`.
- Header `solid` / `hide` flags are derived from scroll position and direction.
- **Data:** the project list is currently hard-coded in `site.js` (`PROJECTS`: year, title, industry, category). In production it should come from the CMS or projects API (the current site already has a projects post type). The industry bar and filter counts are computed from this data.

## Content Integrity
All projects, clients, service descriptions, and contact details come from the company's current public website (mrint.co.kr). **Do not add clients, projects, or statistics** that the company has not verified. The "IT Consulting" and "Digital Transformation" business areas are regroupings of existing Infrastructure and Cloud content, so confirm the copy with the client.

## Assets
- **Logo:** a text placeholder. Obtain the official SVG from the client.
- No raster images. All visuals are CSS primitives or canvas code.
- Fonts: Pretendard (OFL) and JetBrains Mono (OFL).

## Files
- `Mirae INT Website.html` — markup and all copy
- `site.css` — tokens, layout, responsive rules, and hover/motion
- `site.js` — header behavior, clock, hero and tech canvases, project data/filter/render, industry bar, marquee, reveals, and counters
