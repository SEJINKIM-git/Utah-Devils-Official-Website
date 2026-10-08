import { cache } from "react";
import { cookies } from "next/headers";
import { getAuthenticatedUser, isApprovedAdmin } from "@/lib/supabase-server";

/**
 * 편집 모드 여부. 쿠키만으로는 켜지지 않고, 요청마다 세션과 승인 운영진 여부를 다시 확인한다.
 * 편집 컴포넌트는 이 값이 false면 편집 props 자체를 클라이언트로 보내지 않는다.
 */
export const isEditModeActive = cache(async (): Promise<boolean> => {
  if (cookies().get("edit_mode")?.value !== "1") return false;
  const user = await getAuthenticatedUser();
  if (!user) return false;
  return isApprovedAdmin(user.id);
});
