-- ============================================================
-- 스키마 변경 (시드 아님): season_awards.photo_url 컬럼 추가
-- 디자인 초안 p3의 어워즈 카드 인물 사진 슬롯용 (Phase 6 명세 §4).
-- season_awards는 이 프로젝트가 만든 신규 테이블 — 기존 테이블 불변 원칙 유지.
-- 재실행해도 안전(if not exists).
-- ============================================================

alter table public.season_awards
  add column if not exists photo_url text;
