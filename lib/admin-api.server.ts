import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type AdminCheck =
  | { ok: true; user: User }
  | { ok: false; status: 403 | 503; message: string };

/**
 * Route Handler 전용 인증 확인. service role을 사용하기 전에 반드시 실행한다.
 * anon 세션으로 현재 사용자를 확인하고, RLS가 허용하는 본인 membership 행으로
 * 승인된 admin인지 다시 검증한다.
 */
export async function requireApprovedAdmin(): Promise<AdminCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, status: 503, message: "서버 설정이 완료되지 않았습니다." };
  }

  const cookieStore = cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // Route Handler에서는 이 요청에 대해 세션 확인만 수행한다.
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 403, message: "권한이 없습니다." };

  const { data, error } = await supabase
    .from("admin_members")
    .select("role, approved_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || data?.role !== "admin" || data.approved_at == null) {
    return { ok: false, status: 403, message: "권한이 없습니다." };
  }
  return { ok: true, user };
}

/** 서버 Route Handler에서만 사용한다. 클라이언트 코드에서 import 금지. */
export function getServiceRoleSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function emailToUnid(email: string) {
  return email.split("@")[0]?.trim() || email;
}
