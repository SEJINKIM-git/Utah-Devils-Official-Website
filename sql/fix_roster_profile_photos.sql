-- Utah Devils 2026 roster — 운영진 확인 완료 프로필 사진 경로
-- 실행 대상: public.roster_members (홈페이지 전용 테이블)
-- 사진은 public/images/roster/에 함께 배포되므로 상대 경로를 사용합니다.

update public.roster_members as r
set photo_url = v.photo_url
from (
  values
    ('2026',  1, '/images/roster/01-sawyer-ott.jpg'),
    ('2026',  2, '/images/roster/02-juho-lim.jpg'),
    ('2026', 13, '/images/roster/13-heechan-im.png'),
    ('2026', 14, '/images/roster/14-kyungmin-cho.png'),
    ('2026', 18, '/images/roster/18-junho-yoon.jpg'),
    ('2026', 25, '/images/roster/25-baehyun-kang.png'),
    ('2026', 34, '/images/roster/34-samuel-bernerad.jpg'),
    ('2026', 35, '/images/roster/35-howon-lee.jpg'),
    ('2026', 37, '/images/roster/37-raewon-kang.jpg'),
    ('2026', 56, '/images/roster/56-jimin-park.png'),
    ('2026', 82, '/images/roster/82-seohyun-hwang.png')
) as v(season, number, photo_url)
where r.season = v.season
  and r.number = v.number;
