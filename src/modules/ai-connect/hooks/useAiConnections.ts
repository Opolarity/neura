import { useCallback, useEffect, useState } from "react";
import type { AiConnection } from "../types";
import { listGrants, revokeGrant } from "../services/aiConnect.service";
import { adaptConnection } from "../adapters/aiConnect.adapters";

/**
 * Apps que el usuario conecto al MCP de Neura. Es POR USUARIO: cada uno
 * autoriza su propio Claude o ChatGPT con su login del ERP.
 *
 * La autorizacion pasa en otra pestaña (Claude o ChatGPT abren /oauth/consent),
 * asi que al volver a esta se vuelve a consultar: es lo que hace que el estado
 * pase de "esperando" a "conectado" sin recargar.
 */
export function useAiConnections() {
  const [connections, setConnections] = useState<AiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const grants = await listGrants();
      setConnections(grants.map(adaptConnection));
      setError(null);
    } catch (err) {
      // Sin el servidor OAuth activo la consulta falla: la tarjeta sigue
      // sirviendo como guia, solo que sin estado.
      setError(err instanceof Error ? err.message : "No se pudo consultar la conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  const revoke = useCallback(
    async (clientId: string) => {
      await revokeGrant(clientId);
      await refresh();
    },
    [refresh]
  );

  return { connections, loading, error, refresh, revoke };
}
