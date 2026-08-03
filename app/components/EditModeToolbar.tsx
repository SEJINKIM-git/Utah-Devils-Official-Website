"use client";

import Link from "next/link";
import { useTransition } from "react";
import { stopEditMode } from "@/app/actions/edit-mode";

export default function EditModeToolbar() {
  const [pending, startTransition] = useTransition();
  return (
    <aside className="edit-toolbar" aria-label="사이트 편집 도구">
      <span className="edit-toolbar__status"><i aria-hidden="true" />편집 모드</span>
      <Link href="/admin">ADMIN</Link>
      <button type="button" disabled={pending} onClick={() => startTransition(() => stopEditMode())}>
        {pending ? "종료 중..." : "편집 종료"}
      </button>
    </aside>
  );
}
