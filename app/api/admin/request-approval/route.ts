import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const APPROVER_EMAIL = "u1579825@umail.utah.edu";

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const authorization = request.headers.get("authorization");
  if (!url || !anonKey || !resendKey || !authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Approval service is unavailable." }, { status: 503 });
  }

  const accessToken = authorization.slice("Bearer ".length);
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: token, error: requestError } = await supabase.rpc("create_admin_approval_request");
  if (requestError || !token) {
    return NextResponse.json({ error: "Could not create approval request." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const approveUrl = `${appUrl}/api/admin/approve?token=${encodeURIComponent(token)}`;
  const displayName = escapeHtml(String(userData.user.user_metadata.display_name ?? "Unknown member"));
  const unid = escapeHtml(String(userData.user.user_metadata.unid ?? "-"));
  const email = escapeHtml(userData.user.email ?? "-");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Resend 테스트 발신자는 Resend 계정에 연결된 수신 주소로만 보낼 수 있다.
      from: "Utah Devils Admin <onboarding@resend.dev>",
      to: [APPROVER_EMAIL],
      subject: `[Utah Devils] 운영진 승인 요청 · ${displayName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0e1428">
          <h2>운영진 승인 요청</h2>
          <p><strong>${displayName}</strong> 님이 관리자 권한을 요청했습니다.</p>
          <ul><li>UNID: ${unid}</li><li>학교 이메일: ${email}</li></ul>
          <p><a href="${approveUrl}" style="display:inline-block;padding:12px 18px;background:#e52020;color:#fff;text-decoration:none;border-radius:6px">운영진으로 승인하기</a></p>
          <p style="color:#667085;font-size:13px">이 링크는 72시간 동안 유효하며 한 번만 사용할 수 있습니다.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    console.error("[approval-email] Resend request failed", response.status);
    return NextResponse.json({ error: "Could not send approval email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
