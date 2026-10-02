# Content Validation Checklist

고객 확인이 필요한 항목. **확정 전에는 기존 원문을 유지한다.** (CLAUDE.md §3, docs/requirements.md §15, docs/migration.md §16)

확인 결과는 데이터의 `review.status` / `review.notes`에도 반영한다.

## 문구 / 데이터

- [ ] 농협은행 `외축환` → `외국환` 여부
- [ ] KakaoPay `납무` → `납부` 여부
- [ ] 프로젝트 기간
- [ ] 프로젝트 status
- [ ] Taekwang 11개 계열사 표기
- [ ] Heungkuk Life 항목 개수
- [ ] Client naming
- [ ] Nike Korea type
- [ ] Solution 성능 수치
- [ ] Infrastructure의 GDPR/HIPAA 관련 문구

## 중복 데이터 (Partners, docs/migration.md §9)

- [ ] 애큐온캐피탈-2
- [ ] MG새마을금고-2
- [ ] 흥국생명-2
- [ ] 한국투자캐피탈-2

## 권리

- [ ] 이미지 라이선스
- [ ] AI 생성 이미지 사용 여부 / 사용권
- [ ] 고객사 로고 사용 권한
- [ ] 뉴스 외부 기사 재사용 권리

## Home 메인 카드 (src/data/home.ts)

기존 사이트 메인 HTML에서 확인 (2026-10-01). 이미지는 확인 전까지 placeholder로 표시한다.

- [ ] `/wp-content/uploads/2024/02/unsplash_ZKBzlifgkgw.jpg` 원본 파일 / 라이선스 (파일명상 Unsplash 추정)
- [ ] `/wp-content/uploads/2024/02/kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg` 원본 파일 / 라이선스 (파일명상 Unsplash 추정)
- [ ] `/wp-content/uploads/2024/04/기업은행.jpg` 원본 파일 / 라이선스 / 출처
- [ ] `/wp-content/uploads/2024/04/흥국생명_해머링맨.jpeg` 원본 파일 / 라이선스 / 출처
- [ ] 카드 날짜(2024.02.23 등)의 의미 — 게시일인지 프로젝트 일자인지
- [ ] 이미지 alt — 기존 `alt=""`. 의미 있는 이미지로 사용할 경우 대체 텍스트 원문 필요

## Company (/mirae/ → /company, src/data/company/company.json)

기존 사이트 /mirae/ HTML에서 확인 (2026-10-01).

- [ ] 소개 이미지 `/wp-content/uploads/2024/04/35nd-large-e1712245987379.jpg` (750×398) 원본 파일 / 라이선스
- [ ] 소개 문구 띄어쓰기: `Help Desk 까지`, `극대화 하기` (원문 유지 중)
- [ ] 기존 공통 meta description `고객 경력쟁 강화를…`의 `경력쟁` (신규 사이트에서는 미사용)
- [ ] 영문 소개 영역(div.en), 표 영역(ul.table)이 비어 있는 것이 의도된 것인지
- [ ] 지도 좌표: Google(실제 표시) `37.5631966, 126.9900875` / Naver(주석 코드) `37.563204, 126.990103`
- [ ] 기존 사이트 HTML에 노출된 Google Maps API key, Naver Client ID의 도메인/referrer 제한 여부 (고객 측 점검)
- [ ] Footer copyright 표기 `© {연도} 미래아이엔텍` 사용 여부 (기존 사이트에는 copyright 없음)

## Team (/team/ → /team, src/data/team/*.json)

기존 사이트 /team/ 및 상세 6건 HTML에서 확인 (2026-10-01). 상세 본문의 Markdown 기호(`#`, `-`)는 구조로 변환, 텍스트는 원문 유지.

- [ ] 팀 이미지 5건(목록 흑백/상세 컬러 각 1쌍): 파일명(`remix_…`)상 **AI 생성 이미지로 추정**, 이미지 안에 팀명 텍스트 포함 — 사용 여부/권리 확인
- [ ] CEO 인물 사진(흑백/컬러): 원본 파일, 초상·사용 권한
- [ ] CEO 영문 약력 제목 `Mirae I&Tech CEO` — `Mirae I&Tec` 표기와 상이
- [ ] `흥국생명 IT 어플리케이션 유지보수` 연도: Team Related Projects 2023 / Home 카드 2024.04.01 / 기존 URL `2024-…`
- [ ] ITO 팀 Related Projects 원본 22번째 항목이 비어 있음(제외 처리)
- [ ] 솔루션 팀 Related Projects `경동나비엔, 파트너포탈 DB암호화 솔루션 공급` 2건 중복 (기존 URL `…-공급-2/`, `…-공급/`)
- [ ] SI 팀 소개 마지막 문장 마침표 없음 (`…제공합니다`)
- [ ] 인프라 팀 영문명 `Infrastructure Maintenance Team` (requirements.md는 `Infrastructure Team`) — 기존 사이트 표기 사용 중
- [ ] Team 목록 h1 표기: 원문 `Team` (기존 화면은 CSS로 `TEAM` 표시)

