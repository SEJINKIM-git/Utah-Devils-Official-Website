# Utah Devils Official Website

유타대학교 아시아캠퍼스 야구동아리 **Utah Devils Baseball Club** 공식 홈페이지.
굿즈, 경기 일정, 팀 기록, 동아리 활동 정보를 한 채널로 통합한다.

- 분석 플랫폼 [Devils Insight AI](https://devils-insight-ai.vercel.app)와 **같은 Supabase 프로젝트(Utah Devils Strategy)** 를 공유한다.
- 기존 테이블(`players`, `games`, `batting_stats`, `pitching_stats`)은 **읽기 전용**으로만 조회한다.
- 배포: Vercel `utah-devils-official` (Region: icn1 Seoul)

## 페이지 상태

| 경로 | 이름 | 상태 | 데이터 소스 |
|---|---|---|---|
| `/` | 스크롤 저니 (HERO→DEVILS→PLAYER→SCHEDULE→ARCHIVE→STATS→SHOP) | ✅ 완료 — 투명→솔리드 헤더, scrollspy, 섹션 티저 + VIEW ALL | `games`, `roster_members`, `season_awards`, `hall_of_fame`, `timeline_events`, `products`, `product_surveys` (섹션당 limit, revalidate 300) |
| `/devils` | 소개 + 연혁 타임라인 | ✅ 완료 + 시드(2022~2026) | `timeline_events` |
| `/players` | 시즌 로스터 | ✅ 완료 + 시드(2026, 11명) | `roster_members` |
| `/schedule` | 경기 일정/결과 | ✅ 완료 | `games` (읽기 전용, 시즌은 date 연도로 자동 감지) — 누락 경기는 [docs/games_gap_report.md](docs/games_gap_report.md) 참조 |
| `/archive` | Awards / Hall of Fame / Events | ✅ 완료 + 시드(어워즈 4시즌, HoF 7, 행사 13) | `season_awards`, `hall_of_fame`, `archive_events` |
| `/shop` | 수요조사 + 굿즈 아카이브 | ✅ 뼈대 완료 (상품 등록 대기) | `products`, `product_surveys`, `survey_responses`(anon INSERT) |
| `404` | not-found | ✅ 완료 | — |
| STATS | 메인 #stats 섹션 (외부 버튼은 새 탭) | ✅ | devils-insight-ai.vercel.app |

메인 헤더는 스크롤 반응형(메인 최상단 투명 → scrollY>50 솔리드+56px 축소)이고,
메뉴는 메인에서는 섹션 앵커 + scrollspy, 상세 페이지에서는 `/#섹션`으로 이동한다.
모바일 메뉴는 슬라이드다운 패널(ESC/포커스 트랩/스크롤 잠금), 푸터는 4칼럼(브랜드/SITE/LINKS/CONTACT).
등장 애니메이션은 `prefers-reduced-motion: reduce`에서 전부 비활성화된다.

## 개발

```bash
npm install
cp .env.example .env.local   # Supabase URL/anon key 입력 (분석 플랫폼과 동일 값)
npm run dev
```

`lib/supabase.ts`의 `getSupabase()`는 env 미설정 시 `null`을 반환하고,
각 페이지는 notice 문구로 graceful 하게 처리한다.

## DB 준비 (1회)

- 콘텐츠 테이블 7종(`timeline_events` 등)은 이미 생성/RLS 적용 완료.
- **`/players`용 `roster_members` 테이블** → Supabase SQL Editor에서
  [`sql/01_roster_members.sql`](sql/01_roster_members.sql) 실행 (✅ 2026-07 실행 완료).
  - 배경: 기존 `players` 테이블은 anon SELECT가 막혀 있고 카드에 필요한
    컬럼(영문명·생년월일·입부시기·주장)이 없어, 기존 테이블을 건드리지 않고
    홈페이지 전용 테이블을 사용한다. `player_id`는 분석 플랫폼 `players.id`로의
    느슨한 참조(FK 없음)로, 값을 채우면 선수 카드가 분석 플랫폼 상세로 링크된다.

## 시드 데이터 실행 순서 (Supabase SQL Editor)

시드 파일(`sql/seed/`)은 **DDL 없이 DML만** 포함하며 전부 **멱등**(재실행 안전)이다.
스키마 변경은 번호 파일(`sql/0X_*.sql`)에만 둔다. 실행 순서:

**파일 하나당 별도 쿼리로 실행할 것** (SQL Editor는 스크립트 전체가 한 트랜잭션 —
이어붙이면 에러 하나로 전부 롤백된다.)

1. [`sql/02_hall_of_fame_faculty.sql`](sql/02_hall_of_fame_faculty.sql) — **스키마**: hof_category CHECK에 faculty 추가 (seed 4 선행 조건)
2. [`sql/seed/seed_timeline.sql`](sql/seed/seed_timeline.sql) — 연혁 2022~2026 (총 36건)
3. [`sql/seed/seed_awards.sql`](sql/seed/seed_awards.sql) — 시즌 어워즈 2023~2025 (2022는 기존재)
4. [`sql/seed/seed_hall_of_fame.sql`](sql/seed/seed_hall_of_fame.sql) — 헌액자 10건 (학생/매니저 6 + faculty 4)
5. [`sql/seed/seed_roster.sql`](sql/seed/seed_roster.sql) — 로스터 중복 정리 + 2026 상세(영문명/생년월일/입부/주장)
6. [`sql/seed/seed_archive_events.sql`](sql/seed/seed_archive_events.sql) — 행사 13건 (사진은 Storage 업로드 후 photo_urls UPDATE)
7. [`sql/03_roster_unique.sql`](sql/03_roster_unique.sql) — **스키마**: (season, number) 유니크 제약. **반드시 6번(행사 이후) 실행** (중복 행 원천 차단)
8. [`sql/04_admin_rls.sql`](sql/04_admin_rls.sql) — **스키마**: /admin 콘솔용 authenticated RLS 정책 (연혁/행사 쓰기, 수요조사 응답 읽기). 기존 테이블은 건드리지 않음
9. Vercel **Redeploy** (캐시 제거)

## 관리자 콘솔 (/admin)

- 공개 헤더의 **ADMIN LOGIN** 메뉴에서 접근한다. Supabase Auth 이메일 로그인 + 미들웨어 가드이며, **회원가입 UI는 없다.**
- 운영진 계정은 Supabase 대시보드 → Authentication → Users → Add user에서 생성한다.
  - 회원 이름(User metadata `display_name`): 각자의 **영문 이름**
  - 로그인 ID: 각자의 **UNID가 포함된 학교 이메일** (이 사이트의 Supabase Auth 로그인은 이메일 전체를 입력해야 함)
  - 초기 비밀번호: **생년월일 `YYYYMMDD` + 두 자리 등번호**. 예: 2002-03-15, 35번 → `2002031535`; 2번 → `YYYYMMDD02`
  - 최초 로그인 뒤에는 개인 비밀번호로 변경하도록 안내한다.
- 기능: 연혁(timeline_events) CRUD · 행사(archive_events) 추가/수정 · 수요조사 사이즈×수량 집계 + CSV 다운로드
- 쓰기는 전부 authenticated RLS 경로 — service_role 키를 서버에 두지 않는다
- noindex, 사이트 네비게이션 미노출. 최초 사용 전 `sql/04_admin_rls.sql` 1회 실행 필요

`01_roster_members.sql`은 이미 실행 완료 — 재실행해도 이제 안전하지만 다시 실행할 필요 없다.
(과거 2회 실행으로 생긴 중복 행은 seed_roster.sql 1단계가 정리한다.)

`games` 누락 경기(2022~2024 전체 등)는 시드하지 않는다 — 기존 테이블 쓰기 금지.
[docs/games_gap_report.md](docs/games_gap_report.md)의 목록을 분석 플랫폼 업로드 경로로 추가할 것.

## 원칙

- 기존 테이블 INSERT/UPDATE/DELETE 금지 (홈페이지는 읽기만)
- service_role/secret 키를 클라이언트·`NEXT_PUBLIC` env에 넣지 않는다
- Tailwind/UI 라이브러리 금지 — `app/globals.css` 커스텀 프로퍼티 + 클래스 패턴 유지
- next/font 금지 — Google Fonts `<link>` 방식 유지 (Anton / Noto Sans KR / IBM Plex Mono)
- `survey_responses`는 공개 페이지에서 SELECT하지 않는다 (개인정보 보호)

---

## 운영자 콘텐츠 업데이트 가이드

### 🗓️ 새로운 연혁 추가

**테이블:** `public.timeline_events`

| 컬럼 | 값 예시 | 설명 |
|---|---|---|
| `year` | 2026 | 연도 |
| `season` | 'SPRING' 또는 'FALL' | 시즌 (대문자) |
| `month` | 5 | 월 (1~12) |
| `title` | '제 8회 동아리 MT 진행' | 이벤트 제목 |
| `sort_order` | 25 | 같은 연도 내 정렬 순서 (오름차순) |

**Supabase Table Editor:**
1. `timeline_events` 테이블 → **Insert row**
2. 위 값들 입력
3. **Save** (자동 저장)

---

### 🏆 시즌 어워즈 추가 (시즌 종료 후)

**테이블:** `public.season_awards`

| 컬럼 | 값 예시 | 설명 |
|---|---|---|
| `season` | '2026' | 시즌 연도 (텍스트) |
| `award_type` | 'MVP' | 부문 (MVP, BEST_BATTER, BEST_PITCHER, MOST_IMPROVED, ROOKIE, MANAGER) |
| `player_name` | '이호원' | 수상자 한글명 |
| `player_name_en` | 'H W LEE' | 수상자 영문명 (대문자, 띄어쓰기 있음) |
| `player_number` | 35 | 등번호 |

**입력 방법:**
- Supabase Table Editor에서 직접 입력 또는
- SQL Editor에서 INSERT 쿼리 사용

---

### 👥 Hall of Fame (명예의 전당) 추가

**테이블:** `public.hall_of_fame`

| 컬럼 | 설명 | 예시 |
|---|---|---|
| `name_ko` | 한글명 | 이호원 |
| `name_en` | 영문명 (대문자) | HOWON LEE |
| `hof_category` | 카테고리 (batter/pitcher/manager/faculty) | pitcher |
| `inducted_year` | 헌액 연도 | 2026 |
| `birth_date` | 생년월일 | 2002-03-15 |
| `number` | 등번호 (학생만) | 35 또는 null(스태프) |
| `active_period` | 활동 기간 | 2022 Spring - 2024 Fall |
| `roles` | 역할 배열 | ['2023 Fall - 2024 Spring \| Head Manager'] 또는 null |
| `achievements` | 업적 배열 | ['Career 30 Games', '2024 Most Improved Player'] |
| `hof_points` | 평가점 (학생/선수만) | 80 또는 null(스태프) |
| `sort_order` | 같은 연도 내 정렬 순서 | 10, 20, 30... |
| `photo_url` | 사진 URL | [docs/photo_upload_guide.md](docs/photo_upload_guide.md) 참조 |

**프론트 표시:**
- 학생/매니저: `/archive`의 Hall of Fame 섹션 (연도 그룹)
- Faculty: 별도 Faculty 섹션 (`hof_category = 'faculty'` 필터)

---

### 🎬 행사 기록(Events) 추가

**테이블:** `public.archive_events`

| 컬럼 | 설명 | 예시 |
|---|---|---|
| `title` | 행사명 | 2026 Utah Baseball Night |
| `category` | 카테고리 (baseball_night/booth/media/other) | baseball_night |
| `photo_urls` | 사진 URL 배열 | ["https://.../photo1.jpg", "https://.../photo2.jpg"] |
| `external_link` | 외부 링크 (YouTube 등) | https://youtube.com/@utahdevils |

**사진 업로드:** [docs/photo_upload_guide.md](docs/photo_upload_guide.md) 참조

---

### 🛍️ 수요조사 상품 추가

**테이블:** `public.products` + `public.product_surveys`

products 컬럼 (실제 스키마 — `price`/`is_open` 컬럼은 없음):

| 컬럼 | 설명 | 예시 |
|---|---|---|
| `name` | 상품명 | DEVILS CUSTOM CAP 2026 |
| `type` | 종류 | 'giveaway'(배포용) / 'apparel'(의류) |
| `status` | 상태 | 'planning' / 'survey' / 'ordered' / 'distributing' / 'closed' |
| `price_estimate` | 예상가 | 25000 |
| `photo_urls` | 사진 URL 배열 | ["https://.../cap.jpg"] |
| `season` | 시즌 | '2026' |

product_surveys 컬럼 (수요조사 폼):

| 컬럼 | 설명 | 예시 |
|---|---|---|
| `product_id` | products.id 참조 | (UUID) |
| `title` | 조사 제목 | 2026 CAP 수요조사 |
| `size_options` | 사이즈 배열 | ['FREE','M','L','XL'] |
| `closes_at` | 마감 시각 | 2026-08-31 23:59 |
| `is_open` | 노출 여부 | true (공개) / false (숨김) |

**운영 흐름:**
1. products에 상품 추가(`status = 'survey'`) → product_surveys에 조사 추가(`is_open = true`)
2. 마감하려면 → products.status를 'ordered' 등으로 변경, 또는 survey의 `closes_at`을 과거로/`is_open = false`
3. 역사 보존을 위해 DELETE하지 말 것 (아카이브 유지)

---

### 📝 경기 기록 추가 (schedule 페이지)

**테이블:** `public.games` (기존, 홈페이지는 읽기만)

- 홈페이지 `/schedule`은 `games` 테이블을 읽기만 하므로 **직접 INSERT/UPDATE 금지**
- **누락 경기 추가 방법:** 분석 플랫폼([Devils Insight AI](https://devils-insight-ai.vercel.app))의 경기 기록 업로드 경로 사용
- 누락 목록: [docs/games_gap_report.md](docs/games_gap_report.md) 참조

---

## 자주 하는 질문

### Q: 사진이 안 보이는데?
**A:** [docs/photo_upload_guide.md](docs/photo_upload_guide.md)의 "📸 Hall of Fame 사진 업로드" 또는 "🎬 Archive Events 사진 업로드" 섹션 참조. URL이 정확한지 확인 후 캐시 새로고침(Ctrl+Shift+Delete).

### Q: 배포 사이트에 변경사항이 안 반영되는데?
**A:** 최대 5분 지연 가능 (ISR 재검증). 이후에도 안 되면 Vercel 대시보드에서 **Redeploy with cache purge** 실행.

### Q: 연혁/어워즈/행사를 삭제하고 싶은데?
**A:** Supabase Table Editor에서 행 우클릭 → Delete. 단, 과거 데이터는 역사 기록이므로 가능하면 유지 권장.

### Q: 로스터에 새 선수를 추가하려면?
**A:** 새 시즌 시작 시 `roster_members` 테이블에 (season, number, name_ko, name_en, birth_date, joined, is_captain) 행 추가. 기존 `players` 테이블은 건드리지 말 것.

---

## 지원

문제 발생 시:
1. 로컬 개발 서버에서 먼저 테스트: `npm run dev` → http://localhost:3000
2. 데이터베이스 쿼리 확인: Supabase SQL Editor → 조건 재확인
3. 불명확하면 기술팀에 문의
