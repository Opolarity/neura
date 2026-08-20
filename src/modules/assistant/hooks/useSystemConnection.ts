import { useCallback, useEffect, useState } from "react";
import type { AssistantConnection } from "../types";
import { disconnect, getConnection } from "../services/assistant.service";

/**
 * Estado de la conexion de la empresa. Es GLOBAL: la cuenta la conecta un admin
 * una sola vez y la usan todos, asi que este hook no depende del usuario.
 */
export function useSystemConnection() {
  const [connection, setConnection] = useState<AssistantConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setConnection(await getConnection());
    } catch (err) {
      setConnection(null);
      setError(err instanceof Error ? err.message : "No se pudo consultar el estado.");
    } finally {
      // En el finally a proposito: si una excepcion deja loading en true, la
      // pantalla se queda en el loader para siempre.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const revoke = useCallback(async () => {
    await disconnect();
    await refresh();
  }, [refresh]);

  return { connection, loading, error, refresh, revoke };
}
