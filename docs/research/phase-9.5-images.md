# Phase 9.5 — Image Migration 사전조사

placeholder로 남아 있는 이미지를 실제 이미지로 바꾸기 전에, **원본 확보 가능성**과 **사용 권리**를 따로 확인하기 위한 이미지 inventory. 이 문서는 구현을 포함하지 않는다.

- `[관찰]`: 기존 사이트(WordPress REST API, HTTP 응답)에서 확인한 사실
- `[데이터]`: 현재 `src/data`에 기록된 값
- `[추정]`: 파일명·메모 등 간접 근거. **사실로 확정하지 않는다.**
- 이번 조사에서 원본 파일을 다운로드하거나 저장하지 않았다. `src/data`는 변경하지 않았다.
- 전체 inventory: 이 문서 §부록(요약 컬럼) + [`phase-9.5-images-inventory.csv`](phase-9.5-images-inventory.csv)(전체 컬럼, UTF-8 BOM, 160행)

---

## 1. 조사 목적

1. 현재 데이터에 기록된 이미지 전체를 한 표로 정리한다. (Home 카드 포함)
2. 기존 WordPress에서 원본 파일을 **확보할 수 있는지** 확인한다. (접근성, 원본 크기, media metadata)
3. 확보 가능 여부와 별개로, **사용할 권리가 있는지** 확인이 필요한 항목을 분류한다.
4. Phase 9.5 구현(원본 확보 → 권리 확인 → 화면 적용)에 필요한 결정 사항과 기술 구조를 정리한다.

## 2. 조사 범위

| 항목 | 내용 |
|---|---|
| 조사 일시 | 2026-10-02 |
| 기준 커밋 | `f86ccb2` (Phase 9 완료 + Footer 워드마크 제거, `main` = `origin/main`) |
| 데이터 | `src/data/{company,team,news,projects,business}/*.json`의 이미지 필드 156개 + `src/data/home.ts` Home 카드 4개 = **160개** |
| 기존 사이트 | `GET /wp-json/wp/v2/media?include=…` (media metadata), `GET /wp-json/wp/v2/media?search=…` (media ID가 없는 URL 매칭), 이미지 URL `HEAD` 요청 (본문 다운로드 없음) |
| 제외 | 실제 파일 다운로드·해시 비교·이미지 내용 확인, 화면 적용, 데이터 수정 |

> 요청서의 "156개"는 JSON 데이터 기준이다. Home 카드 4개는 `src/data/home.ts`(TS 모듈)에 있어 별도로 더했다. Home 4개 중 3개는 JSON의 다른 이미지와 같은 URL이다.

---

## 3. 이미지 총량

| 구분 | 수 | 비고 |
|---|---:|---|
| 이미지 자리(slot) | **160** | JSON 156 + Home 4 |
| unique 원본 URL | **130** | JSON만 129 (Home 4개 중 1개만 새 URL) |
| WordPress media 매칭 | **129** / 130 URL | data의 `legacyMediaId` 149행 + WP 검색으로 매칭 10행. 매칭 불가 1행(Team `ceo`) |
| URL 응답 합계 크기 | 약 **42.6MB** (unique 130 URL, `Content-Length` 합) | 최대 2.3MB (Business tab 이미지) |
| 실제 화면 사용 | placeholder 95 / 화면 미표시 65 | 미표시 = Partner 로고 전부 (연결 40은 이름 텍스트로 표시, 미연결 25는 데이터만) |

[데이터] JSON 156개 모두: `src` 없음, `alt: ''`, `license: unknown`, `aiGenerated: unknown`. Partner 67건 모두 `logoPermission: unknown` (로고 없는 Partner 2건: `partner-1030` 뱅크웨어글로벌, `partner-1130` 태광그룹 — 둘 다 미연결).

## 4. 영역별 이미지 수

| 영역 | 이미지 수 | unique URL | 화면 placeholder | 화면 미표시 | 권리: verified / unknown / external / suspected-ai / restricted / unavailable |
|---|---:|---:|---:|---:|---|
| Home | 4 | 4 | 4 | 0 | 0 / 2 / 2 / 0 / 0 / 0 |
| Company | 1 | 1 | 1 | 0 | 0 / 1 / 0 / 0 / 0 / 0 |
| Team | 6 | 6 | 6 | 0 | 0 / 1 / 0 / 5 / 0 / 0 |
| News | 6 | 6 | 6 | 0 | 0 / 3 / 2 / 1 / 0 / 0 |
| Projects | 60 | 35 | 60 | 0 | 0 / 59 / 0 / 1 / 0 / 0 |
| Business | 18 | 18 | 18 | 0 | 0 / 7 / 3 / 8 / 0 / 0 |
| Partner | 65 | 65 | 0 | 65 | 0 / 0 / 65 / 0 / 0 / 0 |
| **합계** | **160** | **130** | **95** | **65** | **0 / 73 / 72 / 15 / 0 / 0** |

- 권리 분류 정의는 §7. Partner는 고객사 로고(제3자 상표)라서 모두 `external`.
- [관찰] WordPress의 alt_text는 129개 media 모두 빈 값. caption은 1건(`project-1209`)만 있으나 내용이 JPEG 생성기 메타데이터(`CREATOR: gd-jpeg v1.0 …`)여서 설명문이 아니다.

## 5. unique 원본 URL

- unique URL 130개 (JSON 129 + Home 전용 1: `2024/02/unsplash_ZKBzlifgkgw.jpg`)
- 형식 [관찰, WP mime_type]: JPEG 85행 / PNG 72행 / SVG 2행(`Logo_NIKE.svg`, `한투저축은행.svg` — Partner) / GIF 1행(`cyber_signeture02.gif` — Partner)
- URL과 원본의 관계 [관찰]

| 관계 | 행 | 설명 |
|---|---:|---|
| 원본 파일 | 148 | URL = WP `source_url` |
| WP `-scaled` 파일 | 6 | WordPress가 큰 이미지를 2560px로 줄여 저장한 파일. 더 큰 원본(`original_image`)이 서버에 따로 있다 — 5개 파일: `kevin-ku-w7ZyuGYNpRQ-unsplash.jpg`, `austin-park-JdSXY1nC5rc-unsplash.jpg`, `한국투자저축은행입구.jpg`, `한국투자저축은행-사무실-전경.jpg`, `dylan-gillis-KdeqA3aTnBY-unsplash.jpg` |
| 리사이즈 파생본 | 5 | Team 5개: `…-683x1024.png`(WP `large` 크기). 원본(1024×1536)이 따로 있다 |
| media 매칭 불가 | 1 | Team `ceo`: `김학연-이사-2-1-1024x1024.jpg` — URL은 200이지만 REST media 검색으로 찾지 못함. 원본 파일명·크기 미확인 |

- 데이터 width/height ↔ WP 원본: 148행 일치, 5행은 파생본 크기와 일치(Team), 6행은 데이터에 크기 없음(Home 4, SVG 로고 2), 1행 확인 불가(`ceo`).

## 6. WordPress 원본 접근 가능/불가

| 확인 | 결과 |
|---|---|
| 데이터 URL `HEAD` | **130/130 → 200**, Content-Type은 WP mime_type과 모두 일치 |
| WP 원본(`source_url`) + `-scaled` 이전 원본(`original_image`) `HEAD` | 전부 200 (데이터 URL 포함 총 217개 URL 표기 확인) |
| media metadata (`/wp/v2/media`) | 129개 반환 — mime_type, width/height, filesize, 크기별 파생본, 업로드일, 연결 게시물(post), 작성자 ID |
| 다운로드 가능 여부 | 인증 없이 공개 접근 가능 → **기술적으로는 다운로드 가능**. 단 이것은 **사용 권리와 무관**하다 (§7) |
| 접근 불가 | **0** |