## News (/newsnotices/ → /news, src/data/news/*.json)

기존 사이트 목록·상세 8건, WP REST(ACF description/gallery, media 메타)에서 확인 (2026-10-01). 본문은 원문 텍스트 유지.

- [ ] 영문 slug 규칙 (현재 임시 `news-{post ID}`, D-17)
- [ ] 908 아이티비즈 기사 전문 게재 — 재사용 권리 (현재 본문 미표시, D-18)
- [ ] 1583/1563/1528/1429 기사체 본문 — 자체 보도자료인지 외부 게재 기사인지
- [ ] 1429 `**CubeOne™**` Markdown 기호 (현재 원문 표시, D-19), `이글로벌시스템`/`이글로벌주식회사`, `CubeOne™`/`큐브원` 혼용, 기존 slug와 제목 불일치
- [ ] 날짜: 1528 게시일 2025.12.02 / 본문 2025년 11월 28일, 1429 게시일 2025.07.09 / 본문 2025년 6월, 908 게시일 2023.07.07 / 본문 21년차
- [ ] 흥국생명 사업 연도: News 2023.07.07 / Team 2023 / Home 2024.04.01 / 프로젝트 URL `2024-…`
- [ ] 1126 `11개 계열사` 표기 / 본문 나열 사명 10개, `트랜드` 표기
- [ ] 1563 첫 줄 `- … - …`(한 줄 안의 대시 2개) 목록 여부, `제안사는` 표현
- [ ] 1266 따옴표 짝 `“KDB캐피탈 차세대"`, 1528 문장 중간 문단 분리
- [ ] 이미지 6건 권리: 태광 계열사 구조도(제3자, 로고·텍스트), KDB 간판 사진, 한국투자저축은행 간판 사진, AI 추정 악수 이미지(1429), Unsplash 추정(812), 흥국생명 사진을 흥국화재 기사에 재사용(1563)
- [ ] 목록/메뉴 표기: 기존 `News&Notices` / 신규 메뉴 데이터 `News & Notices` (h1·Breadcrumb은 기존 표기 사용 중)

## Projects (/{slug}/ → /projects/project-{legacyId}, src/data/projects/*.json)

기존 사이트 목록 3페이지·상세 57건·WP REST(posts, taxonomy, media, partners)에서 확인 (2026-10-01). 원문 그대로 이관, 항목별 상세는 각 JSON의 `review.notes`.

- [ ] 1572 제목 `외국환` / Project Overview `외축환` (requirements §15)
- [ ] 제목 ≠ Name(`businesss_name`) 16건: 1064, 1072, 1076, 1080, 1097, 1131, 1135, 1144, 1149, 1199, 1212, 1223, 1232, 1257, 1279, 1542
- [ ] Status '진행중'이나 Period 종료일 경과 12건: 1491, 1489, 1487, 1485, 1481, 1456, 1454, 1452, 1450, 1212, 1199, 1001 (자동 변경 안 함)
- [ ] Year ≠ Period 시작 연도: 1283(2025 / 2024.12), 1044(2024 / 2023.12)
- [ ] Period 표기 형식 혼용 (`26.12.31`, `25.05 ~ 26.02`, `~` 앞뒤 공백 유무, `진행중`/`진행 중`/`현재`, `2021 ~ 현재`, `2024.12`)
- [ ] 982 Nike Type 없음 (requirements §15 Nike Korea type)
- [ ] 1454 / 1450 제목 동일, Period 상이 — 중복 여부 (Team 솔루션 팀 중복 항목과 동일 건)
- [ ] partner 연결 의심: 1252(→ IBK 시스템, 별도 partner 한국투자캐피탈 존재), 1279(→ 티시스, Client 티알엔) — History 결과에 영향
- [ ] Client가 원청사로 보이는 6건: 1080·1060·1064(LG CNS), 982(TCS), 973·1205(IBK시스템)
- [ ] 1131 제목 `태광그룹 11개 계열사 홈페이지 운영` / Name `태광그룹 홈페이지 운영` (Taekwang 항목)
- [ ] 406 흥국생명 연도 불일치 (Year 2023 / 기존 URL `2024-…` / Home 2024.04.01 / News 2023.07.07 / 프로토타입 2024)
- [ ] 973 / 406 영문 description 표기·품질 (406: TCIS/TSIS 혼용, 'It was.' 등), 원문 기호 `>`·`1.`·`■`(982) 유지
- [ ] 이미지 35건 권리: 언론 이미지 추정(나비엔 1286, 1044·1209의 `restmb_*`), AI 추정(1212 BNK `remix`), 메신저 사진(982 KakaoTalk 2건), 고객사 로고/간판 사진 다수, 공유 이미지(SC 17건, 나비엔 5건, 기업은행 4건, 흥국생명·산림조합 2건)
- [ ] partner 로고 29건 사용 권한 (`logoPermission: unknown`) — Phase 8에서 Partners 67건 전체로 확장 (아래 Partners)
- [ ] taxonomy: Industry `증권`의 기존 slug `증권권`, Year 2017·2019 0건(필터 숨김)
- [x] 정정: Phase 7 Pre-Research 보고의 description 보유 `23건`은 오기 — 실제 **22건** (구현 중 재확인)

