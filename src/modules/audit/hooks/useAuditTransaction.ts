import { useEffect, useState } from "react";
import { getAuditLogApi } from "../services/auditLog.service";
import { auditLogAdapter } from "../adapters/auditLog.adapter";
import { buildDefaultAuditFilters } from "./useAuditLog";
import type { AuditLogEntry } from "../types/AuditLog.types";

/**
 * Filas de la misma operación (mismo txid) que la entrada abierta en el detalle:
 * p. ej. un pedido del chatbot = venta + líneas + pago + estado + stock.
 */
export const useAuditTransaction = (entry: AuditLogEntry | null) => {
  const [related, setRelated] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAuditLogApi({
      ...buildDefaultAuditFilters(100),
      start_date: null,
      end_date: null,
      txid: entry.txid,
    })
      .then((res) => {
        if (!cancelled) setRelated(auditLogAdapter(res).entries);
      })
      .catch((err) => {
        console.error("Error loading audit transaction:", err);
        if (!cancelled) setRelated([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry?.txid, entry]);

  return { related, loading };
};
