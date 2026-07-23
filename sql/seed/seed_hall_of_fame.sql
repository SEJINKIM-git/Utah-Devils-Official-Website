-- ============================================================
-- 시드 3/5: Hall of Fame (hall_of_fame) — 부록 D 공식 확정본
-- ⚠️ 선행 조건: sql/02_hall_of_fame_faculty.sql을 먼저 실행할 것
--   ('faculty' 카테고리는 CHECK 제약 확장 후에만 insert 가능)
-- 총 10행: 학생/매니저 6 + faculty 4 (개별 행).
-- Faculty의 name_ko는 국문 표기가 없어 영문명을 그대로 사용.
-- Faculty의 inducted_year=2026은 Phase 2에서 운영자가 확인한 값 —
--   변경 시 UPDATE로 수정: update hall_of_fame set inducted_year = <연도>
--   where hof_category = 'faculty';
-- DML만 수행. (name_en, inducted_year) 존재 확인 패턴 — 재실행 안전(멱등).
-- ============================================================

-- 구버전 시드가 만들던 교직원 통합 카드가 있으면 제거 (개별 행으로 대체)
delete from public.hall_of_fame
where name_en = 'Faculty of The University of Utah Asia Campus';

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
    -- Faculty (개별 헌액, hof_points는 null 유지)
    ('Greg Hill', 'GREG HILL', null::date, null::integer, null::text,
     array['Chief Administrative Officer and Dean of Faculty'],
     null::text[], null::numeric, 'faculty', 2026, 110),
    ('Marisa Hill', 'MARISA HILL', null::date, null::integer, null::text,
     array['Course Instructor'],
     null::text[], null::numeric, 'faculty', 2026, 120),
    ('James Park', 'JAMES PARK', null::date, null::integer, null::text,
     array['Director of External Relations and Alumni Affairs'],
     null::text[], null::numeric, 'faculty', 2026, 130),
    ('Molly Kinder', 'MOLLY KINDER', null::date, null::integer, null::text,
     array['Senior Program Coordinator, Student Leadership and Involvement'],
     null::text[], null::numeric, 'faculty', 2026, 140)
) as v(name_ko, name_en, birth_date, number, active_period, roles, achievements,
       hof_points, hof_category, inducted_year, sort_order)
where not exists (
  select 1 from public.hall_of_fame h
  where h.name_en = v.name_en and h.inducted_year = v.inducted_year
);
