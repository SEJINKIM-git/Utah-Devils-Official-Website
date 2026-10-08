"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveEditableField } from "@/app/actions/edit-mode";
import { useEditMode } from "./EditModeProvider";

export type EditableFieldProps = {
  table: string;
  id: string;
  column: string;
  /** 현재 값. 목록 컬럼(roles 등)은 줄바꿈으로 합쳐 넘긴다. */
  value: string;
  fieldType?: "input" | "textarea" | "select" | "lines" | "number" | "date";
  options?: { label: string; value: string }[];
  maxLength: number;
  /** 비울 수 있는 컬럼이면 true (서버 화이트리스트와 일치해야 저장된다). */
  allowEmpty?: boolean;
  /** 값이 비어 있을 때 편집 모드에서만 보여줄 자리 문구. */
  emptyLabel?: string;
  /**
   * 값이 있을 때만 그려지던 블록 요소의 클래스. 지정하면 공개 화면에서는 값이 없을 때 블록째 생략하고,
   * 편집 모드에서는 빈 블록에도 입력 자리를 보여준다.
   */
  wrapperClassName?: string;
  children: ReactNode;
};

/** 공개 화면의 테이블 행 필드를 그 자리에서 고치는 인라인 편집기. */
export default function EditableFieldClient({
  table,
  id,
  column,
  value,
  fieldType = "input",
  options = [],
  maxLength,
  allowEmpty = false,
  emptyLabel = "내용 입력",
  wrapperClassName,
  children,
}: EditableFieldProps) {
  const enabled = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMessage(null);
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!enabled) {
    if (!wrapperClassName) return <>{children}</>;
    return value ? <div className={wrapperClassName}>{children}</div> : null;
  }

  function cancel() {
    setDraft(value);
    setMessage(null);
    setOpen(false);
  }

  function save() {
    startTransition(async () => {
      try {
        const result = await saveEditableField({ table, id, column, value: draft, path: pathname });
        setMessage(result.message);
        if (result.ok) {
          setOpen(false);
          router.refresh();
        }
      } catch {
        setMessage("서버에 연결하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.");
      }
    });
  }

  const tooLong = fieldType !== "select" && draft.length > maxLength;

  const editor = (
    <span className={`editable${open ? " editable--open" : ""}`}>
      <span className="editable__content">
        {value ? children : <span className="editable__empty">{emptyLabel}</span>}
      </span>
      <button type="button" className="editable__trigger" onClick={() => { setMessage(null); setOpen(true); }} aria-label="이 항목 수정">✎</button>
      {open ? (
        <span className="editable__popover" role="dialog" aria-label="항목 수정">
          {fieldType === "textarea" || fieldType === "lines" ? (
            <textarea value={draft} maxLength={maxLength} autoFocus onChange={(event) => setDraft(event.target.value)} />
          ) : fieldType === "select" ? (
            <select value={draft} autoFocus onChange={(event) => setDraft(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          ) : fieldType === "date" ? (
            <input type="date" value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
          ) : (
            <input
              value={draft}
              maxLength={maxLength}
              autoFocus
              inputMode={fieldType === "number" ? "numeric" : undefined}
              pattern={fieldType === "number" ? "[0-9]*" : undefined}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          {fieldType === "lines" ? <span className="editable__count">한 줄에 한 항목씩 입력하세요.</span> : null}
          {fieldType !== "select" && fieldType !== "date" ? <span className="editable__count">{draft.length} / {maxLength}</span> : null}
          <span className="editable__actions"><button type="button" onClick={cancel}>취소</button><button type="button" disabled={pending || tooLong || (!draft.trim() && !allowEmpty)} onClick={save}>{pending ? "저장 중..." : "저장"}</button></span>
          {message ? <span className="editable__message" role="status">{message}</span> : null}
        </span>
      ) : null}
    </span>
  );

  return wrapperClassName ? <div className={wrapperClassName}>{editor}</div> : editor;
}
