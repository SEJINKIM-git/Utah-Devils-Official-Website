-- ============================================================
-- 스키마 변경 (시드 아님): roster_members (season, number) 유니크 제약
-- 01 재실행 때 중복이 생겼던 버그의 재발 방지책.
-- Table Editor에서 수동으로 행을 추가해도 중복이 원천 차단된다.
-- ⚠️ 반드시 seed_roster.sql(중복 정리) 실행 후에 실행할 것 —
--   중복이 남아 있으면 인덱스 생성이 실패한다.
-- 재실행해도 안전(if not exists).
-- ============================================================

create unique index if not exists uq_roster_season_number
  on roster_members (season, number);
