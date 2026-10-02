# src/data

콘텐츠 데이터 디렉터리. 스키마: `src/schemas/*`, collection 정의: `src/content.config.ts`.

## 원칙

- 데이터는 **기존 WordPress 원본에서만** 이관한다. 임의 작성 금지. (CLAUDE.md §3, §4.2)
- 오탈자로 의심되는 문구도 원문을 유지하고 `review.status: "needs-confirmation"` + `review.notes`로 표시한다.
- 페이지/컴포넌트는 이 디렉터리를 직접 읽지 않고 `src/lib/content.ts`를 통해 접근한다.

## 구조

| 경로 | collection | 형식 | 예상 건수 |
|---|---|---|---:|
| `projects/*.json` | projects | 1파일 1건 (slug `project-{legacyId}`) | 57 |
| `news/*.json` | news | 1파일 1건 (본문은 문단/목록 블록) | 8 |
| `team/*.json` | team | 1파일 1건 (기존 Markdown 기호는 구조로 변환) | 6 |
| `business/*.json` | business | 1파일 1건 (slug 4종 고정, ACF contents 블록 원문) | 4 |
| `company/*.json` | company | 1파일 (단일 항목) | 1 |
| `partners.json` | partners | 배열, 항목마다 고유 `id` (`partner-{legacyId}`) | 67 (화면 표시 40, 미연결 27은 데이터로만 보존) |
| `taxonomies.json` | taxonomies | 배열, 항목마다 고유 `id` (`{group}-{key}`) | 27 |

- glob collection의 entry id는 데이터의 `slug` 값이다. slug가 중복되면 빌드가 실패한다.
- `legacyId` / `legacyUrl`에는 기존 WordPress post ID와 URL을 기록한다. (redirect 매핑 기준)

## 공통 필드

| 필드 | 설명 |
|---|---|
| `slug` | lowercase 영문 kebab-case. 한글/숫자만으로 된 slug 금지 |
| `order` | 표시 순서 (선택) |
| `legacyId`, `legacyUrl` | 기존 사이트 매핑 |
| `review` | `{ status: original \| needs-confirmation \| confirmed, notes: [{ field, note }] }` |
| `seo` | `{ title?, description?, status: draft \| approved }` — approved만 배포에 사용 |
| `image` | `{ src, alt, license: unknown \| confirmed, aiGenerated: unknown \| yes \| no, credit? }` |
