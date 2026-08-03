"use client";

import { useEffect, useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type UploadMode = "portrait" | "event";

type Props = {
  /** `official-site` 버킷 안의 파일 경로. 예: events/{event_id}/{timestamp}.jpg */
  path: string;
  mode: UploadMode;
  label?: string;
  disabled?: boolean;
  onUploaded: (result: { url: string; path: string }) => void;
};

const MAX_SOURCE_SIZE = 30 * 1024 * 1024;

function isHeic(file: File) {
  return (
    file.type.toLowerCase().includes("heic") ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

async function resizeToJpeg(file: File, maxWidth: number): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("image-load"));
      element.src = sourceUrl;
    });
    const ratio = Math.min(1, maxWidth / image.naturalWidth);
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.drawImage(image, 0, 0, width, height);
    const output = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!output) throw new Error("canvas-output");
    return output;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function ImageUploader({
  path,
  mode,
  label = "사진 업로드",
  disabled = false,
  onUploaded,
}: Props) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(next: File | undefined) {
    setMessage(null);
    if (!next) return;
    if (isHeic(next)) {
      setFile(null);
      setPreviewUrl(null);
      setMessage("아이폰 사진은 JPEG로 변환한 후 업로드해 주세요.");
      return;
    }
    if (!next.type.startsWith("image/")) {
      setMessage("JPG, PNG 또는 WEBP 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (next.size > MAX_SOURCE_SIZE) {
      setMessage("사진 용량이 너무 큽니다. 30MB 이하 파일을 선택해 주세요.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function upload() {
    if (!file || busy || disabled) return;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setMessage("업로드 설정을 확인할 수 없습니다. 운영진에게 문의해 주세요.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const output = await resizeToJpeg(file, mode === "portrait" ? 800 : 1400);
      const { error } = await supabase.storage.from("official-site").upload(path, output, {
        cacheControl: "3600",
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("official-site").getPublicUrl(path);
      onUploaded({ url: data.publicUrl, path });
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setMessage("사진이 업로드되었습니다. 저장 버튼을 눌러 반영해 주세요.");
    } catch {
      setMessage("업로드에 실패했습니다. 네트워크와 사진 형식을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="image-uploader">
      <label
        htmlFor={inputId}
        className={`image-uploader__drop${dragging ? " image-uploader__drop--active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || busy}
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="업로드 전 미리보기" className="image-uploader__preview" />
        ) : (
          <span>{label}을 선택하거나 이곳에 끌어다 놓으세요</span>
        )}
      </label>
      <div className="image-uploader__actions">
        <span>JPG · PNG · WEBP / {mode === "portrait" ? "인물 최대 800px" : "행사 최대 1400px"}</span>
        <button type="button" className="btn" onClick={upload} disabled={!file || busy || disabled}>
          {busy ? "업로드 중..." : "업로드"}
        </button>
      </div>
      {message ? <p className="image-uploader__message" role="status">{message}</p> : null}
    </div>
  );
}
