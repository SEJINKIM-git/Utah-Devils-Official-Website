# Utah Devils Official Website

유타대학교 아시아캠퍼스 야구동아리 **Utah Devils Baseball Club** 공식 홈페이지.
굿즈, 경기 일정, 팀 기록, 동아리 활동 정보를 한 채널로 통합한다.

- 분석 플랫폼 [Devils Insight AI](https://devils-insight-ai.vercel.app)와 **같은 Supabase 프로젝트(Utah Devils Strategy)** 를 공유한다.
- 기존 테이블(`players`, `games`, `batting_stats`, `pitching_stats`)은 **읽기 전용**으로만 조회한다.
- 배포: Vercel `utah-devils-official` (Region: icn1 Seoul)

## 페이지 상태

| 경로 | 이름 | 상태 | 데이터 소스 |
|---|---|---|---|
| `/` | 메인 히어로 | ✅ 완료 (파비콘/OG 적용) | — |
| `/devils` | 소개 + 연혁 타임라인 | ✅ 완료 + 시드(2022~2026) | `timeline_events` |
| `/players` | 시즌 로스터 | ✅ 완료 + 시드(2026, 11명) | `roster_members` |
| `/schedule` | 경기 일정/결과 | ✅ 완료 | `games` (읽기 전용, 시즌은 date 연도로 자동 감지) — 누락 경기는 [docs/games_gap_report.md](docs/games_gap_report.md) 참조 |
| `/archive` | Awards / Hall of Fame / Events | ✅ 완료 + 시드(어워즈 4시즌, HoF 7, 행사 13) | `season_awards`, `hall_of_fame`, `archive_events` |
| `/shop` | 수요조사 + 굿즈 아카이브 | ✅ 뼈대 완료 (상품 등록 대기) | `products`, `product_surveys`, `survey_responses`(anon INSERT) |
| `404` | not-found | ✅ 완료 | — |
| STATS | 외부 링크 (새 탭) | ✅ | devils-insight-ai.vercel.app |

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
7. [`sql/03_roster_unique.sql`](sql/03_roster_unique.sql) — **스키마**: (season, number) 유니크 제약. **반드시 5번(중복 정리) 이후 실행**

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
