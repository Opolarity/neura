// Destino de vuelta tras el login (?next=…). Solo rutas internas: un "next"
// absoluto o de protocolo relativo (//otro.com) convertiría el login en un
// redirector abierto.
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}

export function loginUrlWithNext(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
