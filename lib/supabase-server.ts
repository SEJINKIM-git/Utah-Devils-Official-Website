import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 서버에서 현재 로그인 세션을 확인하기 위한 anon-key 클라이언트다.
 * service_role 키는 사용하지 않는다.
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // 서버 컴포넌트에서는 쿠키 갱신이 허용되지 않을 수 있다. 로그인·로그아웃은
      // 브라우저 클라이언트와 middleware가 처리하므로 여기서는 읽기만 보장한다.
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 읽기 전용 렌더에서는 정상적인 경우다.
        }
      },
    },
  });
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
