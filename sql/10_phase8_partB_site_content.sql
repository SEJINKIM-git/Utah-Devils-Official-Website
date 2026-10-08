-- ============================================================
-- Phase 8 Part B: 메인 섹션 제목 문구 키 추가 + 팩트 값 글자 수 상한 조정
-- lib/site-content.ts 의 CONTENT_META 와 같은 값으로 유지한다.
-- 앱은 행이 없으면 첫 저장 때 생성하지만, 라벨·상한을 맞춰 두기 위해 미리 넣는다.
-- 재실행해도 안전(on conflict do nothing / 같은 값 update).
-- ============================================================

insert into public.site_content (key, value, label, description, multiline, max_length) values
  ('home_devils_title_1', 'ONE TEAM.', '메인 01 DEVILS 제목 1줄', '메인 CLUB IDENTITY 섹션 제목 첫 줄입니다.', false, 14),
  ('home_devils_title_2', 'ONE DEVILS.', '메인 01 DEVILS 제목 2줄(외곽선)', '메인 CLUB IDENTITY 섹션 제목 둘째 줄입니다.', false, 14),
  ('home_roster_title_1', 'PLAYERS,', '메인 02 ROSTER 제목 1줄', '메인 ROSTER 섹션 제목 첫 줄입니다.', false, 14),
  ('home_roster_title_2', 'IN FOCUS.', '메인 02 ROSTER 제목 2줄(외곽선)', '메인 ROSTER 섹션 제목 둘째 줄입니다.', false, 14),
  ('home_schedule_title_1', 'EVERY GAME.', '메인 03 GAME DAY 제목 1줄', '메인 GAME DAY 섹션 제목 첫 줄입니다.', false, 14),
  ('home_schedule_title_2', 'ON RECORD.', '메인 03 GAME DAY 제목 2줄(외곽선)', '메인 GAME DAY 섹션 제목 둘째 줄입니다.', false, 14),
  ('home_archive_title_1', 'KEEP THE', '메인 04 ARCHIVE 제목 1줄', '메인 HISTORY & RECORDS 섹션 제목 첫 줄입니다.', false, 14),
  ('home_archive_title_2', 'MOMENT.', '메인 04 ARCHIVE 제목 2줄(외곽선)', '메인 HISTORY & RECORDS 섹션 제목 둘째 줄입니다.', false, 14),
  ('home_stats_title_1', 'SEE THE', '메인 05 DATA 제목 1줄', '메인 DATA PLATFORM 섹션 제목 첫 줄입니다.', false, 14),
  ('home_stats_title_2', 'GAME DEEPER.', '메인 05 DATA 제목 2줄(외곽선)', '메인 DATA PLATFORM 섹션 제목 둘째 줄입니다.', false, 14)
on conflict (key) do nothing;

-- 팩트 값은 메인 BY THE NUMBERS·/devils 팩트박스의 대형 타이포로 표시되어 16자를 넘기면 넘친다.
update public.site_content
set max_length = 16
where key in ('fact_founded', 'fact_affiliation', 'fact_home', 'fact_members');
