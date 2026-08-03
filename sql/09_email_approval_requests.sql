-- ============================================================
-- 운영진 이메일 승인 링크
-- 가입자가 요청을 만들면 Vercel API가 승인 담당 메일로 1회용 링크를 보낸다.
-- 링크를 누르면 해당 계정만 admin 권한으로 승인된다.
-- 실행 전제: sql/08_member_registration_roles.sql 실행 완료
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  requested_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.admin_approval_requests enable row level security;

-- 로그인한 가입자만 자기 계정의 승인 요청 토큰을 새로 만들 수 있다.
-- 이전 요청은 교체하므로 가장 최근에 받은 메일만 유효하다.
create or replace function public.create_admin_approval_request()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  raw_token text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_approved_admin() then
    raise exception 'This account is already approved';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.admin_approval_requests (user_id, token_hash, expires_at, used_at)
  values (
    auth.uid(),
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    now() + interval '72 hours',
    null
  )
  on conflict (user_id) do update
    set token_hash = excluded.token_hash,
        expires_at = excluded.expires_at,
        requested_at = now(),
        used_at = null;

  return raw_token;
end;
$$;

-- 이메일 링크에서만 호출한다. 토큰은 해시로만 저장되고, 승인 뒤 즉시 무효화된다.
create or replace function public.approve_admin_with_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  approved_user_id uuid;
begin
  update public.admin_approval_requests
  set used_at = now()
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and used_at is null
    and expires_at > now()
  returning user_id into approved_user_id;

  if approved_user_id is null then
    return false;
  end if;

  update public.admin_members
  set role = 'admin', approved_at = now()
  where user_id = approved_user_id;

  return true;
end;
$$;

revoke all on function public.create_admin_approval_request() from public;
grant execute on function public.create_admin_approval_request() to authenticated;

revoke all on function public.approve_admin_with_token(text) from public;
grant execute on function public.approve_admin_with_token(text) to anon, authenticated;

comment on table public.admin_approval_requests is
  '운영진 이메일 승인용 1회 토큰 해시. 원문 토큰은 저장하지 않는다.';
