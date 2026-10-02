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
