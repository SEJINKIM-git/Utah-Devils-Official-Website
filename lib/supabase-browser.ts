"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * /admin 전용 브라우저 클라이언트 — 쿠키 세션으로 미들웨어 가드와 공유한다.
 * 공개 페이지는 lib/supabase.ts(getSupabase, 세션 없음)를 그대로 사용할 것.
 */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createBrowserClient(url, key);
  return client;
}
