"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CONTENT_META,
  DEFAULT_CONTENT,
  DEFAULT_SETTINGS,
  SETTING_MAX_LENGTH,
  type SiteContentKey,
  type SiteSettingKey,
} from "@/lib/site-content";
import { getAuthenticatedUser, getServerSupabase, isApprovedAdmin } from "@/lib/supabase-server";

type SaveTextInput = {
  table: "site_content" | "site_settings";
  key: string;
  value: string;
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

/** 저장 액션용 requireUser. 세션 만료·권한 없음은 예외 대신 팝오버에 보여줄 한국어 결과로 돌려준다. */
async function denyUnlessAdmin(): Promise<{ ok: false; message: string } | null> {
  try {
    await requireUser();
    return null;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "권한을 확인할 수 없습니다.";
    return { ok: false, message: `${reason} 다시 로그인한 뒤 시도해 주세요.` };
  }
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
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const isContent = input.table === "site_content";
  const allowed = isContent
    ? Object.hasOwn(DEFAULT_CONTENT, input.key)
    : Object.hasOwn(DEFAULT_SETTINGS, input.key);
  if (!allowed) return { ok: false, message: "수정할 수 없는 항목입니다." };

  const value = String(input.value ?? "").trim();
  const canBeEmpty = input.table === "site_settings" && input.key === "notice_banner";
  if (!value && !canBeEmpty) return { ok: false, message: "내용을 입력해 주세요." };
  const maxLength = isContent ? CONTENT_META[input.key as SiteContentKey].max : SETTING_MAX_LENGTH;
  if (value.length > maxLength) {
    return { ok: false, message: `글자 수는 ${maxLength}자 이하로 입력해 주세요.` };
  }

  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const updated = await supabase.from(input.table).update({ value }).eq("key", input.key).select("key");
  let error = updated.error;
  if (!error && (updated.data ?? []).length === 0) {
    // 시드에 없는 키는 update가 0행으로 끝나 저장된 것처럼 보인다. 이 경우에만 행을 새로 만든다.
    const label = isContent ? CONTENT_META[input.key as SiteContentKey].label : input.key;
    const row: Record<string, string | number | boolean> = isContent
      ? { key: input.key, value, label, max_length: maxLength, multiline: maxLength > 100 }
      : { key: input.key, value, label };
    ({ error } = await supabase.from(input.table).insert(row));
  }
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
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
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

const NOT_SAVED_MESSAGE = "저장하지 못했습니다. 권한이 없거나 항목이 삭제되었을 수 있습니다. 새로고침 후 다시 시도해 주세요.";

function storagePublicPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/official-site/`;
}

const IMAGE_TABLES = ["roster_members", "season_awards", "hall_of_fame", "products"] as const;
type ImageTable = (typeof IMAGE_TABLES)[number];

export async function saveEditableImage(input: {
  table: ImageTable;
  id: string;
  url: string;
  path: string;
}) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  if (!IMAGE_TABLES.includes(input.table) || !input.id || !String(input.url).startsWith(storagePublicPrefix())) {
    return { ok: false, message: "사진 정보를 확인해 주세요." };
  }
  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  let result: { error: { message: string } | null; data: unknown[] | null };
  if (input.table === "products") {
    // products는 photo_urls 배열을 쓰며 첫 사진이 대표다. 대표만 교체하고 나머지는 유지한다.
    const read = await supabase.from("products").select("photo_urls").eq("id", input.id).maybeSingle();
    if (read.error || !read.data) {
      console.error("[editable-image] products 조회 실패:", read.error?.message);
      return { ok: false, message: "사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    const rest = ((read.data.photo_urls ?? []) as string[]).slice(1);
    result = await supabase.from("products").update({ photo_urls: [input.url, ...rest] }).eq("id", input.id).select("id");
  } else {
    result = await supabase.from(input.table).update({ photo_url: input.url }).eq("id", input.id).select("id");
  }
  if (result.error) {
    console.error("[editable-image] 저장 실패:", result.error.message);
    return { ok: false, message: "사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (!result.data?.length) return { ok: false, message: NOT_SAVED_MESSAGE };
  revalidatePath(validPath(input.path));
  revalidatePath("/", "layout");
  return { ok: true, message: "사진이 반영되었습니다." };
}

/**
 * 인라인 편집이 허용된 행 단위 필드의 화이트리스트.
 * 여기 없는 테이블·컬럼은 서버가 거부한다 — games 등 분석 플랫폼 테이블은 절대 추가하지 않는다.
 */
type FieldRule =
  | { kind: "text"; max: number; nullable?: boolean }
  | { kind: "int"; min?: number; max: number; nullable?: boolean }
  | { kind: "date"; nullable?: boolean }
  | { kind: "lines"; max: number; nullable?: boolean }
  | { kind: "enum"; values: readonly string[] };

const ROW_FIELDS: Record<string, Record<string, FieldRule>> = {
  roster_members: {
    name_ko: { kind: "text", max: 40 },
    name_en: { kind: "text", max: 60, nullable: true },
    joined: { kind: "text", max: 20, nullable: true },
  },
  timeline_events: {
    month: { kind: "int", min: 1, max: 12, nullable: true },
    title: { kind: "text", max: 80 },
  },
  season_awards: {
    player_name: { kind: "text", max: 40 },
    player_name_en: { kind: "text", max: 60, nullable: true },
    player_number: { kind: "int", max: 999, nullable: true },
  },
  hall_of_fame: {
    name_ko: { kind: "text", max: 40 },
    name_en: { kind: "text", max: 60 },
    number: { kind: "int", max: 999, nullable: true },
    birth_date: { kind: "date", nullable: true },
    active_period: { kind: "text", max: 80, nullable: true },
    hof_points: { kind: "int", max: 9999, nullable: true },
    roles: { kind: "lines", max: 400, nullable: true },
    achievements: { kind: "lines", max: 400, nullable: true },
  },
  archive_events: {
    title: { kind: "text", max: 80 },
    event_date: { kind: "date", nullable: true },
    description: { kind: "text", max: 400, nullable: true },
  },
  products: {
    name: { kind: "text", max: 60 },
    description: { kind: "text", max: 400, nullable: true },
    price_estimate: { kind: "int", max: 9999999, nullable: true },
    status: { kind: "enum", values: ["planning", "survey", "ordered", "distributing", "closed"] },
  },
};

const DUPLICATE_MESSAGES: Record<string, string> = {
  season_awards: "같은 시즌·부문의 수상자가 이미 등록되어 있습니다. 시즌과 부문을 확인해 주세요.",
};

export async function saveEditableField(input: {
  table: string;
  id: string;
  column: string;
  value: string;
  path: string;
}) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const rule = Object.hasOwn(ROW_FIELDS, input.table) && Object.hasOwn(ROW_FIELDS[input.table], input.column)
    ? ROW_FIELDS[input.table][input.column]
    : null;
  if (!rule || !input.id) return { ok: false, message: "수정할 수 없는 항목입니다." };

  const raw = String(input.value ?? "").trim();
  let value: string | number | string[] | null;
  if (!raw) {
    if (!("nullable" in rule && rule.nullable)) return { ok: false, message: "내용을 입력해 주세요." };
    value = null;
  } else if (rule.kind === "text") {
    if (raw.length > rule.max) return { ok: false, message: `글자 수는 ${rule.max}자 이하로 입력해 주세요.` };
    value = raw;
  } else if (rule.kind === "int") {
    const min = rule.min ?? 0;
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > rule.max) {
      return { ok: false, message: `${min}~${rule.max} 사이의 숫자만 입력할 수 있습니다.` };
    }
    value = Number(raw);
  } else if (rule.kind === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
      return { ok: false, message: "날짜는 YYYY-MM-DD 형식으로 입력해 주세요." };
    }
    value = raw;
  } else if (rule.kind === "lines") {
    if (raw.length > rule.max) return { ok: false, message: `글자 수는 ${rule.max}자 이하로 입력해 주세요.` };
    value = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } else {
    if (!rule.values.includes(raw)) return { ok: false, message: "선택할 수 없는 값입니다." };
    value = raw;
  }

  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const { data, error } = await supabase
    .from(input.table)
    .update({ [input.column]: value })
    .eq("id", input.id)
    .select("id");
  if (error) {
    console.error("[editable-field] 저장 실패:", error.message);
    if (error.code === "23505") {
      return { ok: false, message: DUPLICATE_MESSAGES[input.table] ?? "이미 같은 값이 등록되어 있습니다. 중복되지 않는 값으로 입력해 주세요." };
    }
    return { ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (!data?.length) return { ok: false, message: NOT_SAVED_MESSAGE };
  revalidatePath(validPath(input.path));
  revalidatePath("/", "layout");
  return { ok: true, message: "저장되었습니다." };
}

/** 행사 사진 목록 저장 — 추가/삭제/대표 지정이 전부 이 하나로 처리된다. */
export async function saveEventPhotos(input: { id: string; urls: string[]; path: string }) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const storagePrefix = storagePublicPrefix();
  const valid =
    input.id &&
    Array.isArray(input.urls) &&
    input.urls.length <= 30 &&
    input.urls.every((url) => typeof url === "string" && (url.startsWith(storagePrefix) || url.startsWith("/images/")));
  if (!valid) return { ok: false, message: "사진 정보를 확인해 주세요. (최대 30장)" };

  const supabase = getServerSupabase();
  if (!supabase) return { ok: false, message: "저장 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요." };
  const { data, error } = await supabase
    .from("archive_events")
    .update({ photo_urls: input.urls })
    .eq("id", input.id)
    .select("id");
  if (error) {
    console.error("[event-photos] 저장 실패:", error.message);
    return { ok: false, message: "사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (!data?.length) return { ok: false, message: NOT_SAVED_MESSAGE };
  revalidatePath(validPath(input.path));
  revalidatePath("/", "layout");
  return { ok: true, message: "사진이 반영되었습니다." };
}
