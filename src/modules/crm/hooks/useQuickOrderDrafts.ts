import { useCallback, useState } from "react";
import type { QuickOrderDraft } from "../types/quickOrder.types";

/**
 * Un pedido en curso por conversación. Vive en la página y no en el panel:
 * el vendedor salta entre chats mientras los clientes contestan, y cambiar de
 * chat no puede vaciarle el carrito que estaba armando.
 *
 * No se persiste: un pedido a medio armar no sobrevive a recargar la página, y
 * está bien así (los precios y el stock de mañana no son los de hoy).
 */
export const useQuickOrderDrafts = () => {
  const [drafts, setDrafts] = useState<Record<string, QuickOrderDraft>>({});

  const get = useCallback((identity: string): QuickOrderDraft | undefined => drafts[identity], [drafts]);

  const set = useCallback((identity: string, draft: QuickOrderDraft) => {
    setDrafts((prev) => ({ ...prev, [identity]: draft }));
  }, []);

  const reset = useCallback((identity: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[identity];
      return next;
    });
  }, []);

  return { get, set, reset };
};
