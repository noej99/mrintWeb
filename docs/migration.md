# MRINT Website Migration Plan

## 1. Migration Goal

기존 WordPress 사이트의 콘텐츠와 검색 유입을 최대한 보존하면서 신규 웹사이트 구조로 전환한다.

---

## 2. Migration Scope

이관 대상:

```text
Company
Team 6
News 8
Projects 57
Business Line 4
Partners 67
Images
SEO metadata
URLs
```

---

## 3. Migration Principle

### 원칙 1

콘텐츠를 먼저 확보한다.

### 원칙 2

콘텐츠 검증과 UI 개발을 분리한다.

### 원칙 3

기존 URL 변경 시 301을 적용한다.

### 원칙 4

고객 확인이 필요한 데이터는 임의로 수정하지 않는다.

### 원칙 5

기존 사이트에서 색인된 URL을 가능한 한 orphan으로 만들지 않는다.

---

## 4. Source Data

필요한 원본:

```text
WordPress XML export
WordPress database
/wp-content/uploads/
/wp-content/themes/mrint/
```

특히 확인할 데이터:

- Custom Fields
- Featured Images
- Project images
- News images
- Team images
- Business Line images
- Partner logos
- taxonomy
- original slug
- publication date

---

## 5. Content Migration

### Company

```text
/mirae/
↓
/company
```

### Team

```text
/team/
↓
/team

/team/{old-slug}/
↓
/team/{new-slug}
```

6건 모두 개별 매핑한다.

### News

```text
/newsnotices/
↓
/news

/news_notices/{old-slug}/
↓
/news/{new-slug}
```

8건 모두 개별 매핑한다.

### Projects

기존 프로젝트는 root-level URL이었다.

예:

```text
/{project-slug}/
```

신규:

```text
/projects/{new-slug}
```

57건 전체를 ID 기준으로 매핑한다.

예:

```text
1572 → /projects/{slug}
1565 → /projects/{slug}
1542 → /projects/{slug}
...
406 → /projects/{slug}
```

---

## 6. Project Slug Strategy

기존 문제:

- Korean slug
- numeric slug
- truncated slug
- duplicate slug
- inconsistent naming

신규 원칙:

```text
/{year}-{client}-{short-description}
```

또는:

```text
/{client}-{short-description}
```

실제 규칙은 프로젝트 전체 slug 충돌을 검토한 후 확정한다.

예:

```text
/projects/2026-nonghyup-bank-neo-core-banking
```

URL 생성 시 고객명이나 프로젝트 설명을 임의로 변경하지 않는다.

---

## 7. Business Line

기존:

```text
/business_line/application-outsourcing/
/business_line/si/
/business_line/infra/
/business_line/managed-service/
```

신규:

```text
/business/it-outsourcing
/business/system-integration
/business/infrastructure
/business/solution
```

---

## 8. Taxonomy Migration

기존:

```text
/project-type/*
/project-industry/*
/project-status/*
/project-year/*
```

신규:

```text
/projects?type=...
/projects?industry=...
/projects?status=...
/projects?year=...
```

기존 taxonomy URL은 신규 filter URL로 redirect하는 방안을 사용한다.

검색엔진에서 실제 색인된 URL과 query 조합을 확인한 후 redirect map을 확정한다.

---

## 9. Partners Migration

기존 Partners 67건은 개별 공개 페이지로 유지하지 않는다.

신규에서는:

```text
Partner
   ↓
Business Line
   ↓
Main Clients
```

형태로 데이터화한다.

중복 가능성이 있는:

```text
애큐온캐피탈-2
MG새마을금고-2
흥국생명-2
한국투자캐피탈-2
```

는 CMS 원본 확인 후 정리한다.

---

## 10. Home Migration

기존:

```text
/home/
```

신규:

```text
/
```

redirect:

```text
/home/ → /
```

---

## 11. CEO Migration

기존:

```text
/ceo/ceo/
```

신규에서는 Team의 CEO 콘텐츠로 통합한다.

```text
/ceo/ceo/
↓
/team
```

실제 CEO detail URL을 별도로 만들 경우 해당 URL로 301한다.

---

## 12. Search Migration

기존:

```text
/?s={query}
```

신규:

```text
/search?q={query}
```

예:

```text
/?s=SC
↓
/search?q=SC
```

query parameter를 보존할 수 있도록 redirect를 구현한다.

---

## 13. Redirect Map

최종적으로 다음 파일을 유지한다.

```text
docs/redirects.csv
```

구조:

```csv
old_url,new_url,status_code,reason
/mirae/,/company,301,company URL migration
/newsnotices/,/news,301,news URL migration
/projects/,/projects,301,canonical normalization
/home/,/,301,duplicate home
```

57개 프로젝트는 반드시 모두 포함한다.

---

## 14. 404 Policy

존재하지 않는 페이지:

```text
404
```

삭제되었지만 대체 콘텐츠가 존재하는 URL:

```text
301
```

대체 콘텐츠가 없는 URL:

```text
410
```

사용 여부는 실제 색인/외부 링크 상황을 확인한 후 결정한다.

---

## 15. Image Migration

원본 이미지 확보:

```text
/wp-content/uploads/
```

후 다음 작업을 수행한다.

```text
Original
 ↓
Validate license
 ↓
Resize
 ↓
Compress
 ↓
WebP/AVIF
 ↓
Alt assignment
 ↓
New public assets
```

이미지 사용권이 불확실한 경우 배포 전에 고객 확인을 받는다.

---

## 16. Content Validation

고객 확인 필요 항목은 별도 checklist로 관리한다.

예:

```text
[ ] 농협은행 외국환
[ ] 프로젝트 기간
[ ] 프로젝트 status
[ ] Client naming
[ ] Taekwang affiliates
[ ] Heungkuk Life item count
[ ] Solution performance claims
[ ] GDPR/HIPAA statement
[ ] Image license
[ ] News external article rights
```

---

## 17. Migration Test

배포 전에 다음을 테스트한다.

### URL

```text
old URL
 ↓
301
 ↓
new URL
```

### Content

- title
- description
- image
- period
- client
- status
- type
- industry

### SEO

- canonical
- sitemap
- robots
- metadata
- structured data

### Functional

- search
- filter
- pagination
- navigation
- mobile menu

---

## 18. Launch Strategy

권장 순서:

```text
1. 신규 사이트 개발
        ↓
2. 콘텐츠 이관
        ↓
3. 콘텐츠 검수
        ↓
4. URL/redirect 검수
        ↓
5. SEO 검수
        ↓
6. staging QA
        ↓
7. production deployment
        ↓
8. 301 활성화
        ↓
9. Search Console / Naver 검증
        ↓
10. 기존 URL 오류 모니터링
```

---

## 19. Post Launch Monitoring

배포 후 최소 다음을 확인한다.

- 404 증가 여부
- redirect 오류
- sitemap 오류
- canonical 오류
- 검색 노출 변화
- 이미지 깨짐
- 모바일 오류
- JavaScript 오류
- 서버 오류
- 검색 기능

특히 기존 프로젝트 57개 URL의 301 상태를 우선 확인한다.

---

## 20. Rollback

배포 장애가 발생할 경우 기존 사이트로 rollback할 수 있도록 준비한다.

필수 백업:

```text
Old WordPress
Database
Uploads
Theme
New deployment
Redirect configuration
DNS configuration
```

배포 전 백업 완료를 확인한다.
