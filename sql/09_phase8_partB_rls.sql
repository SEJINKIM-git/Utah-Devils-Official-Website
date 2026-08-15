-- ============================================================
-- Phase 8 Part B: 인라인 편집이 쓰는 콘텐츠 테이블의 운영진 쓰기 정책
-- season_awards / hall_of_fame / products 는 RLS가 켜져 있지만
-- 저장소 SQL에 authenticated 쓰기 정책이 없어 인라인 편집이 막힌다.
-- sql/08 의 is_approved_admin() 패턴을 그대로 따른다.
-- 재실행해도 안전(drop policy if exists 후 재생성).
-- ⚠️ 분석 플랫폼 소유 테이블(games, players, batting/pitching_stats)은 건드리지 않는다.
-- ============================================================

drop policy if exists "admin write season_awards" on public.season_awards;
create policy "admin write season_awards"
  on public.season_awards for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin write hall_of_fame" on public.hall_of_fame;
create policy "admin write hall_of_fame"
  on public.hall_of_fame for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "admin write products" on public.products;
create policy "admin write products"
  on public.products for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());