- [관찰] 원본 크기 합계(WP `filesize` 기준, `-scaled` 이전 원본 제외): 약 53.3MB / 129 media.
- [관찰] WP media 제목이 파일명과 다른 경우 53건 — 원본 파일명 확인에는 `source_url` 파일명을 기준으로 삼는다.

## 7. 권리 상태별 수량

### 7-1. 분류 기준 (한 행에 대표 분류 1개 + 보조 flag)

| 분류 | 기준 | 수 |
|---|---|---:|
| `verified` | 데이터 `license: confirmed` (고객/권리자 확인 완료) | **0** |
| `unknown` | 출처·권리 근거 없음 (아래 분류에 해당하지 않음) | **73** |
| `external` | 외부 출처 근거 있음: 파일명에 stock 사이트명(unsplash), review 메모의 Unsplash·제3자 자료 기록, 고객사 로고(제3자 상표) | **72** |
| `suspected-ai` | review 메모의 "AI 생성으로 추정" 기록 **그리고** 파일명 패턴(`remix_`, `simple_compose_`, `ChatGPT-Image`) — **추정이며 확정 아님** | **15** |
| `restricted` | 사용 제한이 확인된 경우 (`license: restricted`, 권리자 거부) | **0** |
| `unavailable` | 원본 URL 접근 불가 | **0** |

- 우선순위: unavailable → restricted → verified → suspected-ai → external → unknown. 여러 근거가 있으면 inventory의 flags에 함께 적었다.
- `external`은 "사용 불가"가 아니라 **권리자 또는 라이선스를 따로 확인해야 함**을 뜻한다. `unknown`도 사용 가능으로 보지 않는다.
- **사용 가능(verified)으로 판단한 이미지는 0개다.**

### 7-2. 보조 확인 항목

- **고객사 로고·간판 포함 여부 확인 필요** [데이터, review 메모]: 62행 (Projects 60, News 2). 메모는 "포함 여부 확인 필요"이므로 포함됐다고 확정하지 않았다. `news-1266`은 메모에 "KDB캐피탈 건물 간판·로고 포함 사진"이라고 기록되어 있다.
- **인물 사진** [데이터]: Team `ceo` — 초상·사용 권한 확인 필요. 메모에 목록용 흑백 이미지 별도 파일(`김학연-이사-2-2-1024x1024.jpg`)이 기록되어 있으나 현재 데이터 이미지 필드에는 없다 (inventory 미포함).
- **다른 기사·게시물 소속 이미지** [데이터]: `news-1563`(흥국화재 기사)에 흥국생명 이미지(media 620) 사용, `news-812`는 원래 다른 게시물(84) 소속 이미지.

## 8. AI 의심 이미지

**15개** — 모두 review 메모 **그리고** 파일명 패턴이 함께 근거다. 이미지 내용을 확인하거나 생성 도구 기록을 본 것이 아니므로 **AI 생성으로 확정하지 않는다.** 데이터의 `aiGenerated`는 `unknown` 그대로 둔다.

| # | 영역 | entity | slot | 파일명 | 근거 |
|---:|---|---|---|---|---|
| 7 | Team | future-technology-research-center | image | 20250707_1543_미래기술연구소-회의_remix_01jzhsxvj0fgk907cm07kf3m2z_Color2-683x1024.png | review 메모 + 파일명 패턴 |
| 8 | Team | infrastructure-team | image | 20250707_1418_흑백-리믹스-디자인_remix_01jzhn134wftftc6ryf7v7h1c9_Color-683x1024.png | review 메모 + 파일명 패턴 |
| 9 | Team | ito-team | image | 20250707_1405_아이콘-삭제-및-위치-조정_remix_01jzhm9z5bfhjsm2gdgrstt01d_Color2-683x1024.png | review 메모 + 파일명 패턴 |
| 10 | Team | si-team | image | 20250708_0918_배경화면-안정감-조정_remix_01jzkp8hwfe4xr77tcntb5bdct-683x1024.png | review 메모 + 파일명 패턴 |
| 11 | Team | solution-team | image | 20250707_1411_아이콘-삭제-요청_remix_01jzhmmbp8fkz9qzgtp18cchv4_Color2-683x1024.png | review 메모 + 파일명 패턴 |
| 14 | News | news-1429 | images[0] | 20250709_1129_악수하는-남자들_simple_compose_01jzpg7fdxe1mvagq4h7y9bmts.png | review 메모 + 파일명 패턴 |
| 41 | Projects | project-1212 | images[0] | 변환_20250617_1004_BNK-금융그룹-건물_remix_01jxxpj3cef3vbzg9m9c74z84r-2.jpg | review 메모 + 파일명 패턴 |
| 78 | Business | infrastructure | thumbnail | 20250616_1617_데이터-센터-내부_remix_01jxvsg7pef4hbn15ccrh1qsr5-e1750058440891.png | review 메모 + 파일명 패턴 |
| 80 | Business | infrastructure | contents[4].tabs[0].image | 20250616_1544_IT-솔루션-풍경_simple_compose_01jxvqmgymee2tsqdgkkmn4zck.png | review 메모 + 파일명 패턴 |
| 81 | Business | infrastructure | contents[4].tabs[1].image | 20250616_1515_맞춤형-IT-인프라-서비스_simple_compose_01jxvnzyvxe9yb5631y5jgt560.png | review 메모 + 파일명 패턴 |
| 82 | Business | infrastructure | contents[4].tabs[2].image | 20250616_1532_클라우드-혁신-솔루션_simple_compose_01jxvpypaye5fstxhjhsxscbfz.png | review 메모 + 파일명 패턴 |
| 90 | Business | solution | contents[2].image | ChatGPT-Image-2025년-7월-9일-오후-02_27_33.png | review 메모 + 파일명 패턴 |
| 91 | Business | solution | contents[4].tabs[0].image | 20250709_1728_스캔-파일-업스케일링_remix_01jzq4q12xf6etd3mhrbzp7yan.png | review 메모 + 파일명 패턴 |
| 92 | Business | solution | contents[4].tabs[1].image | 20250709_1757_폰트-크기-축소_remix_01jzq6cdvaf3mbxkxd80a4w6rk.png | review 메모 + 파일명 패턴 |
| 93 | Business | solution | contents[4].tabs[2].image | 20250709_1732_CubeOne-for-SAP_remix_01jzq4ywybeaxvj8jascsw7rkd.png | review 메모 + 파일명 패턴 |

- Team 5개와 Business 일부는 메모상 이미지 안에 팀명·제품명 텍스트가 들어 있다. (화면 텍스트와 중복되며 대체 텍스트 처리 필요)
- 파일명 패턴만 있고 메모가 없는 경우는 없었다.

## 9. 외부 출처 의심 이미지

### 9-1. Partner 제외 (7개)

| # | 영역 | entity | slot | 파일명 | 근거 |
|---:|---|---|---|---|---|
| 1 | Home | home-card-1 | HOME_CARDS[0].image | unsplash_ZKBzlifgkgw.jpg | 파일명(unsplash) |
| 2 | Home | home-card-2 | HOME_CARDS[1].image | kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg | 파일명(unsplash) |
| 12 | News | news-1126 | images[0] | 태광그룹.png | review 메모(제3자 자료) |
| 17 | News | news-812 | images[0] | austin-park-JdSXY1nC5rc-unsplash-scaled.jpg | 파일명(unsplash) + review 메모(Unsplash) |
| 87 | Business | it-outsourcing | contents[9].tabs[1].image | dylan-gillis-KdeqA3aTnBY-unsplash-scaled.jpg | 파일명(unsplash) + review 메모(Unsplash) |
| 89 | Business | solution | thumbnail | unsplash_7aakZdIl4vg-e1711695367674.jpg | 파일명(unsplash) + review 메모(Unsplash) |
| 95 | Business | system-integration | contents[2].image | kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg | 파일명(unsplash) + review 메모(Unsplash) |

