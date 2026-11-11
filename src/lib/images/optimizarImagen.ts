import type { PeticionOptimizar, RespuestaOptimizar } from "./optimizarImagen.worker";

// Mismos ajustes que se aplicaron al storage de los tenants (22-10-2026).
// El QR va sin pérdida: un borde difuso puede impedir que se escanee.
const PERFILES = {
  foto: { ladoMax: 1600, calidad: 85, sinPerdida: false },
  banner: { ladoMax: 1920, calidad: 85, sinPerdida: false },
  logo: { ladoMax: 800, calidad: 90, sinPerdida: false },
  qr: { ladoMax: 1200, calidad: 100, sinPerdida: true },
} as const;

export type PerfilImagen = keyof typeof PERFILES;

// GIF (animaciones), SVG y PDF se suben tal cual.
const TIPOS_CONVERTIBLES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp"];

const nombreWebp = (nombre: string) => `${nombre.replace(/\.[^./\\]+$/, "") || "imagen"}.webp`;

// Si el worker no responde a tiempo se sube el original: la subida nunca se queda colgada.
const TOPE_MS = 30_000;
// Sin peticiones durante este tiempo, el worker se cierra para liberar la memoria del códec.
const INACTIVIDAD_MS = 120_000;

// Un solo worker para toda la sesión: el códec (wasm) se carga una vez y no en cada imagen.
let worker: Worker | null = null;
let siguienteId = 0;
let cierre: ReturnType<typeof setTimeout> | undefined;
const pendientes = new Map<number, (respuesta: RespuestaOptimizar) => void>();

function descartarWorker(error: string) {
  worker?.terminate();
  worker = null;
  for (const [id, resolver] of pendientes) resolver({ id, ok: false, error });
  pendientes.clear();
}

function obtenerWorker(): Worker {
  if (worker) return worker;
  const nuevo = new Worker(new URL("./optimizarImagen.worker.ts", import.meta.url), { type: "module" });
  nuevo.onmessage = (evento: MessageEvent<RespuestaOptimizar>) => {
    pendientes.get(evento.data.id)?.(evento.data);
    pendientes.delete(evento.data.id);
  };
  nuevo.onerror = (evento) => descartarWorker(evento.message || "Error en el worker");
  worker = nuevo;
  return nuevo;
}

function convertirEnWorker(peticion: Omit<PeticionOptimizar, "id">): Promise<RespuestaOptimizar> {
  clearTimeout(cierre);
  const id = ++siguienteId;
  const destino = obtenerWorker();
  let tope: ReturnType<typeof setTimeout> | undefined;
  return new Promise<RespuestaOptimizar>((resolve) => {
    pendientes.set(id, resolve);
    // Un worker que no contesta puede estar atascado: se descarta y la próxima imagen crea otro.
    tope = setTimeout(() => descartarWorker(`sin respuesta en ${TOPE_MS / 1000} s`), TOPE_MS);
    destino.postMessage({ ...peticion, id });
  }).finally(() => {
    clearTimeout(tope);
    if (pendientes.size === 0) cierre = setTimeout(() => descartarWorker("worker inactivo"), INACTIVIDAD_MS);
  });
}

/**
 * Devuelve la imagen en WebP, con el lado largo limitado según el perfil.
 * Nunca bloquea una subida: si no se puede convertir (HEIC, navegador antiguo...), devuelve el original.
 */
export async function optimizarImagen(archivo: File, perfil: PerfilImagen = "foto"): Promise<File> {
  if (!TIPOS_CONVERTIBLES.includes(archivo.type)) return archivo;

  try {
    const respuesta = await convertirEnWorker({ archivo, ...PERFILES[perfil] });
    if ("error" in respuesta) throw new Error(respuesta.error);

    // Un WebP que ya cabe en el perfil solo se recomprime si ahorra al menos un 10 %.
    if (archivo.type === "image/webp" && !respuesta.escalada && respuesta.datos.byteLength >= archivo.size * 0.9) {
      return archivo;
    }
    return new File([respuesta.datos], nombreWebp(archivo.name), { type: "image/webp", lastModified: Date.now() });
  } catch (error) {
    console.warn(`[optimizarImagen] se sube el original de ${archivo.name}:`, error);
    return archivo;
  }
}
