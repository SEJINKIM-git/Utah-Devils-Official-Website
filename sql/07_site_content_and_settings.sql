-- Phase 8 A2: 사이트 설정·문구 관리 테이블과 RLS
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  label text not null,
  description text not null default ''
);

create table if not exists public.site_content (
  key text primary key,
  value text not null,
  label text not null,
  description text default '',
  multiline boolean not null default false,
  max_length int not null default 200
);

alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admin write site_settings" on public.site_settings;
create policy "admin write site_settings" on public.site_settings for all to authenticated using (true) with check (true);

drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "admin write site_content" on public.site_content;
create policy "admin write site_content" on public.site_content for all to authenticated using (true) with check (true);

insert into public.site_settings (key, value, label, description) values
  ('current_season', '2026', '현재 시즌', '로스터·스케줄·메인 위젯의 기본 시즌입니다.'),
  ('season_target_games', '6', '시즌 목표 경기 수', '진행 중 시즌에서 미정 경기(TBA) 수를 계산하는 기준입니다.'),
  ('instagram_url', 'https://www.instagram.com/uac.baseball', 'Instagram 링크', '푸터와 아카이브의 Instagram 링크입니다.'),
  ('youtube_url', 'https://youtube.com/@utahdevils', 'YouTube 링크', '푸터와 아카이브의 YouTube 링크입니다.'),
  ('notice_banner', '', '공지 배너', '값이 있으면 모든 페이지 헤더 아래에 표시됩니다.')
on conflict (key) do nothing;
