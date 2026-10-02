# MRINT Website Renewal Requirements

## 1. 프로젝트 개요

### 1.1 목적

기존 `mrint.co.kr` 기업 홈페이지를 기반으로 콘텐츠를 보존하면서 정보 구조, UI/UX, SEO, 접근성, 성능 및 기능 문제를 개선한 신규 홈페이지를 구축한다.

### 1.2 기존 사이트

- URL: https://mrint.co.kr/
- CMS: WordPress 6.6.9
- Theme: mrint

### 1.3 콘텐츠 규모

| 콘텐츠 | 수량 |
|---|---:|
| Business Line | 4 |
| Projects | 57 |
| News & Notices | 8 |
| Team | 6 |
| Partners | 67 |

---

## 2. 핵심 요구사항

### REQ-001 콘텐츠 보존

기존 사이트의 주요 콘텐츠를 신규 사이트에 유지한다.

대상:

- 회사소개
- Team
- News & Notices
- Projects
- Business Line
- Project detail
- Team detail
- News detail
- Business Line detail

### REQ-002 콘텐츠 원문 우선

고객 확인 전까지 기존 문구를 임의로 수정하지 않는다.

오탈자로 의심되는 항목도 원문을 유지한다.

---

## 3. Global Navigation

다음 구조를 유지한다.

```text
COMPANY
 ├─ Mirae I&Tec
 ├─ Team
 └─ News & Notices

BUSINESS
 ├─ Projects
 └─ Business Line

SEARCH
```

COMPANY와 BUSINESS는 그룹 label이며 독립적인 링크가 아니다.

---

## 4. Main Page

현재 메인에는 4개의 horizontal cards가 존재한다.

1. IT OUTSOURCING
2. SYSTEM INTEGRATION
3. IBK기업은행 정보시스템 운영
4. 흥국생명 IT 어플리케이션 유지보수

기존 4개 콘텐츠는 유지한다.

추가 콘텐츠는 고객 승인이 있을 경우에만 추가한다.

가능한 추가 영역:

- Company introduction
- Business summary
- Latest News
- Project highlight
- Contact CTA

고객 콘텐츠가 없으면 임의 작성하지 않는다.

---

## 5. Company

신규 URL:

```text
/company
```

기존 `/mirae/` 콘텐츠를 이전한다.

필수 콘텐츠:

- 회사 소개
- 회사 이미지
- 주소
- 전화
- 팩스
- 이메일
- 지도

추가 가능한 콘텐츠:

- History
- Vision
- Mission
- CEO Greeting
- Certifications

고객 원문 제공 시에만 추가한다.

---

## 6. Team

URL:

```text
/team
/team/{slug}
```

대상 6건:

1. CEO
2. ITO Team
3. SI Team
4. Infrastructure Team
5. Solution Team
6. Future Technology Research Center

Team 목록:

- 이미지
- 한국어 이름
- 영어 이름
- 직책

Team detail:

- Team Introduction
- Main Functions
- Key Capabilities
- Related Projects

기존 Markdown 문법이 화면에 노출되지 않도록 정상적인 HTML 구조로 변환한다.

---

## 7. News

URL:

```text
/news
/news/{slug}
```

현재 뉴스 8건을 유지한다.

목록:

- category
- date
- title

상세:

- category
- date
- title
- representative image
- body

기존 right-side panel UX는 신규 디자인에서도 유지하거나 동일한 정보 접근성을 제공한다.

---

## 8. Projects

URL:

```text
/projects
/projects/{slug}
```

57개 프로젝트를 이관한다.

### 필터

기본:

- Type
- Industry
- Status

Year 필터는 고객 결정 후 적용한다.

### 목록 정보

- Title
- Year
- Industry
- Type
- Status

모바일에서는 필요한 정보를 우선순위에 따라 표시한다.

### 상세

- Year
- Title
- Representative Image
- Type
- Status
- Name
- Period
- Client
- Project Overview
- Description
- Related Projects

