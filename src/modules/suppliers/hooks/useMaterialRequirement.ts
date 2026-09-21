import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { materialRequirementApi } from "../services/materialRequirement.service";
import { MaterialRequirement } from "../types/materialRequirement.types";

/**
 * `reloadKey` fuerza el recálculo: cambiar la cantidad de una prenda o su
 * explosión cambia el requerimiento, así que el detalle lo sube al guardar.
 */
export const useMaterialRequirement = (
  productionOrderId: number | null,
  reloadKey = 0
) => {
  const [requirement, setRequirement] = useState<MaterialRequirement | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;

    try {
      setLoading(true);
      setRequirement(await materialRequirementApi(productionOrderId));
    } catch (error: any) {
      toast({
        title: "Error al calcular el requerimiento: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productionOrderId, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { requirement, loading, reload: load };
};
