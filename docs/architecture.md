# MRINT Website Architecture

## 1. Architecture Goal

신규 사이트는 기존 WordPress의 콘텐츠 구조와 UI 문제를 개선하고, 콘텐츠와 프론트엔드 구조를 분리할 수 있는 유지보수 가능한 구조를 목표로 한다.

---

## 2. Recommended Architecture

```text
Browser
   │
   ▼
Web Application
   │
   ├── Layout
   ├── Pages
   ├── Components
   ├── Content Data
   └── SEO
```

초기 구축에서는 불필요하게 복잡한 backend/API를 만들지 않는다.

콘텐츠 요구가 확정된 후 필요하면 CMS/API를 추가한다.

---

## 3. Recommended Project Structure

```text
project/
│
├── CLAUDE.md
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── sitemap.md
│   ├── seo.md
│   └── migration.md
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon/
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── data/
│   ├── styles/
│   ├── utils/
│   └── lib/
│
├── tests/
│
├── package.json
└── ...
```

---

## 4. Component Architecture

### Layout

```text
AppLayout
 ├── Header
 │    ├── Logo
 │    ├── DesktopNavigation
 │    ├── MegaMenu
 │    ├── Search
 │    └── MobileMenu
 │
 ├── Main
 │
 └── Footer
```

---

## 5. Shared Components

```text
Header
Footer
MegaMenu
MobileMenu
PageHeader
Section
Container
Button
Link
Card
Modal
SidePanel
Pagination
Filter
StatusBadge
```

---

## 6. Domain Components

### Company

```text
CompanyIntro
ContactInfo
Map
```

### Team

```text
TeamGrid
TeamCard
TeamDetail
RelatedProjects
```

### News

```text
NewsList
NewsItem
NewsPanel
NewsDetail
```

### Projects

```text
ProjectList
ProjectCard
ProjectFilter
ProjectTable
ProjectDetail
ProjectMeta
```

### Business

```text
BusinessList
BusinessCard
BusinessDetail
ClientLogoGrid
ServiceFeature
```

---

## 7. Content Model

콘텐츠는 다음 타입으로 분리한다.

```text
Company
Team
News
Project
BusinessLine
Partner
```

---

## 8. Project Model

```typescript
Project {
  id: string
  slug: string
  title: string
  year: number
  industry: string
  type: string
  status: string
  period: string
  client: string
  overview: string
  description?: string
  image?: string
  relatedProjects?: string[]
}
```

---

## 9. News Model

```typescript
News {
  id: string
  slug: string
  title: string
  date: string
  category?: string
  image?: string
  content: string
}
```

---

## 10. Team Model

```typescript
Team {
  id: string
  slug: string
  nameKo: string
  nameEn: string
  titleKo?: string
  titleEn?: string
  image?: string
  introduction?: string
  functions?: string[]
  capabilities?: string[]
  relatedProjects?: string[]
}
```

---

## 11. Business Line Model

```typescript
BusinessLine {
  id: string
  slug: string
  title: string
  description: string
  heroImage: string
  sections: Section[]
  clients: Partner[]
}
```

---

## 12. Data Separation

콘텐츠를 React/HTML 컴포넌트에 직접 하드코딩하지 않는다.

예:

```text
src/data/projects/*
src/data/news/*
src/data/team/*
src/data/business/*
```

또는 향후 CMS/API로 교체하기 쉬운 데이터 계층을 만든다.

---

## 13. Routing

신규 routing:

```text
/
/company
/team
/team/:slug
/news
/news/:slug
/projects
/projects/:slug
/business
/business/:slug
/search
```

잘못된 URL:

```text
/*
```

→ 404

---

## 14. Search Architecture

검색은 통합 search index를 사용한다.

개념:

```text
Project
News
Team
Business
Company
       ↓
Search Index
       ↓
Query
       ↓
Filtered Results
```

검색 결과에 콘텐츠 타입을 함께 표시한다.

---

## 15. Filtering

Projects:

```text
Type
Industry
Status
Year (TBD)
```

필터 상태는 가능하면 URL query parameter와 동기화한다.

예:

```text
/projects?type=SI
/projects?industry=bank
/projects?status=ongoing
```

---

## 16. Image Architecture

이미지 처리 단계:

```text
Original
   ↓
Optimize
   ↓
WebP / AVIF
   ↓
Responsive sizes
   ↓
Browser
```

이미지에는 명확한 의미가 있는 경우 alt를 제공한다.

---

## 17. External Scripts

외부 script는 필요한 페이지에서만 로드한다.

특히 Naver Map API는 Company 페이지에서만 로드하는 것을 기본으로 한다.

---

## 18. State Management

전역 상태가 필요한 항목을 최소화한다.

주요 local state:

- Mobile menu
- Mega menu
- Search input
- News panel
- Filter
- Pagination
- Modal

대규모 상태관리 라이브러리는 실제 필요성이 확인된 경우에만 도입한다.

---

## 19. Error Handling

API 또는 데이터 오류 시 빈 화면을 만들지 않는다.

각 기능에는:

- loading
- empty
- error

상태를 정의한다.

---

## 20. Security Architecture

외부 입력은 검증하고 escape한다.

검색 query는 그대로 HTML에 삽입하지 않는다.

외부 콘텐츠를 렌더링할 경우 HTML sanitization을 적용한다.

환경변수에 다음 값을 저장한다.

```text
API keys
secret keys
private credentials
```

Git에 credential을 커밋하지 않는다.

---

## 21. Architecture Decision Rules

새로운 라이브러리를 추가하기 전에 다음을 검토한다.

1. 기존 기술로 해결할 수 있는가?
2. 유지보수 가치가 있는가?
3. bundle size를 증가시키는가?
4. accessibility에 영향을 주는가?
5. SEO에 영향을 주는가?

필요하지 않은 dependency는 추가하지 않는다.