- 파일명에 `unsplash`가 있는 6개(unique 5): Unsplash 이미지로 **추정**. Unsplash License 여부, 원 사진의 실제 출처, 출처 표기 필요 여부를 확인해야 한다. 파일명만으로 `verified`로 보지 않는다.

### 9-2. Partner 로고 (65개)

- 고객사 로고 = 제3자 상표. 연결된 Partner 40개는 현재 화면에서 **이름 텍스트로만** 표시된다 (Phase 8 결정 D-22). 로고 사용은 고객사별 사용 허락이 필요하다 (`logoPermission`).

### 9-3. 출처를 파일명으로 알 수 없는 이미지 (추가 확인 권장, `unknown` 유지)

| 파일명 | 사용 | 비고 |
|---|---|---|
| `FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg` | Projects 5 (경동나비엔) | 업로드 원본명이 아닌 임의 ID 형식 |
| `200465_50349_2148.jpg` | Partner `partner-1375` (한국투자캐피탈) | 숫자 ID 형식. `partner-728` 로고와 크기·해상도 동일 (§10) |
| `변환_20210629103654078126_1.jpg` | Projects 2 (산림조합중앙회) | 변환 도구 파일명 |
| `7d299c3d-f0e8-4371-beca-547dbfab7407.png`, `unnamed.jpg`, `KakaoTalk_20240407_192948675.jpg`, `IMG_0012.jpeg`, `BandiView_Image2.jpg` | Business 3, News 2 | 메신저·기기·뷰어 저장 파일명 |

## 10. 중복 이미지 분석

| 구분 | 결과 |
|---|---|
| 동일 URL | 7개 URL이 37행에서 사용 (아래 표) |
| 동일 media ID | 7개 — 동일 URL 7개와 같다 (같은 URL은 같은 media) |
| 동일 파일명, 다른 URL | 1건 — `애큐온캐피탈.png` (2024/03, 2024/04) |
| 동일 이미지 **추정** (다른 media ID) | 원본 크기(bytes)·해상도가 같은 2쌍 (동일 가능성 높음, 내용 비교 전 미확정) / 확장자·크기 suffix를 뺀 파일명만 같은 6쌍 (근거 약함, 동일 여부 미확정) |

### 10-1. 동일 URL

| URL (uploads/ 이하) | media ID | 사용 위치 |
|---|---|---|
| 2024/05/scbk.jpg | 1098 | 17회: Projects:project-1097, Projects:project-1144, Projects:project-1149, Projects:project-1223, Projects:project-1232, Projects:project-1471, Projects:project-1473, Projects:project-1475, Projects:project-1477, Projects:project-1479, Projects:project-1481, Projects:project-1483, Projects:project-1485, Projects:project-1487, Projects:project-1489, Projects:project-1491, Projects:project-1537 |
| 2024/04/기업은행.jpg | 978 | 5회: Home:home-card-3, Projects:project-1205, Projects:project-1220, Projects:project-1257, Projects:project-973 |
| 2024/12/FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 1286 | 5회: Projects:project-1283, Projects:project-1450, Projects:project-1452, Projects:project-1454, Projects:project-1456 |
| 2024/04/흥국생명_해머링맨.jpeg | 620 | 4회: Home:home-card-4, News:news-1563, Projects:project-1565, Projects:project-406 |
| 2024/02/kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg | 793 | 2회: Home:home-card-2, Business:system-integration |
| 2024/08/태광그룹.png | 1127 | 2회: News:news-1126, Projects:project-1131 |
| 2025/07/변환_20210629103654078126_1.jpg | 1448 | 2회: Projects:project-1444, Projects:project-1512 |

- 같은 원본을 여러 곳에서 쓰므로, 원본은 **media 단위로 1번만** 확보하면 된다.
- `scbk.jpg` 1개가 SC제일은행 프로젝트 17개에 쓰인다.

### 10-2. 다른 URL / 다른 media ID의 동일 이미지 후보

| 근거 | media ID | 파일 | 사용 위치 |
|---|---|---|---|
| 정규화 파일명 "애큐온캐피탈" | 401 ↔ 487 | 2024/03/애큐온캐피탈.png ↔ 2024/04/애큐온캐피탈.png | Partner:partner-400 ↔ Partner:partner-486 |
| 정규화 파일명 "예금보험공사" | 492 ↔ 1078 | 2024/04/예금보험공사.png ↔ 2024/05/예금보험공사.jpg | Partner:partner-490 ↔ Projects:project-1076 |
| 정규화 파일명 "한국은행" | 510 ↔ 1061 | 2024/04/한국은행.png ↔ 2024/05/한국은행.jpg | Partner:partner-509 ↔ Projects:project-1060 |
| 정규화 파일명 "한국투자캐피탈" | 729 ↔ 1253 | 2024/04/한국투자캐피탈.jpg ↔ 2024/12/한국투자캐피탈.png | Partner:partner-728 ↔ Projects:project-1252 |
| 정규화 파일명 "쇼핑엔티" | 859 ↔ 1281 | 2024/04/쇼핑엔티.jpg ↔ 2024/12/쇼핑엔티.png | Partner:partner-858 ↔ Projects:project-1279 |
| 정규화 파일명 "nia" | 866 ↔ 1073 | 2024/04/NIA.jpg ↔ 2024/05/nia.jpg | Partner:partner-865 ↔ Projects:project-1072 |
| 원본 파일 크기·해상도 동일 (38975 bytes, 680x137) | 401 ↔ 487 | 2024/03/애큐온캐피탈.png ↔ 2024/04/애큐온캐피탈.png | Partner:partner-400 ↔ Partner:partner-486 |
| 원본 파일 크기·해상도 동일 (18507 bytes, 600x131) | 729 ↔ 1376 | 2024/04/한국투자캐피탈.jpg ↔ 2025/06/200465_50349_2148.jpg | Partner:partner-728 ↔ Partner:partner-1375 |

- 1행과 7행은 같은 쌍(`401 ↔ 487`)이다. 파일명·크기·해상도가 모두 같아 동일 파일일 가능성이 높다.
- `729 ↔ 1376`은 파일명이 전혀 다르지만 bytes·해상도가 같다. 동일 파일일 가능성이 높으나 내용 비교 전에는 확정하지 않는다.
- 파일명만 같은 Partner 로고 ↔ Project 이미지 쌍(492↔1078 등)은 형식(png/jpg)·크기가 달라 **같은 이미지로 보지 않는다** — 같은 고객사의 로고와 사진일 수 있다.
- 동일 여부 확정은 원본 확보 후 해시 비교로 한다. Partner 중복(400/486, 728/1375)은 Phase 8 결정(D-22)대로 병합하지 않는다.

---

## 11. P0 / P1 / P2 우선순위

| 우선순위 | 대상 | 이미지 수 | unique URL | 화면 사용 | 권리 분류 (unknown / external / suspected-ai) |
|---|---|---:|---:|---|---|
| P0 | Home 4 + Company 1 | 5 | 5 | placeholder 5 | 3 / 2 / 0 |
| P1 | Business 18 + Partner 연결 40 | 58 | 58 | placeholder 18, not-rendered (연결됨, 이름 텍스트로 표시) 40 | 7 / 43 / 8 |
| P2 | Projects 60 + Team 6 + News 6 | 72 | 45 | placeholder 72 | 63 / 2 / 7 |
| — | Partner 미연결 25 (데이터 보존만) | 25 | 25 | data-only (미연결) 25 | 0 / 25 / 0 |

