-- ============================================================
-- Phase 8 A1: 관리자 사진 업로드용 Storage RLS
-- `official-site` 버킷에 대해서만 로그인(authenticated) 사용자 업로드·교체를 허용한다.
-- public URL 읽기는 버킷의 Public 설정을 그대로 사용한다.
-- service_role 키나 기존 분석 플랫폼 테이블은 사용하지 않는다.
-- ============================================================

drop policy if exists "admin upload official-site" on storage.objects;
create policy "admin upload official-site"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'official-site');

drop policy if exists "admin replace official-site" on storage.objects;
create policy "admin replace official-site"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'official-site')
  with check (bucket_id = 'official-site');
