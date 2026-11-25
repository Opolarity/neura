/** 485 → "8 h 05"; 0 → "0 h"; null → "—". */
export const formatMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return "—";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${sign}${h} h` : `${sign}${h} h ${String(m).padStart(2, "0")}`;
};

/**
 * Tramos del día en "Marcar mi asistencia": cada entrada con la salida que la
 * cierra. Salir a almorzar y volver a entrar da dos tramos. Una salida sin
 * entrada previa queda como tramo sin entrada. Los minutos son solo
 * informativos; el cálculo oficial es el del Cuadre de horas (servidor).
 */
export interface PunchSegment<P> {
  in: P | null;
  out: P | null;
  /** Minutos del tramo; si sigue abierto, hasta `nowMs`. null = sin entrada. */
  minutes: number | null;
}

export const punchSegments = <P extends { punchType: "IN" | "OUT"; punchedAt: string }>(
  punches: P[],
  nowMs: number,
): PunchSegment<P>[] => {
  const mins = (from: string, to: number) => Math.max(0, Math.floor((to - new Date(from).getTime()) / 60_000));
  const segments: PunchSegment<P>[] = [];
  let open: P | null = null;
  for (const p of punches) {
    if (p.punchType === "IN") {
      if (open) segments.push({ in: open, out: null, minutes: null });
      open = p;
    } else if (open) {
      segments.push({ in: open, out: p, minutes: mins(open.punchedAt, new Date(p.punchedAt).getTime()) });
      open = null;
    } else {
      segments.push({ in: null, out: p, minutes: null });
    }
  }
  if (open) segments.push({ in: open, out: null, minutes: mins(open.punchedAt, nowMs) });
  return segments;
};

/** Horas decimales para el Excel: 485 → 8.08. */
export const minutesToHours = (minutes: number): number => Math.round((minutes / 60) * 100) / 100;

/** Por qué no hubo ubicación: permiso negado, sin señal o tardó demasiado. */
export type LocationError = "denied" | "unavailable" | "timeout";

export type LocationResult = { pos: GeolocationPosition } | { error: LocationError };

const toLocationError = (e: GeolocationPositionError): LocationError =>
  e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable";

const askPosition = (options: PositionOptions): Promise<LocationResult> =>
  new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ pos }),
      (e) => resolve({ error: toLocationError(e) }),
      options,
    ),
  );

/**
 * Ubicación del navegador. Acepta una posición de hasta 1 minuto; si la de alta
 * precisión no llega (equipo sin GPS, lugar cerrado), reintenta una vez en
 * precisión normal. Devuelve la causa si no hay ubicación.
 */
export const getBrowserLocation = async (): Promise<LocationResult> => {
  if (!("geolocation" in navigator)) return { error: "unavailable" };
  const first = await askPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  if ("pos" in first || first.error === "denied") return first;
  return askPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 });
};

/** El mensaje para el trabajador según por qué no hubo ubicación. */
export const LOCATION_ERROR_MESSAGES: Record<LocationError, string> = {
  denied: "Permiso de ubicación negado: actívalo en el candado de la barra del navegador",
  unavailable: "No se pudo obtener la ubicación: revisa el GPS o el wifi y vuelve a intentar",
  timeout: "La ubicación tardó demasiado: vuelve a intentar",
};

const KIOSK_KEY = "neura.attendance.kiosk";

/** El secreto del equipo vive solo en este navegador: sin él, /asistencia no marca. */
export const saveKioskSecret = (secret: string) => {
  try {
    localStorage.setItem(KIOSK_KEY, secret);
  } catch {
    /* navegador sin almacenamiento: el kiosco no podrá abrir */
  }
};

export const readKioskSecret = (): string | null => {
  try {
    return localStorage.getItem(KIOSK_KEY);
  } catch {
    return null;
  }
};

/** El link del kiosco para compartir (se abre sin sesión). */
export const kioskUrl = (token: string) => `${window.location.origin}/asistencia/${token}`;

/** Nombre con que queda un equipo activado por el link (se puede ver en Kiosco). */
export const kioskDeviceName = () => {
  const ua = navigator.userAgent;
  const tipo = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? "Tablet"
    : /Mobi|Android|iPhone/i.test(ua)
      ? "Celular"
      : "Computadora";
  const cuando = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return `${tipo} · ${cuando}`;
};

const PUNCH_WORD = { IN: "entrada", OUT: "salida" } as const;

/**
 * Doble toque (otra marca en menos de 1 minuto): qué ya quedó y desde cuándo
 * se puede marcar lo siguiente. null si no aplica.
 */
export const duplicateMessage = (
  r: { duplicate: boolean; punchType: "IN" | "OUT" | null; punchedAt: string | null; nextType: "IN" | "OUT" | null; nextAt: string | null },
  formatTime: (iso: string) => string,
): string | null => {
  if (!r.duplicate || !r.punchType || !r.nextType || !r.nextAt) return null;
  const hecha = PUNCH_WORD[r.punchType];
  const sigue = PUNCH_WORD[r.nextType];
  return `Tu ${hecha} ya quedó registrada${r.punchedAt ? ` a las ${formatTime(r.punchedAt)}` : ""}. La ${sigue} se puede marcar desde las ${formatTime(r.nextAt)}.`;
};
