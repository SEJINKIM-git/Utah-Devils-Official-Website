-- ============================================================
-- 시드 3/5: Hall of Fame (hall_of_fame) — 부록 D 공식 확정본
-- 교직원 헌액은 운영자 결정에 따라 'faculty' 카테고리 단일 카드,
-- inducted_year 2026으로 등록한다. 이를 위해 hof_category CHECK
-- 제약을 faculty 포함으로 확장한다 (hall_of_fame은 홈페이지 전용
-- 테이블이므로 변경 가능. 분석 플랫폼 테이블 아님).
-- (name_en, inducted_year) 존재 확인 패턴 — 재실행해도 안전(멱등).
-- ============================================================

-- hof_category CHECK 확장: 기존 제약(이름 무관)을 찾아 제거 후 재생성
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.hall_of_fame'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%hof_category%'
  loop
    execute format('alter table public.hall_of_fame drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.hall_of_fame
  add constraint hall_of_fame_hof_category_check
  check (hof_category is null or hof_category in ('batter', 'pitcher', 'manager', 'faculty'));

insert into public.hall_of_fame
  (name_ko, name_en, birth_date, number, active_period, roles, achievements,
   hof_points, hof_category, inducted_year, sort_order)
select v.*
from (
  values
    -- Class of 2024
    ('김은아', 'EUNA KIM', '2001-01-12'::date, 21, '2022 Spring - 2024 Spring',
     array['2023 Spring | Assistant Manager', '2023 Fall - 2024 Spring | Head Manager'],
     array['2023 Manager of the Year'],
     null::numeric, 'manager', 2024, 10),
    ('김경재', 'KYUNGJAE KIM', '2004-08-05'::date, 22, '2023 Spring - 2024 Spring',
     null::text[],
     array['Career 12 Games', '2023 Utah Devils MVP',
           'First Shutout Game of Devils (2024.05.31 vs Mason Vipers)'],
     69, 'pitcher', 2024, 20),
    -- Class of 2026
    ('박예영', 'YEYOUNG PARK', '2003-04-05'::date, 45, '2023 Spring - 2025 Spring',
     array['2023 Fall - 2024 Spring | Assistant Manager', '2024 Fall - 2025 Spring | Head Manager'],
     array['2024 Manager of the Year'],
     null::numeric, 'manager', 2026, 10),
    ('정재형', 'JAEHYEONG JEONG', '2001-07-26'::date, 17, '2022 Spring - 2024 Fall',
     array['2022 Spring | Vice Captain'],
     array['Career 30 Games', '2024 Most Improved Player'],
     80, 'batter', 2026, 20),
    ('김태경', 'TAEKYEONG KIM', '2002-02-26'::date, 11, '2022 Fall - 2025 Fall',
     null::text[],
     array['Career 32 Games', '2023 Most Improved Player', '2024 Best Pitcher of the Year'],
     111, 'batter', 2026, 30),
    ('권혁준', 'HYUKJOON KWON', '2000-06-10'::date, 46, '2022 Spring - 2025 Spring',
     array['2024 Spring | Field Leader'],
     array['Career 31 Games', '2022 Best Batter of the Year'],
     96.5, 'batter', 2026, 40),
    -- 교직원 헌액 (단일 카드)
    ('유타대학교 아시아캠퍼스 교직원', 'Faculty of The University of Utah Asia Campus',
     null::date, null::integer, null::text,
     null::text[],
     array['Greg Hill | Chief Administrative Officer and Dean of Faculty',
           'Marisa Hill | Course Instructor',
           'James Park | Director of External Relations and Alumni Affairs',
           'Molly Kinder | Senior Program Coordinator, Student Leadership and Involvement'],
     null::numeric, 'faculty', 2026, 50)
) as v(name_ko, name_en, birth_date, number, active_period, roles, achievements,
       hof_points, hof_category, inducted_year, sort_order)
where not exists (
  select 1 from public.hall_of_fame h
  where h.name_en = v.name_en and h.inducted_year = v.inducted_year
);