- **P0** (Home 4 + Company 1): 5개 모두 화면 placeholder. Home 1·2는 파일명상 Unsplash, Home 3·4는 Project/News와 같은 원본. Company는 `35nd-large-e1712245987379.jpg` (750×398, 파일명의 `-e…`는 WordPress 이미지 편집기로 수정한 파일명 형식 [추정]).
- **P1** (Business 18 + 연결 Partner 40): Business 18개 중 8개가 AI 의심, 3개가 Unsplash 추정. Partner 40개는 현재 화면에 로고가 없다 — 로고를 쓸지부터 결정 필요.
- **P2** (Projects 60 + Team 6 + News 6): unique 45. Projects는 고객사 로고·간판 확인 대상, Team 5개는 AI 의심, `ceo`는 인물 사진.
- **화면 사용 구분**: 화면에 placeholder로 쓰이는 이미지 95개 / 데이터에만 있는 이미지 65개(Partner 로고 전부 — 연결 40은 이름 텍스트로 대체 표시, 미연결 25는 화면 미사용).

## 12. 실제 원본 확보가 필요한 목록

- 화면 placeholder 95행 = unique URL **65개** (약 39.7MB). 영역별 unique: Home 4 / Company 1 / Business 18 / Projects 35 / Team 6 / News 6 — 영역 간 공용 원본(Home 3개, `kevin-ku…`, `태광그룹.png`)이 있어 합계보다 적다. Partner 로고 65개는 로고 표시 결정 후.
- 권장 확보 기준 [제안]: **media 단위**로 WordPress 원본(`source_url`)을 받고, `-scaled` 6행·Team 파생본 5행은 더 큰 원본(`original_image` / Team 원본 1024×1536)을 받는다.
- 원본 확보 경로 후보 (D-03):
  1. 고객이 보유한 원본 파일(사진 원본, 디자인 원본, 로고 원본) — 권리 정보와 함께 받는 것이 가장 확실
  2. 기존 WordPress `/wp-content/uploads/` 공개 URL에서 다운로드 — 130/130 접근 가능 확인. **확보 경로일 뿐 권리 근거는 아니다.**
  3. WordPress 관리자 export / 서버 백업 (D-03 미결정)
- 매칭 불가 1건(`ceo`)은 고객에게 원본 파일을 받거나 WP 관리자 화면에서 원본을 확인해야 한다.

## 13. 고객/원본 제공자에게 확인해야 할 항목

| # | 확인 항목 | 대상 |
|---|---|---|
| C1 | 이미지별 출처(직접 촬영 / 구매 / 무료 stock / 외부 제공 / AI 생성)와 사용 범위 | 전체 95 (화면 사용) |
| C2 | AI 생성 여부와 신규 사이트 사용 여부 | `suspected-ai` 15 |
| C3 | Unsplash 이미지 여부, 출처 표기 필요 여부 | 파일명 unsplash 6행 (unique 5) |
| C4 | 고객사 로고 사용 허락 (`logoPermission`) 및 로고 표시 여부 | Partner 연결 40 (+ 미연결 25 보존 여부) |
| C5 | 프로젝트·뉴스 사진 속 고객사 로고·간판·건물 사용 가능 여부 | 62행 (Projects 60, News 2) |
| C6 | 대표이사 인물 사진 사용 동의와 최신 사진 여부 | Team `ceo` (+ 흑백 이미지) |
| C7 | 제3자 자료(계열사 구조도 등) 사용 권리 | `news-1126` (`태광그룹.png`, `project-1131`과 공용) |
| C8 | 파일명으로 출처를 알 수 없는 이미지의 출처 | §9-3 |
| C9 | 같은 이미지를 여러 프로젝트에 쓰는 현재 방식 유지 여부 (`scbk.jpg` 17회 등) | §10-1 |
| C10 | 이미지 안의 텍스트(팀명·제품명) 유지 여부 | Team 5, Business solution 4 |
| C11 | 원본 파일 제공 방법 (D-03) | 전체 |

## 14. Phase 9.5 구현 시 필요한 기술 결정

| # | 결정 | 선택지 / 제안 |
|---|---|---|
| T1 | 파일 저장 위치 | §16 — `src/assets/images/` (Astro 최적화 대상). `public/`은 최적화되지 않아 CLAUDE.md §11에 맞지 않음 |
| T2 | 파일 단위 | media 단위 1파일 (중복 37행 → 7파일) — §16 |
| T3 | `image.src` 연결 방식 | §17 — `src`에 assets 기준 경로 문자열 + `import.meta.glob` resolver |
| T4 | 화면 표시 조건 | `src` 있음 **그리고** `license: confirmed` (+ AI 생성 이미지는 사용 승인)일 때만 이미지, 아니면 placeholder 유지 |
| T5 | 원본 해상도 | 저장소에 넣기 전 최대 크기 제한 여부 (예: 긴 변 2560px). 원본 합계 약 53MB — Git 저장소 크기 / Git LFS 여부 |
| T6 | SVG·GIF 처리 | Partner SVG 2, GIF 1 — `<Picture>` 변환 대상이 아님. 로고는 별도 컴포넌트(`<img>` + width/height) 검토 |
| T7 | alt 문구 | 원문 alt 없음. 의미 있는 이미지의 alt는 고객 확인 문구로만 작성 (임의 작성 금지), 장식용은 `alt=""` |
| T8 | 출처 표기(credit) | Unsplash 등 표기가 필요하면 `image.credit` 표시 위치 결정 |
| T9 | LCP 이미지 | Home 첫 슬라이드 `priority` (lazy 해제) |
| T10 | 테스트 | 연결된 `src` 파일 존재 검증(build 실패), 권리 미확인 이미지가 화면에 나오지 않는지, `wp-content` 외부 요청 0 유지 |
| T11 | 원본 보관 기록 | 확보 파일의 원본 URL·media ID·해시(sha256)·확보일 기록 위치 |

## 15. 현재 결정하지 않아야 하는 항목

- 이미지별 사용 가능 여부 (`license`를 `confirmed`로 바꾸는 것) — 고객/권리자 확인 전
- AI 생성 여부 확정 (`aiGenerated`를 `yes`/`no`로 바꾸는 것)
- Partner 로고 표시 여부, 미연결 Partner 로고 처리
- 중복 이미지 병합·삭제, 같은 이미지를 쓰는 프로젝트의 이미지 교체
- 이미지 alt 문구 작성
- 이미지 편집(텍스트 제거, 크롭)이나 대체 이미지 선정
- 기본 OG 이미지 (D-05)
- 원본 다운로드 실행 (D-03 결정 후)

---

## 16. 기술 구조 제안 — 저장 구조 `[제안]`

현재 `ResponsiveImage.astro`는 `src: ImageMetadata`(import한 로컬 이미지)를 받아 `astro:assets`의 `<Picture>`로 AVIF/WebP, srcset, width/height를 만든다. 원본보다 큰 width는 만들지 않는다. 따라서 이미지는 **`src/` 아래 로컬 파일**이어야 최적화된다.

### 16-1. 영역별 폴더(`home/ company/ team/ …`)의 문제

- 같은 원본을 여러 영역에서 쓴다: `기업은행.jpg`(Home + Projects 4), `흥국생명_해머링맨.jpeg`(Home + News + Projects 2), `kevin-ku…`(Home + Business), `태광그룹.png`(News + Projects).
- 영역별 폴더면 같은 파일을 복사하거나 다른 영역 폴더를 참조해야 한다. 복사하면 저장소 크기와 권리 관리가 이중이 된다.

### 16-2. 제안

```text
src/assets/images/
├─ media/                      기존 WordPress 원본 — media ID 단위 1파일
│  ├─ 978-기업은행.jpg          {mediaId}-{원본 파일명}
│  ├─ 1098-scbk.jpg
│  └─ …
├─ partners/                   고객사 로고 (SVG/PNG/GIF, 로고 사용 허락 후)
└─ replacements/               고객이 새로 제공한 교체 이미지 (영역별 하위 폴더 허용)
   ├─ home/ company/ team/ news/ projects/ business/
```

