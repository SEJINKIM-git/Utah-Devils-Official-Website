"use client";

import { useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveEditableText } from "@/app/actions/edit-mode";
import { useEditMode } from "./EditModeProvider";

type Props = {
  table: "site_content" | "site_settings";
  contentKey: string;
  value: string;
  fieldType?: "input" | "textarea" | "select";
  options?: { label: string; value: string }[];
  maxLength: number;
  children: ReactNode;
};

/** 공개 화면에서 사용하는 작은 인라인 텍스트 편집기. */
export default function Editable({
  table,
  contentKey,
  value,
  fieldType = "input",
  options = [],
  maxLength,
  children,
}: Props) {
  const enabled = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enabled) return <>{children}</>;

  function cancel() {
    setDraft(value);
    setMessage(null);
    setOpen(false);
  }

  const canBeEmpty = table === "site_settings" && contentKey === "notice_banner";

  function save() {
    startTransition(async () => {
      const result = await saveEditableText({ table, key: contentKey, value: draft, maxLength, path: pathname });
      setMessage(result.message);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <span className={`editable${open ? " editable--open" : ""}`}>
      <span className="editable__content">{children}</span>
      <button type="button" className="editable__trigger" onClick={() => setOpen(true)} aria-label="이 문구 수정">✎</button>
      {open ? (
        <span className="editable__popover" role="dialog" aria-label="문구 수정">
          {fieldType === "textarea" ? (
            <textarea value={draft} maxLength={maxLength} autoFocus onChange={(event) => setDraft(event.target.value)} />
          ) : fieldType === "select" ? (
            <select value={draft} onChange={(event) => setDraft(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          ) : (
            <input value={draft} maxLength={maxLength} autoFocus onChange={(event) => setDraft(event.target.value)} />
          )}
          <span className="editable__count">{draft.length} / {maxLength}</span>
          <span className="editable__actions"><button type="button" onClick={cancel}>취소</button><button type="button" disabled={pending || (!draft.trim() && !canBeEmpty)} onClick={save}>{pending ? "저장 중..." : "저장"}</button></span>
          {message ? <span className="editable__message" role="status">{message}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
