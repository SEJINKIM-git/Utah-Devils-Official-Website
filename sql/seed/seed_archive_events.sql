-- ============================================================
-- 시드 5/5: 행사 아카이브 (archive_events) — 부록 E 공식 확정본
-- 사진은 이후 Storage(official-site 버킷) 업로드 후 photo_urls를
-- UPDATE로 연결한다 (지금은 빈 배열).
-- YouTube URL은 운영자 제공값. title 존재 확인 패턴 — 재실행 안전(멱등).
-- ============================================================

insert into public.archive_events (title, category, photo_urls, external_link)
select v.title, v.category, '{}'::text[], v.external_link
from (
  values
    ('2022 Utah Baseball Night',                  'baseball_night', null),
    ('2023 Utah Baseball Night',                  'baseball_night', null),
    ('2025 Utah Baseball Night',                  'baseball_night', null),
    ('2026 Utah Baseball Night',                  'baseball_night', null),
    ('제 16회 국회동심한마당',                    'booth',          null),
    ('2025 동심한마당',                           'booth',          null),
    ('유타대학교 아시아캠퍼스 10주년 카니발',     'booth',          null),
    ('2025 Discover the U Day',                   'booth',          null),
    ('2026 Discover the U Day',                   'booth',          null),
    ('2025 연수 능허대 문화축제',                 'booth',          null),
    ('제 104회 인천시 어린이날 기념행사',         'booth',          null),
    ('YouTube 채널',                              'media',          'https://youtube.com/@utahdevils'),
    ('Instagram @uac.baseball',                   'media',          'https://www.instagram.com/uac.baseball')
) as v(title, category, external_link)
where not exists (
  select 1 from public.archive_events e where e.title = v.title
);
