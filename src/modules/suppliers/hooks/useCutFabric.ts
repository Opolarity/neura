import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  addCutWasteApi,
  cutFabricApi,
  searchCutFabricApi,
  voidCutWasteApi,
} from "../services/cutFabric.service";
import { AddCutWasteInput, CutFabric, CutFabricOption } from "../types/cutFabric.types";

/**
 * La tela del corte de una OP (202610280002): lo que usó cada O/C, de qué
 * almacén y su consumo real. Se guarda con el corte, en «Iniciar corte»
 * (2026-10-30), y genera su egreso de Materiales vinculado a la OP.
 */
export const useCutFabric = (productionOrderId: number | null) => {
  const [data, setData] = useState<CutFabric | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;
    try {
      setLoading(true);
      setData(await cutFabricApi(productionOrderId));
    } catch (error) {
      toast({ title: "Error al cargar la tela del corte: " + (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [productionOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    reload: load,
  };
};

/** El buscador de tela del catálogo, con su stock por almacén (202610280004). */
export const useCutFabricSearch = (enabled: boolean) => {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<CutFabricOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const debounced = useDebounce(search, 300);

  useEffect(() => {
    if (!enabled) return;
    let vigente = true;
    setLoading(true);
    searchCutFabricApi(debounced)
      .then((found) => vigente && setOptions(found))
      .catch((error) =>
        toast({ title: "Error al buscar la tela: " + (error as Error).message, variant: "destructive" })
      )
      .finally(() => vigente && setLoading(false));
    return () => {
      vigente = false;
    };
  }, [debounced, enabled, version]);

  /** Vuelve a buscar: una tela recién ingresada ya tiene stock. */
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  return { search, setSearch, options, loading, refrescar };
};

/** Ingresar y anular la merma de una O/C (202611060010). */
export const useCutWaste = (onChanged: () => void | Promise<void>) => {
  const [saving, setSaving] = useState(false);

  const correr = useCallback(
    async (accion: () => Promise<void>, ok: string, fallo: string) => {
      try {
        setSaving(true);
        await accion();
        toast({ title: ok });
        await onChanged();
        return true;
      } catch (error) {
        toast({ title: `${fallo}: ${(error as Error).message}`, variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onChanged]
  );

  const add = useCallback(
    (input: AddCutWasteInput) => correr(() => addCutWasteApi(input), "Merma ingresada", "Error al ingresar la merma"),
    [correr]
  );
  const anular = useCallback(
    (id: number) => correr(() => voidCutWasteApi(id), "Merma anulada", "Error al anular la merma"),
    [correr]
  );

  return { saving, add, anular };
};
