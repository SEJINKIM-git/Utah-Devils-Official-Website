import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 운영 점검용 헬스체크. 키는 앞 8자만 노출한다(전체 키 노출 금지).
 * 예: GET /api/health → { ok, env, db }
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  const env = {
    supabaseUrl: url ? new URL(url).host : null,
    anonKeyPrefix: key ? key.slice(0, 8) : null,
  };

  const db: Record<string, string> = {};
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, env, db: { error: "env 미설정" } },
      { status: 503 }
    );
  }

  const checks: Array<[string, string]> = [
    ["games", "id"],
    ["timeline_events", "id"],
    ["roster_members", "id"],
    ["hall_of_fame", "id"],
  ];
  let ok = true;
  for (const [table, col] of checks) {
    const { error, count } = await supabase
      .from(table)
      .select(col, { count: "exact", head: true });
    if (error) {
      ok = false;
      db[table] = `error: ${error.code}`;
    } else {
      db[table] = `ok (${count ?? 0} rows)`;
    }
  }

  return NextResponse.json({ ok, env, db }, { status: ok ? 200 : 503 });
}
