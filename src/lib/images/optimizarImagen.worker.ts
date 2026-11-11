// Convierte imágenes a WebP fuera del hilo principal con el códec de Squoosh (@jsquash/webp).
// Un mismo worker atiende todas las peticiones de la sesión: el códec se carga una sola vez.
import encodeWebp from "@jsquash/webp/encode";

export interface PeticionOptimizar {
  id: number;
  archivo: Blob;
  ladoMax: number;
  calidad: number;
  sinPerdida: boolean;
}

export type RespuestaOptimizar =
  | { id: number; ok: true; datos: ArrayBuffer; escalada: boolean }
  | { id: number; ok: false; error: string };

const medidaDestino = (ancho: number, alto: number, ladoMax: number) => {
  const factor = Math.min(1, ladoMax / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * factor)), alto: Math.max(1, Math.round(alto * factor)) };
};

async function optimizar({ archivo, ladoMax, calidad, sinPerdida }: PeticionOptimizar): Promise<{ datos: ArrayBuffer; escalada: boolean }> {
  // imageOrientation aplica el EXIF: las fotos de celular quedan derechas.
  const original = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const destino = medidaDestino(original.width, original.height, ladoMax);
  const escalada = destino.ancho !== original.width || destino.alto !== original.height;

  // El escalado del navegador en calidad alta: casi instantáneo frente a lanczos3 en wasm.
  // Si un navegador ignora resizeWidth/Height, el drawImage de abajo escala igual.
  let mapa = original;
  if (escalada) {
    mapa = await createImageBitmap(original, {
      resizeWidth: destino.ancho,
      resizeHeight: destino.alto,
      resizeQuality: "high",
    });
    original.close();
  }

  const lienzo = new OffscreenCanvas(destino.ancho, destino.alto);
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("OffscreenCanvas sin contexto 2d");
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(mapa, 0, 0, destino.ancho, destino.alto);
  mapa.close();
  const pixeles = contexto.getImageData(0, 0, destino.ancho, destino.alto);

  return { datos: await encodeWebp(pixeles, { quality: calidad, lossless: sinPerdida ? 1 : 0 }), escalada };
}

self.onmessage = async (evento: MessageEvent<PeticionOptimizar>) => {
  const { id } = evento.data;
  try {
    const { datos, escalada } = await optimizar(evento.data);
    const respuesta: RespuestaOptimizar = { id, ok: true, datos, escalada };
    self.postMessage(respuesta, { transfer: [datos] });
  } catch (error) {
    const respuesta: RespuestaOptimizar = { id, ok: false, error: error instanceof Error ? error.message : String(error) };
    self.postMessage(respuesta);
  }
};
