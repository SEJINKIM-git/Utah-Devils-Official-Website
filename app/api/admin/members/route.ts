import { NextResponse } from "next/server";
import {
  emailToUnid,
  getServiceRoleSupabase,
  requireApprovedAdmin,
} from "@/lib/admin-api.server";

const PASSWORD_MIN_LENGTH = 8;

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export async function GET() {
  const auth = await requireApprovedAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const admin = getServiceRoleSupabase();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY 서버 환경변수가 필요합니다." },
      { status: 503 }
    );
  }

  const [{ data: members, error: membersError }, { data: authData, error: usersError }] =
    await Promise.all([
      admin
        .from("admin_members")
        .select("user_id, unid, display_name, role, approved_at, created_at")
        .eq("role", "admin")
        .not("approved_at", "is", null)
        .order("created_at", { ascending: true }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (membersError || usersError) {
    console.error("[admin-members] 목록 조회 실패:", membersError?.message ?? usersError?.message);
    return NextResponse.json({ message: "운영진 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const users = new Map(authData.users.map((user) => [user.id, user]));
  return NextResponse.json({
    currentUserId: auth.user.id,
    members: (members ?? []).map((member) => {
      const user = users.get(member.user_id);
      return {
        ...member,
        email: user?.email ?? "이메일 정보를 찾을 수 없습니다.",
        lastSignInAt: user?.last_sign_in_at ?? null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = await requireApprovedAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return badRequest("올바른 이메일 주소를 입력해 주세요.");
  if (password.length < PASSWORD_MIN_LENGTH) return badRequest("임시 비밀번호는 8자 이상이어야 합니다.");

  const admin = getServiceRoleSupabase();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY 서버 환경변수가 필요합니다." },
      { status: 503 }
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { unid: emailToUnid(email), display_name: email },
  });
  if (createError || !created.user) {
    console.error("[admin-members] 계정 생성 실패:", createError?.message);
    return NextResponse.json({ message: "계정을 생성하지 못했습니다. 이메일 중복 여부를 확인해 주세요." }, { status: 400 });
  }

  const { error: memberError } = await admin.from("admin_members").upsert(
    {
      user_id: created.user.id,
      unid: emailToUnid(email),
      display_name: email,
      role: "admin",
      approved_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (memberError) {
    // auth 생성만 성공한 상태를 남기지 않도록 보상 삭제한다.
    const { error: rollbackError } = await admin.auth.admin.deleteUser(created.user.id);
    console.error("[admin-members] membership 생성 실패:", memberError.message, rollbackError?.message);
    return NextResponse.json({ message: "권한 설정에 실패해 계정 생성을 취소했습니다." }, { status: 500 });
  }

  return NextResponse.json({ message: "운영진 계정이 생성되었습니다." }, { status: 201 });
}
