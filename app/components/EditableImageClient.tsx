"use client";

import { useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveEditableImage } from "@/app/actions/edit-mode";
import { useEditMode } from "./EditModeProvider";
import ImageUploader from "./ImageUploader";

export type EditableImageProps = {
  table: "roster_members" | "season_awards" | "hall_of_fame" | "products";
  id: string;
  uploadPath: string;
  mode: "portrait" | "event";
  children: ReactNode;
};

/** 사진 위에만 나타나는 교체 UI. 일반 방문자에게는 자식만 렌더한다. */
export default function EditableImageClient({ table, id, uploadPath, mode, children }: EditableImageProps) {
  const enabled = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // 같은 파일명에 덮어쓰면 CDN·이미지 최적화 캐시가 이전 사진을 계속 보여준다. 교체마다 새 이름을 쓴다.
  const [stamp, setStamp] = useState(() => Date.now());
  const stampedPath = uploadPath.replace(/(\.[a-z0-9]+)?$/i, (ext) => `-${stamp}${ext}`);

  if (!enabled) return <>{children}</>;

  return (
    <span className={`editable-image${open ? " editable-image--open" : ""}`}>
      {children}
      <button type="button" className="editable-image__trigger" onClick={() => { setMessage(null); setOpen(true); }}>사진 교체</button>
      {open ? (
        <span className="editable-image__popover" role="dialog" aria-label="사진 교체">
          <ImageUploader path={stampedPath} mode={mode} disabled={pending} successMessage="업로드 완료. 공개 화면에 반영하는 중입니다..." onUploaded={({ url }) => startTransition(async () => {
            setStamp(Date.now());
            try {
              const result = await saveEditableImage({ table, id, url, path: pathname });
              setMessage(result.message);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              }
            } catch {
              setMessage("서버에 연결하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.");
            }
          })} />
          <button type="button" onClick={() => setOpen(false)} disabled={pending}>닫기</button>
          {message ? <span className="editable__message" role="status">{message}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
