import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  materialRequirementApi,
  refreshProductionOrderRecipeApi,
} from "../services/materialRequirement.service";
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

  const [refreshing, setRefreshing] = useState(false);

  /** Devuelve true si se actualizó, para que el detalle recargue la orden. */
  const refreshRecipe = useCallback(async () => {
    if (productionOrderId === null) return false;

    try {
      setRefreshing(true);
      const result = await refreshProductionOrderRecipeApi(productionOrderId);
      toast({
        title: "Receta actualizada",
        description:
          result.itemsRecipeChanged > 0
            ? `${result.itemsRefreshed} prendas al día; ${result.itemsRecipeChanged} pasaron a la receta de su producto.`
            : `${result.itemsRefreshed} prendas al día con su receta.`,
        variant: "success",
      });
      await load();
      return true;
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar la receta: " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [productionOrderId, load]);

  return { requirement, loading, reload: load, refreshing, refreshRecipe };
};
