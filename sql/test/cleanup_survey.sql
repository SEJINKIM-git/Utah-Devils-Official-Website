-- ============================================================
-- SHOP 수요조사 E2E 테스트 정리 스크립트
-- 테스트 데이터 삭제
-- 
-- 실행: test_survey.sql 테스트 완료 후
-- ============================================================

-- 테스트 응답 삭제 (학번 9999%로 시작하는 모든 응답)
delete from public.survey_responses
where student_id like '9999%';

-- 테스트 수요조사 삭제 (product_surveys.title이 TEST로 시작하는 것)
delete from public.product_surveys
where title like 'TEST %';

-- 테스트 상품 삭제 (products.name이 TEST_로 시작하는 것)
delete from public.products
where name like 'TEST_%';

-- 확인
select count(*) as remaining_responses from public.survey_responses where student_id like '9999%';
select count(*) as remaining_surveys from public.product_surveys where title like 'TEST %';
select count(*) as remaining_products from public.products where name like 'TEST_%';
-- 모두 0이면 정리 완료