- 기존 이미지는 WordPress media ID가 이미 데이터(`legacyMediaId`)에 있으므로 **media ID 기준**이 중복·추적에 가장 단순하다.
- 고객이 새 이미지를 주는 경우에만 영역별 폴더를 쓴다.
- 확보 기록(원본 URL, media ID, sha256, 확보일, 확보 경로)은 별도 manifest(예: `src/assets/images/media/MANIFEST.json` 또는 docs) — T11 결정.

## 17. 기술 구조 제안 — `image.src` 연결 방식 `[제안]`

| 방식 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A. 경로 문자열 + glob resolver (권장)** | 데이터 `image.src`에 `src/assets/images/` 기준 경로(`"media/978-기업은행.jpg"`)를 쓰고, `src/lib/images.ts`에서 `import.meta.glob('/src/assets/images/**/*.{jpg,jpeg,png,webp}', { eager: true })`로 `ImageMetadata`를 찾는다 | 현재 스키마(`src: string optional`) 그대로, JSON 구조 유지, Astro 최적화 사용, 데이터 단위 테스트(스키마 직접 파싱) 영향 없음, 없는 파일은 build 시 에러로 검출 | resolver 1개 추가 필요 |
| B. Content Collections `image()` 스키마 | `content.config.ts`에서 `schema: ({ image }) => …`로 JSON 안 상대 경로를 `ImageMetadata`로 변환 | Astro 공식 방식 | `src/schemas/*`를 `image` helper 의존 함수로 바꿔야 함 → 스키마 구조 변경, `tests/unit/data-files.test.ts`처럼 스키마를 직접 쓰는 테스트 수정 필요. `home.ts`·partners(file loader)와 방식이 갈림 |
| C. `public/` 정적 경로 | `src: "/images/…"`를 `<img>`로 출력 | 단순 | AVIF/WebP·srcset 최적화 없음 (CLAUDE.md §11 위반), base 경로 처리 필요 |

권장: **A**

- `src/lib/images.ts`(예): `resolveImage(image) → ImageMetadata | undefined`, `isDisplayable(image)` = `src` 있음 && `license === 'confirmed'` && (AI 사용 승인 규칙).
- 컴포넌트는 지금의 `ImagePlaceholder` 분기(TODO D-13) 자리에서 `isDisplayable`이면 `ResponsiveImage`, 아니면 placeholder.
- `home.ts`의 `image: ImageMetadata | null`도 같은 resolver를 쓰도록 맞추면 한 가지 방식으로 통일된다. (현재는 직접 import 전제)
- 데이터 변경은 확보·권리 확인이 끝난 이미지의 `src`·`license`·`credit`·`alt` 값만 — 고객 확인 결과를 반영하는 단계에서 한다.

---

## 부록 A. 전체 이미지 inventory (요약 컬럼)

- 전 행 공통 [데이터]: `alt: ''`, `license: unknown`, `aiGenerated: unknown` (Home은 해당 필드 없음), Partner `logoPermission: unknown`. CSV에는 이 컬럼과 데이터 파일 경로, legacyUrl, WP title/date/연결 게시물, review 메모 원문이 모두 있다.
- media ID의 `*` = 데이터에 ID가 없어 WP 검색으로 매칭. `-` = 매칭 불가.
- KB = 데이터 URL의 `Content-Length`. HEAD = 데이터 URL 응답 코드.

