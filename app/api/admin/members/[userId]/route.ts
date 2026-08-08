import { NextResponse } from "next/server";
import { getServiceRoleSupabase, requireApprovedAdmin } from "@/lib/admin-api.server";

const PASSWORD_MIN_LENGTH = 8;

type Context = { params: { userId: string } };

async function getTargetAdmin(userId: string) {
  const admin = getServiceRoleSupabase();
  if (!admin) return { admin: null, exists: false };
  const { data, error } = await admin
    .from("admin_members")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .not("approved_at", "is", null)
    .maybeSingle();
  return { admin, exists: !error && data != null };
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireApprovedAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json({ message: "임시 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const { admin, exists } = await getTargetAdmin(params.userId);
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY 서버 환경변수가 필요합니다." }, { status: 503 });
  }
  if (!exists) return NextResponse.json({ message: "대상 운영진을 찾을 수 없습니다." }, { status: 404 });

  const { error } = await admin.auth.admin.updateUserById(params.userId, { password });
  if (error) {
    console.error("[admin-members] 비밀번호 재설정 실패:", error.message);
    return NextResponse.json({ message: "비밀번호를 재설정하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ message: "임시 비밀번호가 변경되었습니다." });
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await requireApprovedAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
  if (params.userId === auth.user.id) {
    return NextResponse.json({ message: "본인 계정은 이 화면에서 삭제할 수 없습니다." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const confirmedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!confirmedEmail) return NextResponse.json({ message: "삭제할 이메일을 다시 입력해 주세요." }, { status: 400 });

  const { admin, exists } = await getTargetAdmin(params.userId);
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY 서버 환경변수가 필요합니다." }, { status: 503 });
  }
  if (!exists) return NextResponse.json({ message: "대상 운영진을 찾을 수 없습니다." }, { status: 404 });

  const [{ count, error: countError }, { data: targetUser, error: userError }] = await Promise.all([
    admin
      .from("admin_members")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .not("approved_at", "is", null),
    admin.auth.admin.getUserById(params.userId),
  ]);
  if (countError || userError || !targetUser.user) {
    return NextResponse.json({ message: "계정 정보를 확인하지 못했습니다." }, { status: 500 });
  }
  if ((count ?? 0) <= 1) {
    return NextResponse.json({ message: "마지막 운영진 계정은 삭제할 수 없습니다." }, { status: 400 });
  }
  if (targetUser.user.email?.toLowerCase() !== confirmedEmail) {
    return NextResponse.json({ message: "입력한 이메일이 대상 계정과 일치하지 않습니다." }, { status: 400 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(params.userId);
  if (deleteError) {
    console.error("[admin-members] 계정 삭제 실패:", deleteError.message);
    return NextResponse.json({ message: "계정을 삭제하지 못했습니다." }, { status: 500 });
  }
  // FK on delete cascade가 admin_members 행을 정리한다. 혹시 제약 조건이 없는
  // 오래된 프로젝트에서도 정리되도록 한 번 더 시도한다.
  const { error: cleanupError } = await admin.from("admin_members").delete().eq("user_id", params.userId);
  if (cleanupError) console.error("[admin-members] membership 정리 확인 실패:", cleanupError.message);

  return NextResponse.json({ message: "운영진 계정이 삭제되었습니다." });
}
