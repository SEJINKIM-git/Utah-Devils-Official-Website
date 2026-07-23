-- ============================================================
-- 스키마 변경 (시드 아님): hall_of_fame.hof_category CHECK 확장
-- 교직원 헌액('faculty')을 허용한다. seed_hall_of_fame.sql 실행 전에
-- 반드시 1회 실행할 것. 재실행해도 안전(drop 후 재생성).
-- 제약 이름은 실제 DB에서 확인된 값(hall_of_fame_hof_category_check).
-- ============================================================

alter table public.hall_of_fame
  drop constraint if exists hall_of_fame_hof_category_check;

alter table public.hall_of_fame
  add constraint hall_of_fame_hof_category_check
  check (hof_category is null or hof_category in ('batter', 'pitcher', 'manager', 'faculty'));
