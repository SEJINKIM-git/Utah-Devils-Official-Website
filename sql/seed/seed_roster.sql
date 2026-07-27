-- ============================================================
-- 시드 4/5: 2026 시즌 로스터 (roster_members) — 부록 A 공식 확정본
-- DDL 없음 (DELETE/UPDATE/INSERT만). 재실행해도 안전(멱등).
--
-- 1단계: 중복 정리 — 01_roster_members.sql이 두 번 실행되어
--   (season, number) 중복 행이 존재함이 확인됨(2026-07-23, 22행).
--   같은 (season, number) 중 id가 가장 작은 행 하나만 남긴다.
-- 2단계: 기존 행에 영문명/생년월일/입부시기/주장을 UPDATE로 채움
-- 3단계: 없는 선수만 INSERT (존재 확인 패턴)
-- ============================================================

-- 1) (season, number) 중복 제거
delete from public.roster_members a
using public.roster_members b
where a.season = b.season
  and a.number = b.number
  and a.id > b.id;

-- 2) 기존 행 상세 필드 채우기
update public.roster_members r
set name_ko    = v.name_ko,
    name_en    = v.name_en,
    birth_date = v.birth_date,
    joined     = v.joined,
    is_captain = v.is_captain
from (
  values
    ('2026',  1, '소이어', 'Sawyer Ott',      '2007-07-19'::date, '24 Fall',   false),
    ('2026',  2, '임주호', 'Juho Lim',        '2007-06-21'::date, '26 Spring', false),
    ('2026', 13, '임희찬', 'Heechan Im',      '2002-04-22'::date, '25 Spring', false),
    ('2026', 14, '조경민', 'Kyungmin Cho',    '2005-02-14'::date, '24 Fall',   false),
    ('2026', 18, '윤준호', 'Junho Yoon',      '2007-02-16'::date, '26 Spring', false),
    ('2026', 25, '강배현', 'Baehyun Kang',    '2002-03-13'::date, '22 Spring', false),
    ('2026', 34, '사무엘', 'Samuel Bernerad', '2004-05-29'::date, '26 Spring', false),
    ('2026', 35, '이호원', 'Howon Lee',       '2002-03-15'::date, '22 Spring', true),
    ('2026', 37, '강래원', 'Raewon Kang',     '2007-05-25'::date, '26 Spring', false),
    ('2026', 56, '박지민', 'Jimin Park',      '2003-05-06'::date, '23 Spring', false),
    ('2026', 82, '황서현', 'Seohyun Hwang',   '2004-08-20'::date, '24 Fall',   false)
) as v(season, number, name_ko, name_en, birth_date, joined, is_captain)
where r.season = v.season
  and r.number = v.number;

-- 3) 누락된 선수만 추가
insert into public.roster_members
  (season, number, name_ko, name_en, birth_date, joined, is_captain)
select v.season, v.number, v.name_ko, v.name_en, v.birth_date, v.joined, v.is_captain
from (
  values
    ('2026',  1, '소이어', 'Sawyer Ott',      '2007-07-19'::date, '24 Fall',   false),
    ('2026',  2, '임주호', 'Juho Lim',        '2007-06-21'::date, '26 Spring', false),
    ('2026', 13, '임희찬', 'Heechan Im',      '2002-04-22'::date, '25 Spring', false),
    ('2026', 14, '조경민', 'Kyungmin Cho',    '2005-02-14'::date, '24 Fall',   false),
    ('2026', 18, '윤준호', 'Junho Yoon',      '2007-02-16'::date, '26 Spring', false),
    ('2026', 25, '강배현', 'Baehyun Kang',    '2002-03-13'::date, '22 Spring', false),
    ('2026', 34, '사무엘', 'Samuel Bernerad', '2004-05-29'::date, '26 Spring', false),
    ('2026', 35, '이호원', 'Howon Lee',       '2002-03-15'::date, '22 Spring', true),
    ('2026', 37, '강래원', 'Raewon Kang',     '2007-05-25'::date, '26 Spring', false),
    ('2026', 56, '박지민', 'Jimin Park',      '2003-05-06'::date, '23 Spring', false),
    ('2026', 82, '황서현', 'Seohyun Hwang',   '2004-08-20'::date, '24 Fall',   false)
) as v(season, number, name_ko, name_en, birth_date, joined, is_captain)
where not exists (
  select 1 from public.roster_members r
  where r.season = v.season and r.number = v.number
);
