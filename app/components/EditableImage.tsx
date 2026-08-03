"use client";

import { useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveEditableImage } from "@/app/actions/edit-mode";
import { useEditMode } from "./EditModeProvider";
import ImageUploader from "./ImageUploader";

type Props = {
  table: "roster_members" | "season_awards" | "hall_of_fame" | "products";
  id: string;
  uploadPath: string;
  mode: "portrait" | "event";
  children: ReactNode;
};

/** 사진 위에만 나타나는 교체 UI. 일반 방문자에게는 자식만 렌더한다. */
export default function EditableImage({ table, id, uploadPath, mode, children }: Props) {
  const enabled = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enabled) return <>{children}</>;

  return (
    <span className="editable-image">
      {children}
      <button type="button" className="editable-image__trigger" onClick={() => setOpen(true)}>사진 교체</button>
      {open ? (
        <span className="editable-image__popover" role="dialog" aria-label="사진 교체">
          <ImageUploader path={uploadPath} mode={mode} onUploaded={({ url }) => startTransition(async () => {
            const result = await saveEditableImage({ table, id, url, path: pathname });
            setMessage(result.message);
            if (result.ok) {
              setOpen(false);
              router.refresh();
            }
          })} />
          <button type="button" onClick={() => setOpen(false)} disabled={pending}>닫기</button>
          {message ? <span className="editable__message" role="status">{message}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
