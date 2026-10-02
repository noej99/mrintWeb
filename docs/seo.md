# MRINT SEO Requirements

## 1. Goal

신규 홈페이지에서 기존 사이트의 SEO 문제를 제거하고 검색엔진이 회사, 사업분야, 프로젝트 및 뉴스 콘텐츠를 명확하게 이해할 수 있도록 한다.

---

## 2. Page Title

모든 indexable 페이지는 고유 title을 가져야 한다.

기존 문제:

```text
모든 페이지:
미래아이엔텍
```

신규 예시:

```text
미래아이엔텍 | Mirae I&Tec
미래아이엔텍 | 회사소개
미래아이엔텍 | Team
미래아이엔텍 | Projects
미래아이엔텍 | News & Notices
미래아이엔텍 | IT Outsourcing
```

상세 페이지:

```text
{Project Title} | 미래아이엔텍
{News Title} | 미래아이엔텍
```

---

## 3. Meta Description

페이지별 고유 description을 생성한다.

기존 description을 그대로 모든 페이지에 사용하지 않는다.

Description은 실제 페이지 내용을 요약해야 한다.

고객이 제공하지 않은 성과/수치/주장을 임의로 추가하지 않는다.

---

## 4. Canonical

모든 indexable 페이지에 canonical을 설정한다.

예:

```text
https://mrint.co.kr/projects
https://mrint.co.kr/projects/{slug}
```

redirect되는 URL을 canonical로 사용하지 않는다.

---

## 5. Open Graph

각 페이지에 다음을 설정한다.

```text
og:title
og:description
og:url
og:type
og:image
```

상세 콘텐츠는 대표 이미지를 사용한다.

---

## 6. Robots

indexable 페이지:

```text
index, follow
```

404:

```text
noindex, follow
```

검색 결과는 기본적으로 `noindex` 여부를 검토한다.

내부/불필요한 데이터 URL은 index 대상에서 제외한다.

---

## 7. XML Sitemap

Sitemap에는 실제 검색 대상 페이지만 포함한다.

포함:

```text
/
/company
/team
/team/*
/news
/news/*
/projects
/projects/*
/business
/business/*
```

제외:

```text
404
redirect
obsolete taxonomy
partner detail
internal data
```

---

## 8. Structured Data

가능한 schema:

### Organization

홈페이지에 적용.

필드 예:

```text
name
url
logo
telephone
email
address
```

### WebSite

홈페이지에 적용.

### BreadcrumbList

상세 페이지에 적용.

예:

```text
Home
 > Projects
 > Project Name
```

### Article

News detail에 적용할 수 있다.

### ItemList

Projects/News 목록에 적용을 검토한다.

실제 콘텐츠에 존재하지 않는 정보는 structured data에 넣지 않는다.

---

## 9. Heading Structure

페이지당 기본적으로:

```text
H1
 ├── H2
 │    └── H3
```

구조를 유지한다.

기존처럼 동일한 제목을 H1/H2에 반복하지 않는다.

---

## 10. Image SEO

모든 의미 있는 이미지에는 alt를 제공한다.

예:

```html
<img
  src="/images/client-ibk.webp"
  alt="IBK기업은행 프로젝트 이미지"
/>
```

고객사 로고:

```html
alt="IBK기업은행"
```

장식 이미지:

```html
alt=""
```

---

## 11. URL SEO

신규 URL:

```text
/company
/projects
/projects/ibk-bank-information-system-operation
/business/it-outsourcing
/news/news-title
```

원칙:

- 영문
- 짧고 명확
- stable
- 의미 기반
- kebab-case

---

## 12. Redirect SEO

기존 URL이 변경되면 301 redirect.

예:

```text
/mirae/ → /company
/newsnotices/ → /news
/business-line/ → /business
```

프로젝트 57건도 개별 매핑한다.

---

## 13. Duplicate Content

다음 중복을 제거한다.

```text
/home/
/ 
```

동일 콘텐츠에 여러 canonical URL을 허용하지 않는다.

---

## 14. Search SEO

내부 검색 결과:

```text
/search?q=...
```

는 일반적으로 검색엔진 색인 대상에서 제외하는 것을 권장한다.

```text
noindex, follow
```

외부 검색엔진이 검색 query별 페이지를 무한 생성하지 않도록 한다.

---

## 15. Pagination

Projects에 pagination이 필요할 경우:

```text
/projects?page=2
```

형태를 사용한다.

pagination URL에 대한 canonical/index 전략은 실제 구현 방식에 맞게 확정한다.

---

## 16. Performance SEO

Core Web Vitals를 고려한다.

주요 대상:

- LCP
- CLS
- INP

특히:

- Hero image optimization
- image dimensions
- lazy loading
- font loading
- JS reduction
- unnecessary external scripts 제거

를 적용한다.

---

## 17. Existing SEO Problems To Remove

다음 문제는 신규 사이트에서 제거한다.

- 동일 title
- 동일 description
- 동일 OG description
- empty pages sitemap 포함
- partner detail 색인
- taxonomy archive 색인
- `/home/` duplicate
- numeric slug
- Korean slug
- 개발용 404 문구
- WordPress metadata 노출

---

## 18. Search Engine Verification

배포 후 다음을 확인한다.

- Google Search Console
- Naver Search Advisor
- sitemap submission
- robots.txt
- indexed URLs
- excluded URLs
- 404
- redirect
- canonical
