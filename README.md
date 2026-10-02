# mrint.co.kr 리뉴얼

(주)미래아이엔텍 기업 홈페이지 리뉴얼 프로젝트. 작업 규칙은 [CLAUDE.md](CLAUDE.md), 요구사항은 [docs/](docs/) 참조.

## 요구 환경

- Node.js 24 LTS

## 명령

```bash
npm install
npx playwright install chromium   # 최초 1회

npm run dev        # 개발 서버 (http://localhost:4321)
npm run build      # 정적 빌드 → dist/
npm run preview    # 빌드 결과 확인
npm run check      # Astro/TypeScript 타입 검사
npm run test       # 단위 테스트 (Vitest)
npm run test:e2e   # E2E + 접근성 (Playwright + axe), build 후 실행
npm run test:all   # check → test → build → test:e2e
```

## 배포 (GitHub Pages 미리보기)

`main`에 push하면 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)이 `npm run build` 결과(`dist/`)를 GitHub Pages에 배포한다. (https://noej99.github.io/mrintWeb/)

- 저장소 Settings → Pages → Build and deployment → Source: **GitHub Actions** (Deploy from a branch이면 Jekyll 빌드가 실행되어 실패한다)
- 하위 경로 배포를 위해 workflow가 `ASTRO_SITE`, `ASTRO_BASE`를 지정한다. 지정하지 않은 로컬/production 빌드는 `https://mrint.co.kr`, base 없음.
- 내부 링크는 `src/lib/url.ts`의 `withBase()`를 거쳐 출력한다. `Link`/`Button`/`Card`/`Breadcrumb`/`Pagination`과 메뉴 컴포넌트는 내부에서 처리하므로, `<a href>`를 직접 쓸 때만 `withBase()`로 감싼다.

```bash
# 로컬에서 GitHub Pages와 같은 경로로 빌드 (Git Bash는 MSYS_NO_PATHCONV=1 필요)
ASTRO_SITE=https://noej99.github.io ASTRO_BASE=/mrintWeb npm run build
```

## 디렉터리

```text
docs/               요구사항, 사이트맵, 아키텍처, SEO, 마이그레이션, 결정 기록, 고객 확인 checklist
design/prototype/   디자인 프로토타입 (HTML/CSS/JS, handoff README) — 참고용, 삭제 금지
src/data/           콘텐츠 데이터 (WordPress 원본에서만 이관)
src/schemas/        zod 스키마
src/lib/            데이터 접근 계층, 유틸리티
src/pages/          라우트
tests/unit/         Vitest
tests/e2e/          Playwright, axe-core
```
