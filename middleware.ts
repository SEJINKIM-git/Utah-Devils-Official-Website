import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin 가드 — 미인증 시 /admin/login으로. anon 키만 사용한다(service_role 금지).
 */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookies.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicMemberPage = ["/admin/login", "/admin/signup", "/admin/pending"].includes(
    req.nextUrl.pathname
  );
  if (!user && !isPublicMemberPage) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (!user) return res;

  const isLoginOrSignup = ["/admin/login", "/admin/signup"].includes(
    req.nextUrl.pathname
  );
  if (isLoginOrSignup) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const { data: membership } = await supabase
    .from("admin_members")
    .select("role, approved_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const approved = membership?.role === "admin" && membership.approved_at != null;

  if (!approved && req.nextUrl.pathname !== "/admin/pending") {
    return NextResponse.redirect(new URL("/admin/pending", req.url));
  }
  if (approved && req.nextUrl.pathname === "/admin/pending") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
