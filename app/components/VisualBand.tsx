import Image from "next/image";

type Props = { image: string; alt: string; label: string };

/** 상세 페이지의 사진 배경. 장식 오브젝트 없이 텍스트와 흐린 사진만 남긴다. */
export default function VisualBand({ image, alt, label }: Props) {
  return (
    <div className="visual-band">
      <Image src={image} alt={alt} fill sizes="(max-width: 1120px) 100vw, 1072px" />
      <div className="visual-band__shade" aria-hidden="true" />
      <span className="visual-band__label">{label}</span>
    </div>
  );
}
