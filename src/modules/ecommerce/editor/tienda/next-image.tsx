// Sustituto de `next/image` para los bloques del editor en Vite: un <img> con
// el mismo contrato de props que usan los bloques (`fill`, `priority`...). Sin
// optimización: en el canvas se ve la imagen original.
import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "placeholder"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
};

export default function Image({
  src,
  fill,
  priority,
  quality: _quality,
  unoptimized: _unoptimized,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  style,
  loading,
  ...rest
}: ImageProps) {
  const url = typeof src === "string" ? src : src.src;
  // `fill` de next/image: ocupa el contenedor posicionado.
  const estilo: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style;

  return (
    <img
      src={url}
      style={estilo}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding="async"
      {...rest}
    />
  );
}
