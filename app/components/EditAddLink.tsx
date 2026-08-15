"use client";

import Link from "next/link";
import { useEditMode } from "./EditModeProvider";

/** 편집 모드에서만 보이는 "+ 추가" 진입 링크. 생성은 admin 폼에서 한다. */
export default function EditAddLink({ href, label }: { href: string; label: string }) {
  const enabled = useEditMode();
  if (!enabled) return null;
  return (
    <Link href={href} className="edit-add-link">
      + {label}
    </Link>
  );
}
