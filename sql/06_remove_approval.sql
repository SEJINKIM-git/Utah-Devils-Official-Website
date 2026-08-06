-- ============================================================
-- 이메일 승인 기능 제거 (실행 전 대상 확인용)
-- auth.users 및 public.admin_members의 기존 계정/권한 데이터는 변경하지 않는다.
-- pgcrypto 확장은 다른 기능에서 사용할 수 있으므로 삭제하지 않는다.
-- ============================================================

drop function if exists public.create_admin_approval_request();
drop function if exists public.approve_admin_with_token(text);
drop table if exists public.admin_approval_requests;