기존 History 중복 출력 문제를 제거한다.

H1/H2 중복도 제거한다.

---

## 9. Business Line

URL:

```text
/business
```

4개 사업영역을 유지한다.

```text
/business/it-outsourcing
/business/system-integration
/business/infrastructure
/business/solution
```

### IT OUTSOURCING

- Service Summary
- Application Operations
- Application Outsourcing Framework
- Service Features
- Main Clients

### SYSTEM INTEGRATION

- Service Summary
- Main Clients

### INFRASTRUCTURE

- Service Summary
- Service Features
- Main Clients

### SOLUTION

- Service Summary
- Service Features
- Main Clients

사업별 section 구조가 다른 것은 기존 콘텐츠 특성을 반영하되 공통 UI 컴포넌트를 최대한 재사용한다.

---

## 10. Search

신규 URL:

```text
/search?q={query}
```

검색은 실제 콘텐츠를 대상으로 동작해야 한다.

검색 대상:

- Projects
- News
- Team
- Business Line
- Company

검색어 예:

```text
SC
은행
ITO
SI
```

기존 사이트에서 `SC` 검색 결과가 나오지 않는 문제를 해결한다.

검색 결과에는:

- title
- type/category
- date 또는 year
- link

를 표시한다.

---

## 11. 404

404 페이지에는 개발용 문구를 노출하지 않는다.

삭제:

```text
index page 입니다.
```

대신:

- 404
- 페이지를 찾을 수 없습니다.
- 홈으로 이동
- 검색

을 제공한다.

---

## 12. Mobile

기준 viewport:

```text
390px
```

요구사항:

- 가로 스크롤 없음
- 햄버거 메뉴
- 충분한 글자 크기
- 메뉴 contrast 확보
- 필터 사용 가능
- 카드형 콘텐츠
- 이미지 responsive

실제 iOS/Android 기기 테스트는 별도 QA로 수행한다.

---

## 13. Accessibility

필수:

- 모든 콘텐츠 이미지 alt
- 장식 이미지 alt=""
- 충분한 contrast
- 키보드 navigation
- visible focus
- heading hierarchy
- semantic HTML
- modal/panel keyboard control
- mobile menu accessibility
- form label

---

## 14. Performance

필수:

- WebP/AVIF
- responsive images
- lazy loading
- image dimension 지정
- 필요한 페이지에서만 script 로드
- Naver Map 조건부 로딩
- JS 최소화
- CSS 최적화

---

## 15. Content Validation

다음 항목은 고객 확인 필요:

- 농협은행 `외축환` → `외국환`
- KakaoPay `납무` → `납부`
- 프로젝트 기간
- 프로젝트 status
- Taekwang 11개 계열사 표기
- Heungkuk Life 항목 개수
- Client naming
- Nike Korea type
- Solution 성능 수치
- Infrastructure의 GDPR/HIPAA 관련 문구
- 이미지 라이선스
- AI 이미지 사용권
- 뉴스 외부 기사 재사용 권리

확정 전에는 기존 원문을 유지한다.

---

## 16. Security

신규 사이트가 WordPress 기반이 아니라면 불필요한 WordPress 노출을 제거한다.

특히:

- WordPress version
- REST API
- user sitemap
- wp-json
- WordPress generator metadata

등을 외부에 불필요하게 노출하지 않는다.

---

## 17. Legal

개인정보처리방침은 고객 원문 제공 여부를 확인한다.

문의 form을 추가하는 경우 개인정보 수집/이용 관련 고지가 반드시 필요하다.

---

## 18. Acceptance Criteria

페이지별 다음을 모두 만족해야 한다.

- Desktop 정상
- Mobile 정상
- URL 정상
- navigation 정상
- content 누락 없음
- image 정상
- alt 존재
- title 고유
- description 고유
- canonical 정상
- 404 정상
- redirect 정상
- 검색 정상
- console error 없음
- 주요 accessibility 문제 없음
