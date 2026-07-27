import Image from "next/image";

type Props = { image: string; alt: string; label: string };

/** PDF 디자인 초안의 사진 언어를 상세 페이지에 일관되게 적용한다. */
export default function VisualBand({ image, alt, label }: Props) {
  return (
    <div className="visual-band">
      <Image src={image} alt={alt} fill sizes="(max-width: 1120px) 100vw, 1072px" />
      <div className="visual-band__shade" aria-hidden="true" />
      <span className="visual-band__label">{label}</span>
    </div>
  );
}
