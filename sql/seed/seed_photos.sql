-- ============================================================
-- 시드 (DML 전용, 멱등): 디자인 사진 → DB 연결 (Phase 6 Task 2)
--
-- 전제:
--   1) sql/05_awards_photo.sql 실행 완료 (season_awards.photo_url)
--   2) scripts/upload-images.mjs 로 ~/devils-images 업로드 완료
--      (비로고 png는 업로드 시 .jpg로 변환됨 — 아래 URL은 변환 후 기준)
--   실행 후 docs/uploaded_images.md 와 URL이 일치하는지 확인할 것.
--
-- 기존 테이블(games, players)은 건드리지 않는다.
-- 재실행해도 안전 — 단순 UPDATE, 매칭 없는 행은 영향 없음.
-- ============================================================

-- ---------- 1) 시즌 어워즈 (23행 전체) ----------

update public.season_awards a
set photo_url = 'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/awards/' || v.file
from (
  values
    -- 2022 (Rookie 없음)
    ('2022', 'MVP',           '2022/mvp-35-leehowon.jpg'),
    ('2022', 'BEST_BATTER',   '2022/bb-46-kwonhyukjoon.jpg'),
    ('2022', 'BEST_PITCHER',  '2022/bp-52-yoonjunyoung.jpg'),
    ('2022', 'MOST_IMPROVED', '2022/mip-25-kangbaehyun.jpg'),
    ('2022', 'MANAGER',       '2022/manager-32-kimchaeyoung.jpg'),
    -- 2023
    ('2023', 'MVP',           '2023/mvp-22-kimkyungjae.jpg'),
    ('2023', 'BEST_BATTER',   '2023/bb-27-parkseongyeon.jpg'),
    ('2023', 'BEST_PITCHER',  '2023/bp-35-leehowon.jpg'),
    ('2023', 'MOST_IMPROVED', '2023/mip-11-kimtaekyeong.jpg'),
    ('2023', 'ROOKIE',        '2023/rookie-22-kimkyungjae.jpg'),
    ('2023', 'MANAGER',       '2023/manager-21-kimeuna.jpg'),
    -- 2024
    ('2024', 'MVP',           '2024/mvp-35-leehowon.jpg'),
    ('2024', 'BEST_BATTER',   '2024/bb-25-kangbaehyun.jpg'),
    ('2024', 'BEST_PITCHER',  '2024/bp-11-kimtaekyeong.jpg'),
    ('2024', 'MOST_IMPROVED', '2024/mip-17-jungjaehyeong.jpg'),
    ('2024', 'ROOKIE',        '2024/rookie-82-hwangseohyun.jpg'),
    ('2024', 'MANAGER',       '2024/manager-45-parkyeyoung.jpg'),
    -- 2025
    ('2025', 'MVP',           '2025/mvp-35-leehowon.jpg'),
    ('2025', 'BEST_BATTER',   '2025/bb-23-parksangeon.jpg'),
    ('2025', 'BEST_PITCHER',  '2025/bp-82-hwangseohyun.jpg'),
    ('2025', 'MOST_IMPROVED', '2025/mip-14-chokyungmin.jpg'),
    ('2025', 'ROOKIE',        '2025/rookie-13-limheechan.jpg'),
    ('2025', 'MANAGER',       '2025/manager-51-kimminjung.jpg')
) as v(season, award_type, file)
where a.season = v.season
  and a.award_type = v.award_type;

-- ---------- 2) Hall of Fame — Faculty 4명만 (학생/매니저는 디자인상 사진 없음) ----------

update public.hall_of_fame h
set photo_url = 'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/hof/' || v.file
from (
  values
    ('GREG HILL',    'faculty-greg-hill.jpg'),
    ('MARISA HILL',  'faculty-marisa-hill.jpg'),
    ('JAMES PARK',   'faculty-james-park.jpg'),
    ('MOLLY KINDER', 'faculty-molly-kinder.jpg')
) as v(name_en, file)
where h.hof_category = 'faculty'
  and h.name_en = v.name_en;

-- ---------- 3) 행사 사진 배열 (초안 p11 그룹, 대표컷이 배열 첫 장) ----------

update public.archive_events e
set photo_urls = v.urls
from (
  values
    ('2022 Utah Baseball Night', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2022-baseball-night/img-1585.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2022-baseball-night/img-1586.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2022-baseball-night/img-1589.jpg']),
    ('2023 Utah Baseball Night', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-125.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-128.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-1578.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-1579.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-1580.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2023-baseball-night/img-1588.jpg']),
    ('2025 Utah Baseball Night', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-baseball-night/img-1625.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-baseball-night/img-1626.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-baseball-night/img-1627.jpg']),
    ('제 16회 국회동심한마당', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-assembly-dongsim/img-169.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-assembly-dongsim/img-1581.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-assembly-dongsim/img-1582.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-assembly-dongsim/img-1583.jpg']),
    ('유타대학교 아시아캠퍼스 10주년 카니발', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-carnival-10th/img-1628.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-carnival-10th/img-1629.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2024-carnival-10th/img-1630.jpg']),
    ('2025 동심한마당', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-dongsim/img-1631.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-dongsim/img-1632.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-dongsim/img-1633.jpg']),
    ('2025 연수 능허대 문화축제', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-neungheodae/img-1672.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-neungheodae/img-1674.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025-neungheodae/img-1675.jpg']),
    ('제 104회 인천시 어린이날 기념행사', array[
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2026-childrens-day/img-1677.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2026-childrens-day/img-1678.jpg',
      'https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2026-childrens-day/img-1679.jpg'])
) as v(title, urls)
where e.title = v.title;

-- ---------- 검증 쿼리 ----------

-- select season, award_type, photo_url is not null as has_photo from public.season_awards order by season, award_type;
-- select name_en, photo_url from public.hall_of_fame where hof_category = 'faculty';
-- select title, coalesce(array_length(photo_urls, 1), 0) as photos from public.archive_events order by title;
