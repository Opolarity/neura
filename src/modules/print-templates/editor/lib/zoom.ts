/** Límites del zoom del lienzo, como factor (1 = tamaño real). */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.1;

export const clampZoom = (value: number) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

/** Un paso más cerca o más lejos, redondeado a la décima. */
export const stepZoom = (value: number, delta: number) =>
  clampZoom(Math.round((value + delta) * 10) / 10);
