import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * 분석 플랫폼(Devils Insight AI)과 같은 Supabase 프로젝트를 공유한다.
 * 기존 테이블(players, games, batting_stats, pitching_stats)은 읽기 전용으로만 조회할 것.
 * env 미설정 시 null을 반환하고, 각 페이지는 notice로 graceful 처리한다.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Vercel 환경변수에 URL이 아닌 값이 저장되면 Supabase 클라이언트 생성 중
  // 빌드 전체가 중단될 수 있다. 설정 오류는 각 페이지의 안내 상태로 처리한다.
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }
  } catch {
    console.error("[supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid HTTP(S) URL");
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export const INSIGHT_AI_URL = "https://devils-insight-ai.vercel.app";
