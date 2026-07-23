-- ============================================================
-- 시드 4/5: 2026 시즌 로스터 (roster_members) — 부록 A 공식 확정본
-- 01_roster_members.sql이 이미 실행되어 이름/등번호만 있는 11행이
-- 존재한다 → (season, number) 유니크 인덱스를 만들고 upsert로
-- 영문명/생년월일/입부시기/주장을 채운다. 재실행해도 안전(멱등).
-- ============================================================

create unique index if not exists roster_members_season_number_key
  on public.roster_members (season, number);

insert into public.roster_members
  (season, number, name_ko, name_en, birth_date, joined, is_captain)
values
  ('2026',  1, '소이어', 'Sawyer Ott',       '2007-07-19', '26 Spring', false),
  ('2026',  2, '임주호', 'Juho Lim',         '2007-06-21', '24 Fall',   false),
  ('2026', 13, '임희찬', 'Heechan Im',       '2002-04-22', '25 Spring', false),
  ('2026', 14, '조경민', 'Kyungmin Cho',     '2005-02-14', '24 Fall',   false),
  ('2026', 18, '윤준호', 'Junho Yoon',       '2007-02-16', '26 Spring', false),
  ('2026', 25, '강배현', 'Baehyun Kang',     '2002-03-13', '22 Spring', false),
  ('2026', 34, '사무엘', 'Samuel Bernerad',  '2004-05-29', '26 Spring', false),
  ('2026', 35, '이호원', 'Howon Lee',        '2002-03-15', '22 Spring', true),
  ('2026', 37, '강래원', 'Raewon Kang',      '2007-05-25', '26 Spring', false),
  ('2026', 56, '박지민', 'Jimin Park',       '2003-05-06', '24 Fall',   false),
  ('2026', 82, '황서현', 'Seohyun Hwang',    '2004-08-20', '23 Spring', false)
on conflict (season, number) do update set
  name_ko    = excluded.name_ko,
  name_en    = excluded.name_en,
  birth_date = excluded.birth_date,
  joined     = excluded.joined,
  is_captain = excluded.is_captain;
