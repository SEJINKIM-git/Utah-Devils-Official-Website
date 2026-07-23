-- ============================================================
-- 시드 1/5: 연혁 (timeline_events) — 부록 B 공식 확정본
-- 이미 들어간 행(2022년 4건, 2026년 '100명 돌파')과 중복되지 않게
-- (year, title) 존재 확인 패턴을 사용한다. 재실행해도 안전(멱등).
-- season 표기는 기존 데이터 규칙(SPRING/FALL 대문자)을 따른다.
-- ============================================================

insert into public.timeline_events (year, season, month, title, sort_order)
select v.year, v.season, v.month, v.title, v.sort_order
from (
  values
    -- 2022
    (2022, 'SPRING', 2,  '창단',                                                    10),
    (2022, 'SPRING', 5,  '2022 Utah Baseball Night 시구/시타 행사 참여',            20),
    (2022, 'SPRING', 5,  '육군사관학교와 교류전 개최 및 승리',                      30),
    (2022, 'FALL',   9,  '동아리 유튜브 채널 개설',                                 40),
    -- 2023
    (2023, 'SPRING', 4,  'IGC 저널 동아리 부문 기재',                               10),
    (2023, 'SPRING', 5,  '제 1회 동아리 MT 진행',                                   20),
    (2023, 'SPRING', 5,  '2023 Utah Baseball Night 기획 및 진행',                   30),
    (2023, 'SPRING', 5,  '2023 Utah Baseball Night 시구/시타 행사 참여',            40),
    (2023, 'FALL',   8,  '도봉구 야구협회장배 사회인 야구대회 공동 3위',            50),
    (2023, 'FALL',   9,  '제 11회 화성시장배 전국 사회인 야구대회 참가',            60),
    (2023, 'FALL',   10, '제 2회 동아리 MT 진행',                                   70),
    -- 2024
    (2024, 'SPRING', 2,  '팀업캠퍼스배 전국대학동아리야구대회 참가',                10),
    (2024, 'SPRING', 2,  '팀업캠퍼스배 전국대학동아리야구대회 릴레이 경기 우승',    20),
    (2024, 'SPRING', 4,  'IGC 최초 조지메이슨대학과 교류전 개최',                   30),
    (2024, 'SPRING', 5,  '제 3회 동아리 MT 진행',                                   40),
    (2024, 'SPRING', 5,  '제 16회 국회동심한마당 부스 운영',                        50),
    (2024, 'FALL',   8,  '2024 MMOVE 야구 페스티벌 대학 동아리부 8강',              60),
    (2024, 'FALL',   9,  '제 12회 화성시장배 전국 사회인 야구대회 참가',            70),
    (2024, 'FALL',   9,  '유타대학교 아시아캠퍼스 10주년 기념 카니발 부스 운영',    80),
    (2024, 'FALL',   10, '제 4회 동아리 MT 진행',                                   90),
    -- 2025
    (2025, 'SPRING', 2,  '2025 MMOVE WINTER BASEBALL FESTIVAL 사회인부 참가',       10),
    (2025, 'SPRING', 4,  '2025 Global Campus Sports Week 야구 우승',                20),
    (2025, 'SPRING', 5,  '제 5회 동아리 MT 진행',                                   30),
    (2025, 'SPRING', 5,  '2025 동심한마당 부스 운영',                               40),
    (2025, 'SPRING', 5,  '2025 유타대학교 Discover the U Day 부스 운영',            50),
    (2025, 'SPRING', 5,  '2025 Utah Baseball Night 기획 및 진행',                   60),
    (2025, 'FALL',   7,  '어웨이 유니폼 디자인 공모전 개최',                        70),
    (2025, 'FALL',   9,  '2025 유타대학교 Crimson Festival 부스 운영',              80),
    (2025, 'FALL',   10, '제 6회 동아리 MT 진행',                                   90),
    (2025, 'FALL',   10, '2025 연수 능허대 문화축제 유타대학교 체험 부스 운영',     100),
    (2025, 'FALL',   11, '종강 총회 및 2025 Utah Devils Awards 시상',               110),
    -- 2026
    (2026, 'SPRING', 2,  '동아리 누적 회원 학생 100명 돌파',                        10),
    (2026, 'SPRING', 4,  '제 7회 동아리 MT 진행',                                   20),
    (2026, 'SPRING', 5,  '제 104회 인천시 어린이날 기념행사 유타대학교 체험 부스 운영', 30),
    (2026, 'SPRING', 5,  '2026 Utah Baseball Night 기획 및 진행',                   40),
    (2026, 'SPRING', 5,  '2026 유타대학교 Discover the U Day 부스 운영',            50)
) as v(year, season, month, title, sort_order)
where not exists (
  select 1 from public.timeline_events t
  where t.year = v.year and t.title = v.title
);