## Business Line (/business_line/{slug}/ → /business/{slug}, src/data/business/*.json)

WP REST business_line ACF(contents/partners/thumbnail/description-summary)·상세/목록 HTML에서 확인 (2026-10-02). 원문 그대로 이관, 상세는 각 JSON `review.notes`.

- [ ] 271 `지난 21년 간`(Service Summary) / `2003년 설립 이후 20년 이상`(Service Features 탭 1) — 시점 의존 연차 표현 혼재
- [ ] 279 IT 인프라 운영관리 탭 `GDPR, HIPAA 등의 규정을 준수` — 규정 준수 주장
- [ ] 280 CubeOne™ Plug-In 탭 `(타 제품 대비 2~3배 성능)`, CubeOne™ API 탭 `(경쟁제품 대비 약 50% 이상 빠름)` — 성능 수치 주장
- [ ] 271 섹션 제목 `어플리케이션운영 서비스` (requirements §9 "Application Operations"), 280 `Service features`(소문자) — 원문 유지
- [ ] 이미지 18건 권리: AI 생성 추정 8건(279 thumbnail·탭 3건 `remix`/`simple_compose`, 280 `ChatGPT-Image`·탭 3건 `remix`), 메신저 이미지(271 `KakaoTalk_…`), Unsplash 추정(271 탭, 278 본문, 280 thumbnail), 이미지 속 텍스트(280 `SOLUTION`·제품명, 271/278 thumbnail 배너, 271 `sla.png`) — alt·caption 원본 모두 빈 값
- [ ] Home 카드 1 이미지 `unsplash_ZKBzlifgkgw.jpg`는 271 media에 없음 (출처/설정 위치 미확인). 카드 2 이미지는 278 본문 이미지(793)와 동일
- [ ] 280 기존 slug `managed-service` ↔ title `SOLUTION` (신규 /business/solution, Phase 11 301)
- [x] Business Line ↔ Project 관계: 원본 데이터 없음 — 신규에서도 만들지 않음 (Phase 8 결정)

## Partners (src/data/partners.json, 67건)

- [ ] 이름 중복(병합하지 않음): 400 / 486 `애큐온캐피탈`(486 미연결), 728 / 1375 `한국투자캐피탈`(728: BL 271·278, 1375: BL 279·Project 1209)
- [ ] `-2` slug 원문 보존: 472 `mg-새마을금고-2`, 486 `애큐온캐피탈-2`, 518 `흥국생명-2`, 1375 `한국투자캐피탈-2` (472·518은 같은 이름 원본 항목 없음)
- [ ] 회사명 표기 차이: 1284 `나비엔`(Client `경동나비엔`), 452 `CJ E&M`(`CJ ENM`), 474 `SC 제일은행`(`한국스탠다드차타드은행`), 띄어쓰기 396 `SBI 저축은행`·472 `MG 새마을금고`·460 `IBK 시스템`
- [ ] 미연결 27건(데이터로만 보존, 화면 미표시): 28, 420, 443, 446, 448, 450, 454, 458, 462, 466, 468, 479, 481, 483, 486, 494, 496, 501, 506, 512, 514, 575, 651, 858, 892, 1030, 1130 — 이관 범위 유지 여부
- [ ] 로고 65건 사용 권한(`logoPermission: unknown`, 화면은 이름 텍스트), 미등록 2건(1030 뱅크웨어글로벌, 1130 태광그룹), SVG 크기 메타 없음 2건(422, 807)
- [ ] 기존 개별 URL `/partners/{slug}/` 67건: 본문 없는 빈 페이지가 색인됨 — 신규 개별 페이지 없음, 처리(404/410/redirect)는 Phase 11 (D-16)

## 프로토타입(design/prototype) 관련 확인 사항

프로토타입은 디자인 참고자료이며 콘텐츠 원본이 아니다. 이관은 WordPress 원본 기준으로 한다.

- [ ] 프로토타입 `site.js`에는 `외국환`으로 표기되어 있음 — 원문(`외축환` 여부)과 대조 필요
- [ ] 프로토타입 Hero/섹션 제목/수치(20년 이상, Recent Projects 21 등)/Careers 문구의 원문 출처
- [ ] 프로토타입 사업영역 6개 재구성(금융 IT, IT 컨설팅, 디지털 전환) 사용 여부
- [x] 프로토타입 HTML의 SVG 로고가 공식 로고인지 (D-05) — 2026-10-02 공식 로고로 확정 (원본 `design/brand/mrint-logo.svg`, 프로토타입과 path 동일)
- [ ] 회사 영문 표기: CLAUDE.md `Mirae I&Tec` / 프로토타입 `Mirae I&N Tech` (D-04)
- [ ] 인프라 팀 영문명: requirements `Infrastructure Team` / 프로토타입 `Infrastructure Maintenance Team`
