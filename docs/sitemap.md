# MRINT Website Sitemap

## 1. Sitemap Principle

기존 메뉴와 콘텐츠를 유지하되 URL 구조를 명확하게 분리한다.

---

## 2. Main Sitemap

```text
/
│
├── company
│
├── team
│   ├── {slug}
│   ├── {slug}
│   ├── {slug}
│   ├── {slug}
│   ├── {slug}
│   └── {slug}
│
├── news
│   ├── {slug}
│   └── ...
│
├── projects
│   ├── {slug}
│   └── ...
│
├── business
│   ├── it-outsourcing
│   ├── system-integration
│   ├── infrastructure
│   └── solution
│
└── search
```

---

## 3. COMPANY

```text
/company
```

기존:

```text
/mirae/
```

Redirect:

```text
/mirae/ → /company
```

---

## 4. TEAM

```text
/team
/team/{slug}
```

콘텐츠:

1. 김학연
2. ITO 팀
3. SI 팀
4. 인프라 팀
5. 솔루션 팀
6. 미래기술연구소

실제 slug는 migration 단계에서 확정한다.

---

## 5. NEWS

```text
/news
/news/{slug}
```

기존:

```text
/newsnotices/
/news_notices/{slug}/
```

신규에서는 `/news`로 통일한다.

---

## 6. PROJECTS

```text
/projects
/projects/{slug}
```

필터:

```text
/projects?type=SI
/projects?industry=bank
/projects?status=ongoing
/projects?year=2026
```

Year filter는 고객 결정 후 확정한다.

---

## 7. BUSINESS

```text
/business
```

상세:

```text
/business/it-outsourcing
/business/system-integration
/business/infrastructure
/business/solution
```

---

## 8. SEARCH

```text
/search?q={query}
```

검색 결과 대상:

```text
Company
Team
News
Projects
Business
```

---

## 9. 404

```text
/404
```

직접 URL로 접근할 필요는 없으며 routing fallback을 통해 표시한다.

---

## 10. Non-Public Data

Partners는 개별 페이지로 노출하지 않는다.

```text
Partner
```

는 Business Line의 고객사 영역 등에서 데이터로 사용한다.

현재 67개 Partners record가 존재한다.

---

## 11. Removed / Redirected URLs

기존 taxonomy:

```text
/project-type/*
/project-industry/*
/project-status/*
/project-year/*
```

신규에서는 Projects query/filter로 통합한다.

---

## 12. Duplicate URLs

다음 중복을 하나의 canonical URL로 통일한다.

```text
/home/
/mirae/
/newsnotices/
/news_notices/
/business-line/
/business_line/
```

---

## 13. URL Naming Rules

신규 slug:

- lowercase
- English
- kebab-case
- stable
- descriptive

예:

```text
system-integration
it-outsourcing
future-technology
```

한국어 slug는 신규 URL에서 사용하지 않는다.

---

## 14. URL Change Principle

기존 검색엔진/외부 링크가 존재할 가능성이 있으므로 기존 URL을 바로 삭제하지 않는다.

URL 변경:

```text
Old URL
   ↓
301
   ↓
New URL
```

---

## 15. Sitemap XML

최종 sitemap에는 실제 indexable page만 포함한다.

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
redirect URL
internal data
partners individual pages
obsolete taxonomy
duplicate URLs
```