| # | 영역 | P | entity | slot | media ID | 파일명 | data W×H | WP W×H | mime | KB | HEAD | URL 관계 | 권리 | flags | 현재 사용 | 중복 |
|---:|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|---|---|
| 1 | Home | P0 | home-card-1 | HOME_CARDS[0].image | 361* | unsplash_ZKBzlifgkgw.jpg |  | 1920×1440 | jpeg | 1225 | 200 | 원본 파일 | external |  | placeholder |  |
| 2 | Home | P0 | home-card-2 | HOME_CARDS[1].image | 793* | kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg |  | 2560×1919 | jpeg | 457 | 200 | WP -scaled 파일 (원본은 original_image) | external |  | placeholder | URL 2회 |
| 3 | Home | P0 | home-card-3 | HOME_CARDS[2].image | 978* | 기업은행.jpg |  | 2560×1707 | jpeg | 444 | 200 | 원본 파일 | unknown |  | placeholder | URL 5회 |
| 4 | Home | P0 | home-card-4 | HOME_CARDS[3].image | 620* | 흥국생명_해머링맨.jpeg |  | 1280×853 | jpeg | 980 | 200 | 원본 파일 | unknown |  | placeholder | URL 4회 |
| 5 | Company | P0 | company | images[0] | 832* | 35nd-large-e1712245987379.jpg | 750×398 | 750×398 | jpeg | 56 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 6 | Team | P2 | ceo | image | - | 김학연-이사-2-1-1024x1024.jpg | 1024×1024 |  | jpeg | 93 | 200 | media 매칭 불가 | unknown |  | placeholder |  |
| 7 | Team | P2 | future-technology-research-center | image | 1417* | 20250707_1543_미래기술연구소-회의_remix_01jzhsxvj0fgk907cm07kf3m2z_Color2-683x1024.png | 683×1024 | 1024×1536 | png | 710 | 200 | 리사이즈 파생본 (large 683×1024) | suspected-ai |  | placeholder |  |
| 8 | Team | P2 | infrastructure-team | image | 1418* | 20250707_1418_흑백-리믹스-디자인_remix_01jzhn134wftftc6ryf7v7h1c9_Color-683x1024.png | 683×1024 | 1024×1536 | png | 959 | 200 | 리사이즈 파생본 (large 683×1024) | suspected-ai |  | placeholder |  |
| 9 | Team | P2 | ito-team | image | 1421* | 20250707_1405_아이콘-삭제-및-위치-조정_remix_01jzhm9z5bfhjsm2gdgrstt01d_Color2-683x1024.png | 683×1024 | 1024×1536 | png | 539 | 200 | 리사이즈 파생본 (large 683×1024) | suspected-ai |  | placeholder |  |
| 10 | Team | P2 | si-team | image | 1428* | 20250708_0918_배경화면-안정감-조정_remix_01jzkp8hwfe4xr77tcntb5bdct-683x1024.png | 683×1024 | 1024×1536 | png | 595 | 200 | 리사이즈 파생본 (large 683×1024) | suspected-ai |  | placeholder |  |
| 11 | Team | P2 | solution-team | image | 1419* | 20250707_1411_아이콘-삭제-요청_remix_01jzhmmbp8fkz9qzgtp18cchv4_Color2-683x1024.png | 683×1024 | 1024×1536 | png | 598 | 200 | 리사이즈 파생본 (large 683×1024) | suspected-ai |  | placeholder |  |
| 12 | News | P2 | news-1126 | images[0] | 1127 | 태광그룹.png | 856×671 | 856×671 | png | 67 | 200 | 원본 파일 | external |  로고·간판확인 | placeholder | URL 2회 |
| 13 | News | P2 | news-1266 | images[0] | 1194 | IMG_0012.jpeg | 530×333 | 530×333 | jpeg | 55 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 14 | News | P2 | news-1429 | images[0] | 1430 | 20250709_1129_악수하는-남자들_simple_compose_01jzpg7fdxe1mvagq4h7y9bmts.png | 1024×1024 | 1024×1024 | png | 1496 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 15 | News | P2 | news-1528 | images[0] | 1531 | BandiView_Image2.jpg | 1280×720 | 1280×720 | jpeg | 109 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 16 | News | P2 | news-1563 | images[0] | 620 | 흥국생명_해머링맨.jpeg | 1280×853 | 1280×853 | jpeg | 980 | 200 | 원본 파일 | unknown |  | placeholder | URL 4회 |
| 17 | News | P2 | news-812 | images[0] | 825 | austin-park-JdSXY1nC5rc-unsplash-scaled.jpg | 2560×2048 | 2560×2048 | jpeg | 659 | 200 | WP -scaled 파일 (원본은 original_image) | external |  | placeholder |  |
| 18 | Projects | P2 | project-1001 | images[0] | 1003 | 한국투자저축은행입구-scaled.jpg | 2560×1920 | 2560×1920 | jpeg | 612 | 200 | WP -scaled 파일 (원본은 original_image) | unknown |  로고·간판확인 | placeholder |  |
| 19 | Projects | P2 | project-1001 | images[1] | 1002 | 한국투자저축은행-사무실-전경-scaled.jpg | 2560×1920 | 2560×1920 | jpeg | 873 | 200 | WP -scaled 파일 (원본은 original_image) | unknown |  로고·간판확인 | placeholder |  |
| 20 | Projects | P2 | project-1028 | images[0] | 1036 | 시그니쳐타워1.jpg | 900×675 | 900×675 | jpeg | 168 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 21 | Projects | P2 | project-1044 | images[0] | 1048 | restmb_allidxmake.jpeg | 600×337 | 600×337 | jpeg | 123 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 22 | Projects | P2 | project-1051 | images[0] | 1055 | 새마을금고중앙회-IT센터-전경04_1608495857597.jpg | 1920×1080 | 1920×1080 | jpeg | 1253 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 23 | Projects | P2 | project-1057 | images[0] | 1058 | 새마을금고로고_1608495875839.jpg | 1920×1080 | 1920×1080 | jpeg | 425 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 24 | Projects | P2 | project-1060 | images[0] | 1061 | 한국은행.jpg | 620×422 | 620×422 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | 다른 media와 동일 추정 |
| 25 | Projects | P2 | project-1064 | images[0] | 1067 | 신한은행next.jpg | 630×399 | 630×399 | jpeg | 52 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 26 | Projects | P2 | project-1072 | images[0] | 1073 | nia.jpg | 630×900 | 630×900 | jpeg | 243 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | 다른 media와 동일 추정 |
| 27 | Projects | P2 | project-1076 | images[0] | 1078 | 예금보험공사.jpg | 600×400 | 600×400 | jpeg | 163 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | 다른 media와 동일 추정 |
| 28 | Projects | P2 | project-1080 | images[0] | 1081 | 현대카드.jpg | 600×399 | 600×399 | jpeg | 320 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 29 | Projects | P2 | project-1083 | images[0] | 1084 | 카카오페이.png | 860×580 | 860×580 | png | 767 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 30 | Projects | P2 | project-1086 | images[0] | 1087 | 헬로비전.jpg | 1200×684 | 1200×684 | jpeg | 286 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 31 | Projects | P2 | project-1089 | images[0] | 1090 | CJ-enm.jpg | 620×363 | 620×363 | jpeg | 36 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 32 | Projects | P2 | project-1094 | images[0] | 1095 | 대한통운.jpg | 500×455 | 500×455 | jpeg | 223 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 33 | Projects | P2 | project-1097 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 34 | Projects | P2 | project-1131 | images[0] | 1127 | 태광그룹.png | 856×671 | 856×671 | png | 67 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 2회 |
| 35 | Projects | P2 | project-1135 | images[0] | 1140 | LAINA.jpg | 518×366 | 518×366 | jpeg | 80 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 36 | Projects | P2 | project-1144 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 37 | Projects | P2 | project-1149 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 38 | Projects | P2 | project-1199 | images[0] | 1373 | KDB캐피탈-1.jpg | 1000×892 | 1000×892 | jpeg | 256 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 39 | Projects | P2 | project-1205 | images[0] | 978 | 기업은행.jpg | 2560×1707 | 2560×1707 | jpeg | 444 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 40 | Projects | P2 | project-1209 | images[0] | 1399 | 변환_restmb_allidxmake-3.jpg | 1280×853 | 1280×853 | jpeg | 903 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 41 | Projects | P2 | project-1212 | images[0] | 1401 | 변환_20250617_1004_BNK-금융그룹-건물_remix_01jxxpj3cef3vbzg9m9c74z84r-2.jpg | 1280×853 | 1280×853 | jpeg | 567 | 200 | 원본 파일 | suspected-ai |  로고·간판확인 | placeholder |  |
| 42 | Projects | P2 | project-1220 | images[0] | 978 | 기업은행.jpg | 2560×1707 | 2560×1707 | jpeg | 444 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 43 | Projects | P2 | project-1223 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 44 | Projects | P2 | project-1232 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 45 | Projects | P2 | project-1252 | images[0] | 1253 | 한국투자캐피탈.png | 873×588 | 873×588 | png | 619 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | 다른 media와 동일 추정 |
| 46 | Projects | P2 | project-1257 | images[0] | 978 | 기업은행.jpg | 2560×1707 | 2560×1707 | jpeg | 444 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 47 | Projects | P2 | project-1270 | images[0] | 1271 | IBK연금보험.png | 784×695 | 784×695 | png | 819 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 48 | Projects | P2 | project-1279 | images[0] | 1281 | 쇼핑엔티.png | 788×595 | 788×595 | png | 688 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | 다른 media와 동일 추정 |
| 49 | Projects | P2 | project-1283 | images[0] | 1286 | FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 700×488 | 700×488 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 50 | Projects | P2 | project-1444 | images[0] | 1448 | 변환_20210629103654078126_1.jpg | 1280×853 | 1280×853 | jpeg | 797 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 2회 |
| 51 | Projects | P2 | project-1450 | images[0] | 1286 | FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 700×488 | 700×488 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 52 | Projects | P2 | project-1452 | images[0] | 1286 | FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 700×488 | 700×488 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 53 | Projects | P2 | project-1454 | images[0] | 1286 | FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 700×488 | 700×488 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 54 | Projects | P2 | project-1456 | images[0] | 1286 | FFFJTUJDXN36YWS3Q2CWN7MUTY.jpg | 700×488 | 700×488 | jpeg | 48 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 55 | Projects | P2 | project-1471 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 56 | Projects | P2 | project-1473 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 57 | Projects | P2 | project-1475 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 58 | Projects | P2 | project-1477 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 59 | Projects | P2 | project-1479 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 60 | Projects | P2 | project-1481 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 61 | Projects | P2 | project-1483 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 62 | Projects | P2 | project-1485 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 63 | Projects | P2 | project-1487 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 64 | Projects | P2 | project-1489 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 65 | Projects | P2 | project-1491 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 66 | Projects | P2 | project-1512 | images[0] | 1448 | 변환_20210629103654078126_1.jpg | 1280×853 | 1280×853 | jpeg | 797 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 2회 |
| 67 | Projects | P2 | project-1519 | images[0] | 1186 | 애큐온저축은행전경.jpg | 750×510 | 750×510 | jpeg | 111 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 68 | Projects | P2 | project-1537 | images[0] | 1098 | scbk.jpg | 1000×1000 | 1000×1000 | jpeg | 927 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 17회 |
| 69 | Projects | P2 | project-1542 | images[0] | 1557 | Image333jpg-2.jpg | 1764×1312 | 1764×1312 | jpeg | 413 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 70 | Projects | P2 | project-1565 | images[0] | 620 | 흥국생명_해머링맨.jpeg | 1280×853 | 1280×853 | jpeg | 980 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 4회 |
| 71 | Projects | P2 | project-1572 | images[0] | 1576 | BandiView_0gPaz2_cx57RKeIF-3_nipm6PsOn-ipVf0W6FqA8OAJbkO7wefiJNjrMZ3eiUv0kXbWKphrbjwu0LC79tHqcR7p6v3mAL9j_weUk5g6ye6sUI3KNIbC8ATQj-MUwG-RaznJzMFo_s9ztsuZRsm8lag.jpg | 1280×720 | 1280×720 | jpeg | 343 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 72 | Projects | P2 | project-406 | images[0] | 620 | 흥국생명_해머링맨.jpeg | 1280×853 | 1280×853 | jpeg | 980 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 4회 |
| 73 | Projects | P2 | project-406 | images[1] | 615 | 흥국생명_현장_흑백2.jpeg | 1292×968 | 1292×968 | jpeg | 376 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 74 | Projects | P2 | project-973 | images[0] | 978 | 기업은행.jpg | 2560×1707 | 2560×1707 | jpeg | 444 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder | URL 5회 |
| 75 | Projects | P2 | project-982 | images[0] | 983 | KakaoTalk_20240419_124857145.jpg | 764×764 | 764×764 | jpeg | 257 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 76 | Projects | P2 | project-982 | images[1] | 984 | KakaoTalk_20240419_124915889.jpg | 445×445 | 445×445 | jpeg | 79 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 77 | Projects | P2 | project-992 | images[0] | 993 | 현대차증권_사옥최종_135853183.jpg | 1200×800 | 1200×800 | jpeg | 450 | 200 | 원본 파일 | unknown |  로고·간판확인 | placeholder |  |
| 78 | Business | P1 | infrastructure | thumbnail | 1345 | 20250616_1617_데이터-센터-내부_remix_01jxvsg7pef4hbn15ccrh1qsr5-e1750058440891.png | 1536×414 | 1536×414 | png | 1269 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 79 | Business | P1 | infrastructure | contents[2].image | 1346 | Infrastructure-Maintenance.png | 1536×1024 | 1536×1024 | png | 2245 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 80 | Business | P1 | infrastructure | contents[4].tabs[0].image | 1349 | 20250616_1544_IT-솔루션-풍경_simple_compose_01jxvqmgymee2tsqdgkkmn4zck.png | 1536×1024 | 1536×1024 | png | 2357 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 81 | Business | P1 | infrastructure | contents[4].tabs[1].image | 1348 | 20250616_1515_맞춤형-IT-인프라-서비스_simple_compose_01jxvnzyvxe9yb5631y5jgt560.png | 1536×1024 | 1536×1024 | png | 2365 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 82 | Business | P1 | infrastructure | contents[4].tabs[2].image | 1347 | 20250616_1532_클라우드-혁신-솔루션_simple_compose_01jxvpypaye5fstxhjhsxscbfz.png | 1536×1024 | 1536×1024 | png | 2147 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 83 | Business | P1 | it-outsourcing | thumbnail | 283 | Frame-63.png | 1688×301 | 1688×301 | png | 317 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 84 | Business | P1 | it-outsourcing | contents[2].image | 1343 | unnamed.jpg | 1024×1024 | 1024×1024 | jpeg | 195 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 85 | Business | P1 | it-outsourcing | contents[6].image | 945 | KakaoTalk_20240407_192948675.jpg | 1440×610 | 1440×610 | jpeg | 212 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 86 | Business | P1 | it-outsourcing | contents[9].tabs[0].image | 1342 | 7d299c3d-f0e8-4371-beca-547dbfab7407.png | 1536×1024 | 1536×1024 | png | 2378 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 87 | Business | P1 | it-outsourcing | contents[9].tabs[1].image | 943 | dylan-gillis-KdeqA3aTnBY-unsplash-scaled.jpg | 2560×1707 | 2560×1707 | jpeg | 357 | 200 | WP -scaled 파일 (원본은 original_image) | external |  | placeholder |  |
| 88 | Business | P1 | it-outsourcing | contents[9].tabs[2].image | 829 | sla.png | 1435×486 | 1435×486 | png | 170 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 89 | Business | P1 | solution | thumbnail | 359 | unsplash_7aakZdIl4vg-e1711695367674.jpg | 1485×264 | 1485×264 | jpeg | 66 | 200 | 원본 파일 | external |  | placeholder |  |
| 90 | Business | P1 | solution | contents[2].image | 1432 | ChatGPT-Image-2025년-7월-9일-오후-02_27_33.png | 1536×1024 | 1536×1024 | png | 1747 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 91 | Business | P1 | solution | contents[4].tabs[0].image | 1437 | 20250709_1728_스캔-파일-업스케일링_remix_01jzq4q12xf6etd3mhrbzp7yan.png | 1024×1024 | 1024×1024 | png | 633 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 92 | Business | P1 | solution | contents[4].tabs[1].image | 1439 | 20250709_1757_폰트-크기-축소_remix_01jzq6cdvaf3mbxkxd80a4w6rk.png | 1024×1024 | 1024×1024 | png | 797 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 93 | Business | P1 | solution | contents[4].tabs[2].image | 1438 | 20250709_1732_CubeOne-for-SAP_remix_01jzq4ywybeaxvj8jascsw7rkd.png | 1024×1024 | 1024×1024 | png | 450 | 200 | 원본 파일 | suspected-ai |  | placeholder |  |
| 94 | Business | P1 | system-integration | thumbnail | 282 | Frame-62.png | 1688×301 | 1688×301 | png | 574 | 200 | 원본 파일 | unknown |  | placeholder |  |
| 95 | Business | P1 | system-integration | contents[2].image | 793 | kevin-ku-w7ZyuGYNpRQ-unsplash-scaled.jpg | 2560×1919 | 2560×1919 | jpeg | 457 | 200 | WP -scaled 파일 (원본은 original_image) | external |  | placeholder | URL 2회 |
| 96 | Partner | — | partner-28 | logo | 964 | 동양생명.png | 1000×1000 | 1000×1000 | png | 33 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 97 | Partner | P1 | partner-266 | logo | 402 | 교보생명.png | 640×360 | 640×360 | png | 3 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 98 | Partner | P1 | partner-396 | logo | 399 | SBI-저축은행.png | 300×100 | 300×100 | png | 10 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 99 | Partner | P1 | partner-400 | logo | 401 | 애큐온캐피탈.png | 680×137 | 680×137 | png | 38 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 100 | Partner | — | partner-420 | logo | 421 | on-light-background.png | 712×160 | 712×160 | png | 10 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 101 | Partner | P1 | partner-422 | logo | 986 | Logo_NIKE.svg |  |  | svg+xml | 1 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 102 | Partner | — | partner-443 | logo | 445 | CGV.png | 79×35 | 79×35 | png | 6 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 103 | Partner | — | partner-446 | logo | 447 | CJ-ONE.png | 400×225 | 400×225 | png | 29 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 104 | Partner | — | partner-448 | logo | 449 | CJ-올리브영.png | 204×192 | 204×192 | png | 15 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 105 | Partner | — | partner-450 | logo | 451 | CJ-푸드빌.png | 304×166 | 304×166 | png | 23 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 106 | Partner | P1 | partner-452 | logo | 453 | CJ_EM.png | 95×55 | 95×55 | png | 6 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 107 | Partner | — | partner-454 | logo | 455 | CJ_제일제당.png | 100×44 | 100×44 | png | 6 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 108 | Partner | P1 | partner-456 | logo | 457 | CJ대한통운로고.png | 945×404 | 945×404 | png | 13 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 109 | Partner | — | partner-458 | logo | 459 | finger.png | 720×677 | 720×677 | png | 110 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 110 | Partner | P1 | partner-460 | logo | 461 | ibk-시스템.png | 720×677 | 720×677 | png | 162 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 111 | Partner | — | partner-462 | logo | 463 | kakaobank.png | 600×600 | 600×600 | png | 7 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 112 | Partner | P1 | partner-464 | logo | 465 | kakaopay.png | 256×256 | 256×256 | png | 5 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 113 | Partner | — | partner-466 | logo | 467 | kt-ds.png | 335×132 | 335×132 | png | 9 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 114 | Partner | — | partner-468 | logo | 469 | LG-CNS.png | 1875×444 | 1875×444 | png | 6 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 115 | Partner | P1 | partner-470 | logo | 471 | LG-hellovision.png | 647×364 | 647×364 | png | 59 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 116 | Partner | P1 | partner-472 | logo | 473 | MG-새마을금고.png | 600×600 | 600×600 | png | 11 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 117 | Partner | P1 | partner-474 | logo | 476 | SC-제일은행.png | 476×134 | 476×134 | png | 35 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 118 | Partner | P1 | partner-477 | logo | 478 | Tsis.png | 389×145 | 389×145 | png | 11 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 119 | Partner | — | partner-479 | logo | 480 | 기획재정부.png | 835×299 | 835×299 | png | 64 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 120 | Partner | — | partner-481 | logo | 482 | 라이나-생명.png | 300×100 | 300×100 | png | 9 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 121 | Partner | — | partner-483 | logo | 484 | 아시아나-IDT.png | 300×120 | 300×120 | png | 3 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 122 | Partner | — | partner-486 | logo | 487 | 애큐온캐피탈.png | 680×137 | 680×137 | png | 38 | 200 | 원본 파일 | external |  | data-only (미연결) | 다른 media와 동일 추정 |
| 123 | Partner | P1 | partner-490 | logo | 492 | 예금보험공사.png | 508×138 | 508×138 | png | 55 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 124 | Partner | — | partner-494 | logo | 495 | 우리에프아이에스.png | 1888×253 | 1888×253 | png | 49 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 125 | Partner | — | partner-496 | logo | 497 | 우리은행.png | 800×193 | 800×193 | png | 38 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 126 | Partner | P1 | partner-498 | logo | 500 | 전북은행.png | 1125×211 | 1125×211 | png | 86 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 127 | Partner | — | partner-501 | logo | 503 | 중소기업중앙회.png | 650×300 | 650×300 | png | 38 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 128 | Partner | — | partner-506 | logo | 508 | 하나금융-ti.png | 1263×335 | 1263×335 | png | 30 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 129 | Partner | P1 | partner-509 | logo | 510 | 한국은행.png | 600×600 | 600×600 | png | 18 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 130 | Partner | — | partner-512 | logo | 513 | 한국자산관리공사.png | 586×426 | 586×426 | png | 49 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 131 | Partner | — | partner-514 | logo | 515 | 행정안전부.png | 1200×388 | 1200×388 | png | 34 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 132 | Partner | P1 | partner-516 | logo | 517 | 현대차증권.png | 4000×1333 | 4000×1333 | png | 603 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 133 | Partner | P1 | partner-518 | logo | 519 | 흥국생명-1.png | 512×161 | 512×161 | png | 40 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 134 | Partner | P1 | partner-520 | logo | 521 | 흥국화재.png | 500×101 | 500×101 | png | 38 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 135 | Partner | P1 | partner-545 | logo | 546 | KB_logo_2020.jpg | 800×217 | 800×217 | jpeg | 59 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 136 | Partner | — | partner-575 | logo | 580 | Koscom_CI.jpg | 1719×573 | 1719×573 | jpeg | 45 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 137 | Partner | — | partner-651 | logo | 652 | KDB_CI_Kor.jpg | 1988×301 | 1988×301 | jpeg | 149 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 138 | Partner | P1 | partner-657 | logo | 660 | symbolmark.jpg | 71×71 | 71×71 | jpeg | 11 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 139 | Partner | P1 | partner-662 | logo | 663 | 2.-산림조합-CB-기본형2가로형.jpg | 472×118 | 472×118 | jpeg | 43 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 140 | Partner | P1 | partner-670 | logo | 671 | 삼성꿈장학재단.png | 394×131 | 394×131 | png | 12 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 141 | Partner | P1 | partner-674 | logo | 676 | 삼성카드-로고.png | 298×77 | 298×77 | png | 5 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 142 | Partner | P1 | partner-679 | logo | 680 | 신한은행-로고.jpg | 240×67 | 240×67 | jpeg | 5 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 143 | Partner | P1 | partner-698 | logo | 699 | IBK기업은행_CI국문.jpg | 2364×946 | 2364×946 | jpeg | 231 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 144 | Partner | P1 | partner-707 | logo | 708 | kb캐피탈.png | 336×67 | 336×67 | png | 14 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 145 | Partner | P1 | partner-713 | logo | 714 | 토스뱅크.jpg | 1181×303 | 1181×303 | jpeg | 91 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 146 | Partner | P1 | partner-717 | logo | 718 | 하나은행.jpg | 2362×616 | 2362×616 | jpeg | 145 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 147 | Partner | P1 | partner-728 | logo | 729 | 한국투자캐피탈.jpg | 600×131 | 600×131 | jpeg | 18 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 148 | Partner | P1 | partner-754 | logo | 756 | HyundaiCard_Signature.jpg | 948×219 | 948×219 | jpeg | 21 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 149 | Partner | P1 | partner-807 | logo | 808 | 한투저축은행.svg |  |  | svg+xml | 9 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 150 | Partner | P1 | partner-837 | logo | 838 | cj올리브네트웍스.jpg | 512×385 | 512×385 | jpeg | 15 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 151 | Partner | — | partner-858 | logo | 859 | 쇼핑엔티.jpg | 800×420 | 800×420 | jpeg | 6 | 200 | 원본 파일 | external |  | data-only (미연결) | 다른 media와 동일 추정 |
| 152 | Partner | P1 | partner-865 | logo | 866 | NIA.jpg | 1000×1000 | 1000×1000 | jpeg | 149 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 153 | Partner | — | partner-892 | logo | 893 | CJ프레시웨이.png | 400×300 | 400×300 | png | 5 | 200 | 원본 파일 | external |  | data-only (미연결) |  |
| 154 | Partner | P1 | partner-1137 | logo | 1138 | 라이나손보.png | 449×156 | 449×156 | png | 10 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 155 | Partner | P1 | partner-1184 | logo | 1185 | 애큐온저축은행.png | 546×86 | 546×86 | png | 10 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 156 | Partner | P1 | partner-1191 | logo | 1192 | IMG_0011.png | 1200×630 | 1200×630 | png | 44 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 157 | Partner | P1 | partner-1284 | logo | 1285 | 경동나비엔.png | 485×81 | 485×81 | png | 7 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 158 | Partner | P1 | partner-1350 | logo | 1351 | BNK캐피탈.png | 512×512 | 512×512 | png | 7 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |
| 159 | Partner | P1 | partner-1375 | logo | 1376 | 200465_50349_2148.jpg | 600×131 | 600×131 | jpeg | 18 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) | 다른 media와 동일 추정 |
| 160 | Partner | P1 | partner-1571 | logo | 1570 | cyber_signeture02.gif | 501×161 | 501×161 | gif | 4 | 200 | 원본 파일 | external |  | not-rendered (연결됨, 이름 텍스트로 표시) |  |

## 부록 B. 조사 방법 (재현)

- 조사 스크립트와 원본 응답(JSON)은 세션 scratchpad에만 두었고 저장소에 추가하지 않았다.
- 순서: `src/data` 읽기 → `/wp-json/wp/v2/media?include=` (100개 단위 2회) → media ID 없는 7개 URL은 `?search=` + `source_url`·`media_details.sizes[*].file` 완전 일치로 매칭 → 각 URL `HEAD` (요청 간 120ms) → 분류.
- 관련 결정: D-03(원본 확보), D-05(OG 이미지), D-13(이미지·로고 사용권), D-18(908), D-22(Partner) — 변경 없음.
