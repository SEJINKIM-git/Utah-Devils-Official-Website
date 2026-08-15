"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveEventPhotos } from "@/app/actions/edit-mode";
import { useEditMode } from "./EditModeProvider";
import ImageUploader from "./ImageUploader";

type Props = {
  id: string;
  title: string;
  photos: string[];
};

/** 행사 카드의 사진 추가/삭제/대표 지정. 편집 모드에서만 렌더된다. */
export default function EditableEventPhotos({ id, title, photos }: Props) {
  const enabled = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // 업로드마다 새 파일명을 만들어 CDN 캐시에 이전 사진이 남지 않게 한다.
  const [uploadStamp, setUploadStamp] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enabled) return null;

  function commit(next: string[], afterSave?: () => void) {
    startTransition(async () => {
      const result = await saveEventPhotos({ id, urls: next, path: pathname });
      setMessage(result.message);
      if (result.ok) {
        afterSave?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="event-photos">
      <button type="button" className="event-photos__trigger" onClick={() => setOpen(!open)}>
        사진 관리 ({photos.length})
      </button>
      {open ? (
        <div className="event-photos__panel" role="dialog" aria-label={`${title} 사진 관리`}>
          {photos.length ? (
            <div className="event-photos__list">
              {photos.map((url, index) => (
                <figure key={url} className="event-photos__item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${title} 사진 ${index + 1}`} loading="lazy" />
                  {index === 0 ? <figcaption className="pill">대표</figcaption> : null}
                  <span className="event-photos__actions">
                    {index > 0 ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => commit([url, ...photos.filter((item) => item !== url)])}
                      >
                        대표 지정
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm("이 사진을 목록에서 삭제합니다.")) {
                          commit(photos.filter((item) => item !== url));
                        }
                      }}
                    >
                      삭제
                    </button>
                  </span>
                </figure>
              ))}
            </div>
          ) : (
            <p className="editable__message">등록된 사진이 없습니다. 아래에서 추가해 주세요.</p>
          )}
          <ImageUploader
            path={`events/${id}/${uploadStamp}.jpg`}
            mode="event"
            label="행사 사진"
            disabled={pending}
            onUploaded={({ url }) => commit([...photos, url], () => setUploadStamp(Date.now()))}
          />
          <button type="button" className="event-photos__close" onClick={() => setOpen(false)} disabled={pending}>
            닫기
          </button>
          {message ? <p className="editable__message" role="status">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
