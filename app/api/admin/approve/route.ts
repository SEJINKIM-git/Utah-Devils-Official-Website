import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const loginUrl = new URL("/admin/login", request.nextUrl.origin);

  if (!token || !url || !anonKey) {
    loginUrl.searchParams.set("approval", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient(url, anonKey);
  const { data: approved, error } = await supabase.rpc("approve_admin_with_token", { p_token: token });
  loginUrl.searchParams.set("approval", !error && approved ? "success" : "invalid");
  return NextResponse.redirect(loginUrl);
}
