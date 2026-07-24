"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * 행사 사진 라이트박스 — 라이브러리 없이 <dialog>로 구현.
 * 썸네일(첫 장) 클릭 → 전체 사진 넘겨보기.
 */
export default function EventLightbox({
  title,
  photos,
}: {
  title: string;
  photos: string[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  function open() {
    setIndex(0);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onKey(e: KeyboardEvent) {
      if (!dialog!.open) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photos.length]);

  return (
    <>
      <button
        type="button"
        className="event-thumb"
        onClick={open}
        aria-label={`${title} 사진 ${photos.length}장 보기`}
      >
        <Image
          src={photos[0]}
          alt={title}
          fill
          sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
        {photos.length > 1 ? (
          <span className="event-thumb__count">+{photos.length - 1}</span>
        ) : null}
      </button>

      <dialog
        ref={dialogRef}
        className="lightbox"
        onClick={(e) => {
          // 배경(backdrop 영역) 클릭 시 닫기
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="lightbox__inner">
          <div className="lightbox__head">
            <span className="lightbox__title">
              {title} · {index + 1}/{photos.length}
            </span>
            <button type="button" className="tab" onClick={close}>
              CLOSE ✕
            </button>
          </div>
          <div className="lightbox__stage">
            <Image
              key={photos[index]}
              src={photos[index]}
              alt={`${title} 사진 ${index + 1}`}
              fill
              sizes="90vw"
              style={{ objectFit: "contain" }}
            />
          </div>
          {photos.length > 1 ? (
            <div className="lightbox__nav">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setIndex((i) => (i - 1 + photos.length) % photos.length)
                }
                aria-label="이전 사진"
              >
                ←
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setIndex((i) => (i + 1) % photos.length)}
                aria-label="다음 사진"
              >
                →
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
