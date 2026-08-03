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
