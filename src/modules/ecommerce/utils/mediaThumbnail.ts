/**
 * Miniaturas para la Galería de Medios.
 *
 * La grilla pintaba el archivo original dentro de una caja de ~200px: 324
 * archivos con 1.1 MB de media, y alguno de 46 MB. El navegador se descargaba y
 * decodificaba la imagen entera para mostrarla diminuta, y eso es lo que traba
 * el scroll —no el ancho de banda, sino el decode.
 *
 * Supabase Storage sirve las imágenes ya redimensionadas desde
 * /storage/v1/render/image/public/ (imgproxy), así que basta con reescribir la
 * URL pública. Está habilitado tanto en demo como en producción; comprobado
 * contra los dos hosts.
 *
 * El original se sigue usando tal cual en el diálogo de detalle y en el campo
 * de "URL del medio" —esa es la que se pega en el ecommerce y no debe llevar
 * nunca los parámetros de transformación.
 */

const PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_IMAGE_SEGMENT = "/storage/v1/render/image/public/";

interface ThumbnailOptions {
  /** Lado del recuadro en px. La grilla es aspect-square. */
  size?: number;
  /** Calidad JPEG/WebP de salida (1-100). */
  quality?: number;
}

/**
 * Devuelve la URL de la miniatura para una URL pública de Supabase Storage.
 *
 * Si la URL no es de storage (por ejemplo un medio externo cargado a mano) se
 * devuelve intacta: es preferible pintar el original a romper la imagen.
 */
export const getThumbnailUrl = (
  url: string,
  { size = 400, quality = 50 }: ThumbnailOptions = {}
): string => {
  if (!url || !url.includes(PUBLIC_OBJECT_SEGMENT)) return url;

  // Se reescribe solo el segmento de la ruta, no el host: los medios antiguos
  // apuntan al storage de producción y los nuevos al del entorno, y ambos
  // tienen el endpoint de transformación.
  const base = url.replace(PUBLIC_OBJECT_SEGMENT, RENDER_IMAGE_SEGMENT);

  // resize=cover recorta al cuadrado igual que hace el object-cover de la
  // tarjeta, así que se pide exactamente lo que se va a ver y nada más.
  const params = new URLSearchParams({
    width: String(size),
    height: String(size),
    resize: "cover",
    quality: String(quality),
  });

  return `${base}${base.includes("?") ? "&" : "?"}${params.toString()}`;
};
