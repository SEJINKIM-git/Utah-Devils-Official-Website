-- ============================================================
-- 시드 2/5: 시즌 어워즈 (season_awards) — 부록 C 공식 확정본
-- 2022 시즌 5부문은 이미 존재(부록과 일치 확인됨) → 존재 확인 패턴으로 스킵.
-- 2026은 시즌 진행 중이므로 제외. 재실행해도 안전(멱등).
-- ============================================================

insert into public.season_awards (season, award_type, player_name, player_name_en, player_number)
select v.season, v.award_type, v.player_name, v.player_name_en, v.player_number
from (
  values
    -- 2023
    ('2023', 'MVP',           '김경재', 'K J KIM',    22),
    ('2023', 'BEST_BATTER',   '박성연', 'S Y PARK',   27),
    ('2023', 'BEST_PITCHER',  '이호원', 'H W LEE',    35),
    ('2023', 'MOST_IMPROVED', '김태경', 'T K KIM',    11),
    ('2023', 'ROOKIE',        '김경재', 'K J KIM',    22),
    ('2023', 'MANAGER',       '김은아', 'E A KIM',    21),
    -- 2024
    ('2024', 'MVP',           '이호원', 'H W LEE',    35),
    ('2024', 'BEST_BATTER',   '강배현', 'B H KANG',   25),
    ('2024', 'BEST_PITCHER',  '김태경', 'T K KIM',    11),
    ('2024', 'MOST_IMPROVED', '정재형', 'J H JEONG',  17),
    ('2024', 'ROOKIE',        '황서현', 'S H HWANG',  82),
    ('2024', 'MANAGER',       '박예영', 'Y Y PARK',   45),
    -- 2025
    ('2025', 'MVP',           '이호원', 'H W LEE',    35),
    ('2025', 'BEST_BATTER',   '박상언', 'S E PARK',   23),
    ('2025', 'BEST_PITCHER',  '황서현', 'S H HWANG',  82),
    ('2025', 'MOST_IMPROVED', '조경민', 'K M CHO',    14),
    ('2025', 'ROOKIE',        '임희찬', 'H C IM',     13),
    ('2025', 'MANAGER',       '김민정', 'M J KIM',    51)
) as v(season, award_type, player_name, player_name_en, player_number)
where not exists (
  select 1 from public.season_awards a
  where a.season = v.season and a.award_type = v.award_type
);
