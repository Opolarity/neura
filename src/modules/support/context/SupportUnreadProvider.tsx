import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { getSupportUnreadCount } from "../services/SupportRequests.service";

interface SupportUnreadContextType {
  /** Solicitudes con respuestas de soporte sin leer (0 sin sesión o si falla). */
  count: number;
  /** Vuelve a contar (al marcar leído, al llegar una respuesta). */
  refresh: () => void;
}

/**
 * Sin provider (tests, pantallas fuera de la app) el contador es 0 y refresh no
 * hace nada: el menú no debe romperse por esto.
 */
const SupportUnreadContext = createContext<SupportUnreadContextType>({
  count: 0,
  refresh: () => {},
});

/** Cada cuánto se recuenta con la pestaña visible (el conteo cruza dos saltos). */
const REFRESH_INTERVAL_MS = 120_000;

/**
 * Número del menú "Tickets" (T-993). Montado en App junto a
 * NotificationsProvider: un solo conteo compartido por el menú, el listado y,
 * con T-997, el aviso en tiempo real. Solo cuenta con sesión; errores en
 * silencio (sin toast): el peor caso es no ver el número.
 */
export function SupportUnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const userIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const response = await getSupportUnreadCount();
      // La sesión pudo cambiar mientras tanto: no se pinta el conteo de otro
      if (userIdRef.current !== userId) return;
      setCount(Math.max(0, Number(response?.data?.count ?? 0) || 0));
    } catch (error) {
      console.error("[support-unread] no se pudo contar las solicitudes sin leer:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
    if (!user) {
      setCount(0);
      return;
    }

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [user, load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);

  return <SupportUnreadContext.Provider value={value}>{children}</SupportUnreadContext.Provider>;
}

export function useSupportUnread(): SupportUnreadContextType {
  return useContext(SupportUnreadContext);
}
