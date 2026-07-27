import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  image: string;
  alt: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  href: string;
  linkLabel: string;
  reverse?: boolean;
  redPanel?: boolean;
};

/** 홈의 사진-텍스트 전폭 스플릿. 사진은 원본 비율을 유지하고 모바일에서는 사진 다음 패널 순으로 쌓인다. */
export default function SplitFeature({
  image,
  alt,
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  reverse = false,
  redPanel = false,
}: Props) {
  return (
    <section
      className={`split-feature${reverse ? " split-feature--reverse" : ""}${redPanel ? " split-feature--red" : ""}`}
    >
      <div className="split-feature__image">
        <Image src={image} alt={alt} fill sizes="(max-width: 720px) 100vw, 50vw" />
      </div>
      <div className="split-feature__panel">
        <div className="journey-eyebrow">{eyebrow}</div>
        <h2 className="split-feature__title">{title}</h2>
        <p>{description}</p>
        <Link href={href} className="view-all split-feature__link">
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
