import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { getSupportRequestsByIds } from "../services/SupportRequests.service";
import { adaptSupportRequestsResponse } from "../adapters/supportRequests.adapter";
import { useSupportUnread } from "./SupportUnreadProvider";

/** Recibe los ids de las solicitudes con respuesta nueva (ya agrupados). */
type SupportReplyListener = (ids: string[]) => void;

interface SupportRealtimeContextType {
  /** Devuelve la función para desuscribirse. */
  subscribe: (listener: SupportReplyListener) => () => void;
  /** La solicitud abierta en el detalle: de esa no se muestra el toast. */
  setOpenRequest: (id: string | null) => void;
}

const SupportRealtimeContext = createContext<SupportRealtimeContextType>({
  subscribe: () => () => {},
  setOpenRequest: () => {},
});

/** Topic y evento que emite el backend (sp_support_broadcast_reply, T-996). */
const CHANNEL = "support-requests";
const EVENT = "support_reply";

/** Ventana para agrupar ráfagas: N eventos seguidos = un refetch y un toast por solicitud. */
const DEBOUNCE_MS = 1_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tiempo real del chat de soporte (T-997). UN solo canal para toda la app:
 * cuando el backend avisa que soporte respondió, se reparte la señal al
 * detalle abierto, al listado y al contador del menú, y se muestra un toast.
 *
 * El evento es SOLO una señal: viaja por un canal público (cualquiera con la
 * anon key podría emitirlo), así que nunca se pinta su contenido. Todo se
 * vuelve a pedir al servidor y el toast sale solo si el servidor confirma que
 * esa solicitud tiene respuestas sin leer; el S-n y el título salen de esa
 * respuesta, no del evento.
 *
 * Vive en DashboardLayout (dentro del router, para poder navegar desde el
 * toast) y solo con sesión. El polling de 20 s del detalle sigue como
 * respaldo si el canal cae.
 */
export function SupportRealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refresh: refreshUnreadCount } = useSupportUnread();

  const listenersRef = useRef(new Set<SupportReplyListener>());
  const openRequestRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const refreshCountRef = useRef(refreshUnreadCount);
  refreshCountRef.current = refreshUnreadCount;

  const pendingIdsRef = useRef(new Set<string>());
  const timerRef = useRef<number | null>(null);

  const subscribe = useCallback((listener: SupportReplyListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const setOpenRequest = useCallback((id: string | null) => {
    openRequestRef.current = id;
  }, []);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const ids = Array.from(pendingIdsRef.current);
    pendingIdsRef.current.clear();
    if (ids.length === 0) return;

    listenersRef.current.forEach((listener) => {
      try {
        listener(ids);
      } catch (error) {
        console.error("[support-realtime] error en un suscriptor:", error);
      }
    });
    refreshCountRef.current();

    // En la propia pantalla de Tickets la fila ya se marca: no hace falta toast
    if (pathnameRef.current === "/support") return;

    try {
      const { requests } = adaptSupportRequestsResponse(await getSupportRequestsByIds(ids));
      requests
        .filter((request) => request.hasUnread && request.id !== openRequestRef.current)
        .forEach((request) => {
          const code = request.code !== null ? `S-${request.code} · ` : "";
          toast({
            title: "Soporte respondió tu solicitud",
            description: `${code}${request.title}`,
            action: (
              <ToastAction
                altText="Ver la solicitud"
                onClick={() =>
                  navigateRef.current(`/support?open=${encodeURIComponent(request.id)}`)
                }
              >
                Ver
              </ToastAction>
            ),
          });
        });
    } catch (error) {
      // Sin confirmación del servidor no hay toast: el aviso es prescindible
      console.error("[support-realtime] no se pudo confirmar la respuesta:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(CHANNEL)
      .on("broadcast", { event: EVENT }, ({ payload }) => {
        const id = typeof payload?.suggestion_id === "string" ? payload.suggestion_id : "";
        if (!UUID_RE.test(id)) return;
        pendingIdsRef.current.add(id);
        if (timerRef.current === null) {
          timerRef.current = window.setTimeout(() => void flush(), DEBOUNCE_MS);
        }
      })
      .subscribe();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingIdsRef.current.clear();
      supabase.removeChannel(channel);
    };
  }, [user, flush]);

  const value = useMemo(() => ({ subscribe, setOpenRequest }), [subscribe, setOpenRequest]);

  return (
    <SupportRealtimeContext.Provider value={value}>{children}</SupportRealtimeContext.Provider>
  );
}

export function useSupportRealtime(): SupportRealtimeContextType {
  return useContext(SupportRealtimeContext);
}
