import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  cutOrdersApi,
  deleteCutOrderApi,
  nextCutOrderCodeApi,
  registerCutFullApi,
  setCutPlannedDateApi,
} from "../services/cutOrders.service";
import { CutOrders, RegisterCutFullPayload } from "../types/cutOrders.types";

/**
 * Las órdenes de corte de una OP: leerlas, borrarlas y registrar el corte
 * realizado con «Iniciar corte» (`registerCutFull`, 2026-10-30). `onChanged`
 * recarga lo que depende de ellas (el resumen de la orden).
 */
export const useCutOrders = (productionOrderId: number | null, onChanged?: () => void) => {
  const [data, setData] = useState<CutOrders | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;
    try {
      setLoading(true);
      setData(await cutOrdersApi(productionOrderId));
    } catch (error) {
      toast({ title: "Error al cargar las órdenes de corte: " + (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [productionOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, ok: string): Promise<boolean> => {
    try {
      setWorking(true);
      await action();
      toast({ title: ok, variant: "success" });
      await load();
      onChanged?.();
      return true;
    } catch (error) {
      toast({ title: (error as Error).message, variant: "destructive" });
      return false;
    } finally {
      setWorking(false);
    }
  };

  return {
    data,
    loading,
    working,
    reload: load,
    remove: (cutOrderId: number) => run(() => deleteCutOrderApi(cutOrderId), "Orden de corte borrada"),
    /**
     * «Iniciar corte» (2026-10-30): el corte de un estilo + color y su tela,
     * en una sola transacción. Devuelve si se guardó (el aviso ya salió).
     */
    registerCutFull: async (payload: RegisterCutFullPayload): Promise<boolean> => {
      if (productionOrderId === null) return false;
      try {
        setWorking(true);
        const { code } = await registerCutFullApi(productionOrderId, payload);
        toast({
          title: payload.correct ? `O/C ${code} corregida` : `Corte registrado en la O/C ${code}`,
          variant: "success",
        });
        await load();
        onChanged?.();
        return true;
      } catch (error) {
        toastError(error, "No se pudo guardar el corte");
        return false;
      } finally {
        setWorking(false);
      }
    },
    nextCode: nextCutOrderCodeApi,
    /** La fecha programada del Corte de la OP (202610280015). */
    setPlannedDate: (date: string | null) =>
      productionOrderId === null
        ? Promise.resolve(false)
        : run(() => setCutPlannedDateApi(productionOrderId, date), "Fecha programada de corte guardada"),
  };
};
