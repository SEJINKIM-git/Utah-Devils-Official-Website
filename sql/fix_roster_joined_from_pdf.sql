-- Utah Devils 2026 roster — PDF(Player p.5) 기준 입단 시기 보정
-- 실행 대상: public.roster_members (홈페이지 전용 테이블)
-- games 테이블은 절대 수정하지 않습니다.

update public.roster_members as r
set joined = v.joined
from (
  values
    ('2026',  1, '24 Fall'),
    ('2026',  2, '26 Spring'),
    ('2026', 56, '23 Spring'),
    ('2026', 82, '24 Fall')
) as v(season, number, joined)
where r.season = v.season
  and r.number = v.number;
