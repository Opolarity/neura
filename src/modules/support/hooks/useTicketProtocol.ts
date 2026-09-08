/**
 * Trae el protocolo de respuestas de tickets desde OPOLARITY.
 *
 * El documento explica cómo se atiende al cliente: es justo lo que no puede
 * aparecer en blanco. Por eso hay tres capas y la vista SIEMPRE tiene algo que
 * pintar, incluso sin red:
 *
 *   1. memoria del módulo — la misma pestaña no vuelve a pedirlo en 30 min;
 *   2. localStorage — sobrevive a recargas y a quedarse sin conexión;
 *   3. la constante compilada — primer arranque sin red, o instalación sin la
 *      API key configurada.
 *
 * Siempre se pinta la copia primero y se refresca en segundo plano; si llega
 * una versión distinta, se reemplaza. Un fallo solo se avisa con `isStale`,
 * nunca con un toast: no es una operación que el usuario haya pedido.
 *
 * No usa React Query a propósito: el resto del módulo de soporte resuelve sus
 * datos con useState/useEffect y meter otro modelo solo para esto haría el
 * módulo más difícil de leer, no más simple.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { adaptTicketProtocol } from "../adapters/ticketProtocol.adapter";
import { TICKET_PROTOCOL_FALLBACK } from "../constants/ticketProtocolFallback";
import { getTicketProtocol } from "../services/SupportProtocol.service";
import type { TicketProtocol } from "../types/Support.types";

const STORAGE_KEY = "opolarity.ticketProtocol";
const MEMORY_TTL_MS = 30 * 60 * 1000;

const FALLBACK: TicketProtocol = {
  title: TICKET_PROTOCOL_FALLBACK.title,
  subtitle: TICKET_PROTOCOL_FALLBACK.subtitle,
  html: TICKET_PROTOCOL_FALLBACK.html,
  version: TICKET_PROTOCOL_FALLBACK.version,
  updatedAt: null,
};

let cached: { doc: TicketProtocol; fetchedAt: number } | null = null;

const readStored = (): TicketProtocol | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TicketProtocol;
    return parsed?.html ? parsed : null;
  } catch {
    // Modo incógnito, cuota llena o JSON corrupto: se sigue con el respaldo.
    return null;
  }
};

const writeStored = (doc: TicketProtocol) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Guardar la copia es una comodidad, no un requisito.
  }
};

interface UseTicketProtocolResult {
  protocol: TicketProtocol;
  /** Se está mostrando una copia porque la última consulta falló. */
  isStale: boolean;
  refetch: () => void;
}

export const useTicketProtocol = (enabled: boolean): UseTicketProtocolResult => {
  const [protocol, setProtocol] = useState<TicketProtocol>(
    () => cached?.doc ?? readStored() ?? FALLBACK,
  );
  const [isStale, setIsStale] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Evita que una respuesta lenta pise el estado de un modal ya cerrado.
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const fresh = cached && Date.now() - cached.fetchedAt < MEMORY_TTL_MS;
    if (fresh && reloadKey === 0) {
      setProtocol(cached!.doc);
      setIsStale(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const doc = adaptTicketProtocol(await getTicketProtocol());
        if (cancelled || !activeRef.current) return;
        cached = { doc, fetchedAt: Date.now() };
        writeStored(doc);
        setProtocol(doc);
        setIsStale(false);
      } catch {
        // Se conserva lo que ya se está mostrando: la copia local o el respaldo.
        if (cancelled || !activeRef.current) return;
        setIsStale(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { protocol, isStale, refetch };
};
