-- ============================================================
-- Supabase에서 수동 생성한 계정 + 운영진 권한 분리
-- 콘텐츠·사진·운영 설정을 수정하려면
-- admin_members.role = 'admin' 및 approved_at 값이 모두 필요하다.
-- 기존 authenticated 전체 쓰기 정책(01/04/06/07)을 이 파일이 교체한다.
-- ============================================================

create table if not exists public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unid text not null unique,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_members enable row level security;

drop policy if exists "members read own membership" on public.admin_members;
drop policy if exists "members read own approval" on public.admin_members;
create policy "members read own membership"
  on public.admin_members for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_members
    where user_id = auth.uid() and role = 'admin' and approved_at is not null
  );
$$;

revoke all on function public.is_approved_admin() from public;
grant execute on function public.is_approved_admin() to anon, authenticated;

-- Auth 사용자 생성 시 profile 테이블에 자동 복사한다.
create or replace function public.create_member_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_members (user_id, unid, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'unid'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), new.email)
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_member_profile on auth.users;
create trigger on_auth_user_created_member_profile
  after insert on auth.users
  for each row execute procedure public.create_member_profile();

-- 이 파일 실행 전에 이미 존재하던 계정도 기본 member로 등록한다.
insert into public.admin_members (user_id, unid, display_name)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'unid'), ''), split_part(u.email, '@', 1)),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), u.email)
from auth.users u
on conflict (user_id) do nothing;

drop policy if exists "roster_members authenticated write" on public.roster_members;
create policy "admin write roster_members"
  on public.roster_members for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin write timeline_events" on public.timeline_events;
create policy "admin write timeline_events"
  on public.timeline_events for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin write archive_events" on public.archive_events;
create policy "admin write archive_events"
  on public.archive_events for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin read survey_responses" on public.survey_responses;
create policy "admin read survey_responses"
  on public.survey_responses for select to authenticated
  using (public.is_approved_admin());

drop policy if exists "admin write site_settings" on public.site_settings;
create policy "admin write site_settings"
  on public.site_settings for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin write site_content" on public.site_content;
create policy "admin write site_content"
  on public.site_content for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin upload official-site" on storage.objects;
create policy "admin upload official-site"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'official-site' and public.is_approved_admin());

drop policy if exists "admin replace official-site" on storage.objects;
create policy "admin replace official-site"
  on storage.objects for update to authenticated
  using (bucket_id = 'official-site' and public.is_approved_admin())
  with check (bucket_id = 'official-site' and public.is_approved_admin());

-- 운영진 권한 부여: Supabase에서 계정을 생성한 뒤 실제 UNID로 아래 쿼리를 한 번 실행한다.
-- update public.admin_members
-- set role = 'admin', approved_at = now()
-- where unid = '실제_UNID';
