-- ============================================================
-- 홈페이지 전용 로스터 테이블 (Supabase SQL Editor에서 실행)
--
-- 배경: 기존 players 테이블은 분석 플랫폼의 작업용 테이블이라
--   (1) anon SELECT가 막혀 있고 (2) 영문명/생년월일/입부시기/주장
--   컬럼이 없으며 (3) 중복 행이 존재한다.
--   기존 테이블을 건드리지 않기 위해 홈페이지 전용 테이블을 만든다.
-- player_id는 분석 플랫폼 players.id(integer)로의 느슨한 참조 (FK 없음)
-- ============================================================

create table if not exists public.roster_members (
  id uuid primary key default gen_random_uuid(),
  season text not null,                -- 예: '2026'
  name_ko text not null,
  name_en text,
  number integer,
  birth_date date,
  joined text,                         -- 입부 시기, 예: '24 FALL'
  is_captain boolean not null default false,
  positions text[],
  player_id integer,                   -- 분석 플랫폼 players.id 느슨한 참조
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.roster_members enable row level security;

-- 콘텐츠 테이블 공통 정책: anon 읽기 허용, 쓰기는 authenticated만
drop policy if exists "roster_members anon select" on public.roster_members;
create policy "roster_members anon select"
  on public.roster_members for select
  to anon, authenticated
  using (true);

drop policy if exists "roster_members authenticated write" on public.roster_members;
create policy "roster_members authenticated write"
  on public.roster_members for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- 2026 시즌 시드 (2026 선수단 명단.xlsx 기준 — 배번/이름만 보유)
-- 영문명/생년월일/입부시기/주장은 seed/seed_roster.sql이 채운다
-- 주의: 유니크 제약이 없어 on conflict가 동작하지 않으므로
--   존재 확인 패턴을 사용한다 (재실행해도 중복 삽입 없음)
-- ------------------------------------------------------------
insert into public.roster_members (season, number, name_ko)
select v.season, v.number, v.name_ko
from (
  values
    ('2026',  1, '소이어'),
    ('2026',  2, '임주호'),
    ('2026', 13, '임희찬'),
    ('2026', 14, '조경민'),
    ('2026', 18, '윤준호'),
    ('2026', 25, '강배현'),
    ('2026', 34, '사무엘'),
    ('2026', 35, '이호원'),
    ('2026', 37, '강래원'),
    ('2026', 56, '박지민'),
    ('2026', 82, '황서현')
) as v(season, number, name_ko)
where not exists (
  select 1 from public.roster_members r
  where r.season = v.season and r.number = v.number
);
