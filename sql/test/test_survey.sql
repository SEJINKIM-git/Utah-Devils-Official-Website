-- ============================================================
-- SHOP 수요조사 E2E 테스트 스크립트
-- 테스트용 상품 + 수요조사 + 응답 데이터 세트
-- 
-- 실행 순서:
-- 1) test_survey.sql → 테스트 데이터 추가 (2가지 케이스)
-- 2) 배포 사이트 /shop 플로우 수동 테스트
-- 3) cleanup_survey.sql → 테스트 데이터 삭제
-- ============================================================

-- ============================================================
-- SETUP: 테스트용 상품 생성
-- ============================================================

-- 실제 products 스키마: type('giveaway'|'apparel'), status('survey' 등), price_estimate
-- (price/is_open/is_active 컬럼은 존재하지 않음 — 42703 주의)
insert into public.products (name, type, status, price_estimate)
select v.name, v.type, 'survey', v.price_estimate
from (
  values
    ('TEST_DEVILS_CAP_2026', 'apparel', 25000),
    ('TEST_DEVILS_JERSEY_2026', 'apparel', 45000),
    ('TEST_CLOSED_PRODUCT_2026', 'apparel', 30000)
) as v(name, type, price_estimate)
where not exists (
  select 1 from public.products p where p.name = v.name
);

-- ============================================================
-- SETUP: 테스트용 수요조사 생성
-- ============================================================

insert into public.product_surveys (product_id, title, size_options, opens_at, closes_at, is_open)
select p.id, 
       v.title,
       v.size_options,
       v.opens_at,
       v.closes_at,
       v.is_open
from public.products p
cross join (
  values
    ('TEST_DEVILS_CAP_2026', 'TEST CAP 수요조사', array['FREE', 'M', 'L', 'XL'], now() - interval '1 day', now() + interval '7 days', true),
    ('TEST_DEVILS_JERSEY_2026', 'TEST JERSEY 수요조사', array['M', 'L', 'XL', 'XXL'], now() - interval '1 day', now() + interval '7 days', true),
    -- 마감 케이스는 is_open=true + closes_at 과거로 둔다:
    -- /shop은 is_open=true인 조사만 노출하므로, 이렇게 해야 폼이 렌더링되고
    -- "수요조사가 마감되었습니다" 차단 동작을 실제로 확인할 수 있다
    ('TEST_CLOSED_PRODUCT_2026', 'TEST 마감 상품 수요조사', array['FREE'], now() - interval '10 days', now() - interval '1 day', true)
) as v(product_name, title, size_options, opens_at, closes_at, is_open)
where p.name = v.product_name
  and not exists (
    select 1 from public.product_surveys ps where ps.product_id = p.id
  );

-- ============================================================
-- TEST CASE 1: 정상 제출 (학번 9999001, 사이즈 M)
-- ============================================================

insert into public.survey_responses 
  (survey_id, name, student_id, size, quantity, contact, created_at)
select ps.id, 'Test User 1', '9999001', 'M', 1, '010-9999-0001', now()::timestamp
from public.product_surveys ps
join public.products p on ps.product_id = p.id
where p.name = 'TEST_DEVILS_CAP_2026'
  and ps.is_open = true
  and now()::timestamp between ps.opens_at and ps.closes_at
  and not exists (
    select 1 from public.survey_responses sr
    where sr.student_id = '9999001' and sr.survey_id = ps.id
  );

-- ============================================================
-- TEST CASE 2: 중복 제출 시도 (같은 학번 9999001 + 다른 상품)
-- 예상: Unique 제약 위반 또는 자동 스킵
-- ============================================================

insert into public.survey_responses
  (survey_id, name, student_id, size, quantity, contact, created_at)
select ps.id, 'Test User 1', '9999001', 'L', 1, '010-9999-0001', now()::timestamp
from public.product_surveys ps
join public.products p on ps.product_id = p.id
where p.name = 'TEST_DEVILS_JERSEY_2026'
  and ps.is_open = true
  and now()::timestamp between ps.opens_at and ps.closes_at
  and not exists (
    select 1 from public.survey_responses sr
    where sr.student_id = '9999001' and sr.survey_id = ps.id
  );

-- ============================================================
-- TEST CASE 3: 마감된 수요조사 제출 시도 (학번 9999002)
-- 예상: is_open=false 또는 closes_at < now이므로 실패해야 함 (RLS/CHECK 제약)
-- ============================================================

-- 주석: 이 케이스는 RLS 또는 애플리케이션 레벨에서 차단되어야 함
-- insert into public.survey_responses
--   (survey_id, name, student_id, size, quantity, contact, created_at)
-- select ps.id, 'Test User 2', '9999002', 'FREE', 1, '010-9999-0002', now()::timestamp
-- from public.product_surveys ps
-- join public.products p on ps.product_id = p.id
-- where p.name = 'TEST_CLOSED_PRODUCT_2026';

-- ============================================================
-- 검증 쿼리: 현재 상태 확인
-- ============================================================

-- 테스트 상품 및 수요조사 확인
select p.name, ps.title, ps.is_open, ps.opens_at, ps.closes_at, count(sr.id) as response_count
from public.products p
left join public.product_surveys ps on p.id = ps.product_id
left join public.survey_responses sr on ps.id = sr.survey_id
where p.name like 'TEST_%'
group by p.id, p.name, ps.id, ps.title, ps.is_open, ps.opens_at, ps.closes_at
order by p.name;

-- 수요조사 응답 확인
select sr.student_id, sr.name, p.name as product_name, ps.title as survey_title, sr.size, sr.quantity, sr.contact, sr.created_at
from public.survey_responses sr
join public.product_surveys ps on sr.survey_id = ps.id
join public.products p on ps.product_id = p.id
where sr.student_id like '9999%'
order by sr.created_at;

-- ============================================================
-- RLS 테스트 (Anon 역할에서 시도할 것)
-- ============================================================

-- Anon 권한으로 모든 응답 조회 시도: 불가능해야 함 (개인정보 보호)
-- select * from public.survey_responses;
-- 결과: 0행 또는 에러 → RLS 정상 작동

-- Anon 권한으로 자신의 응답만 조회 가능한지 테스트:
-- select sr.student_id, sr.size, sr.name, p.name 
-- from public.survey_responses sr
-- join public.product_surveys ps on sr.survey_id = ps.id
-- join public.products p on ps.product_id = p.id
-- where sr.student_id = '9999001';
-- 결과: RLS 정책에 따라 자신의 응답만 또는 0행
