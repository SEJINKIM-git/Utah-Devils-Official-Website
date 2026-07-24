-- ============================================================
-- 스키마 변경 (시드 아님): /admin 콘솔용 authenticated RLS 정책
-- 이 프로젝트가 만든 신규 테이블에만 정책을 추가한다.
-- ⚠️ 기존 테이블(games, players, batting_stats, pitching_stats)은 건드리지 않는다.
--    특히 games의 RLS 상태(enable/disable)를 변경하지 말 것 — 분석 플랫폼 장애 직결.
-- 재실행해도 안전(drop policy if exists 후 재생성).
-- ============================================================

-- 연혁: 운영진 CRUD
drop policy if exists "admin write timeline_events" on public.timeline_events;
create policy "admin write timeline_events"
  on public.timeline_events
  for all
  to authenticated
  using (true)
  with check (true);

-- 행사: 운영진 CRUD
drop policy if exists "admin write archive_events" on public.archive_events;
create policy "admin write archive_events"
  on public.archive_events
  for all
  to authenticated
  using (true)
  with check (true);

-- 수요조사 응답: 운영진 읽기 전용 (집계/CSV용).
-- anon SELECT는 계속 차단 상태를 유지한다 (개인정보 보호).
drop policy if exists "admin read survey_responses" on public.survey_responses;
create policy "admin read survey_responses"
  on public.survey_responses
  for select
  to authenticated
  using (true);
