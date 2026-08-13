"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS, type SiteContentKey, type SiteSettingKey } from "@/lib/site-content";
import { getAuthenticatedUser, getServerSupabase, isApprovedAdmin } from "@/lib/supabase-server";

type SaveTextInput = {
  table: "site_content" | "site_settings";
  key: string;
  value: string;
  maxLength: number;
  path: string;
};

function validPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

async function requireUser() {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  if (!(await isApprovedAdmin(user.id))) {
    throw new Error("승인된 운영진 계정이 필요합니다.");
  }
  return user;
}

export async function startEditMode() {
  await requireUser();
  cookies().set("edit_mode", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/");
}

export async function stopEditMode() {
  cookies().delete("edit_mode");
  redirect("/");
}

export async function saveEditableText(input: SaveTextInput) {
  await requireUser();
  const value = input.value.trim();
  const canBeEmpty = input.table === "site_settings" && input.key === "notice_banner";
  if (!value && !canBeEmpty) return { ok: false, message: "내용을 입력해 주세요." };
  if (value.length > input.maxLength) {
    return { ok: false, message: `글자 수는 ${input.maxLength}자 이하로 입력해 주세요.` };
  }

  const allowed = input.table === "site_content"
    ? Object.keys(DEFAULT_CONTENT).includes(input.key as SiteContentKey)
    : Object.keys(DEFAULT_SETTINGS).includes(input.key as SiteSettingKey);
  if (!allowed) return { ok: false, message: "수정할 수 없는 항목입니다." };

  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const { error } = await supabase.from(input.table).update({ value }).eq("key", input.key);
  if (error) {
    console.error("[editable] 저장 실패:", error.message);
    return { ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath(validPath(input.path));
  revalidatePath("/", "layout");
  return { ok: true, message: "저장되었습니다." };
}

/** 설정 화면의 일괄 저장. 허용된 키만 서버에서 갱신하고 관련 ISR을 즉시 무효화한다. */
export async function saveSiteSettings(values: Partial<Record<SiteSettingKey, string>>) {
  await requireUser();
  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const entries = Object.entries(values).filter(([key]) => key in DEFAULT_SETTINGS) as [SiteSettingKey, string][];
  for (const [key, raw] of entries) {
    const value = raw.trim();
    if (key !== "notice_banner" && !value) return { ok: false, message: "필수 설정을 입력해 주세요." };
    if (value.length > 200) return { ok: false, message: "설정 값은 200자 이하로 입력해 주세요." };
    if (key === "current_season" && !/^\d{4}$/.test(value)) return { ok: false, message: "현재 시즌은 네 자리 연도로 입력해 주세요." };
    if (key === "season_target_games" && (!/^\d+$/.test(value) || Number(value) > 99)) return { ok: false, message: "목표 경기 수는 0~99의 숫자로 입력해 주세요." };
  }
  const { error } = await supabase.from("site_settings").upsert(
    entries.map(([key, value]) => ({ key, value: value.trim() })),
    { onConflict: "key" }
  );
  if (error) {
    console.error("[settings] 저장 실패:", error.message);
    return { ok: false, message: "설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  ["/", "/players", "/schedule", "/archive", "/shop"].forEach((path) => revalidatePath(path));
  revalidatePath("/", "layout");
  return { ok: true, message: "설정이 즉시 반영되었습니다." };
}

const IMAGE_TABLES = ["roster_members", "season_awards", "hall_of_fame", "products"] as const;
type ImageTable = (typeof IMAGE_TABLES)[number];

export async function saveEditableImage(input: {
  table: ImageTable;
  id: string;
  url: string;
  path: string;
}) {
  await requireUser();
  if (!IMAGE_TABLES.includes(input.table) || !input.id || !input.url.startsWith("http")) {
    return { ok: false, message: "사진 정보를 확인해 주세요." };
  }
  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const { error } = await supabase.from(input.table).update({ photo_url: input.url }).eq("id", input.id);
  if (error) {
    console.error("[editable-image] 저장 실패:", error.message);
    return { ok: false, message: "사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath(validPath(input.path));
  revalidatePath("/", "layout");
  return { ok: true, message: "사진이 반영되었습니다." };
}
