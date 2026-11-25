import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { deletePunchApi, getPunchesApi, savePunchApi } from "../services/attendance.service";
import { Punch, PunchFilters, PunchPayload } from "../types/attendance.types";
import { generatePunchesExcel } from "../utils/generatePunchesExcel";

/** Marcas por pedido al juntar el Excel. */
const EXPORT_PAGE_SIZE = 500;

const errorText = (error: unknown) => (error instanceof Error ? error.message : undefined);

/**
 * Registro de marcas: filtros, paginación y correcciones del supervisor. Sin
 * filtro de fechas se ven las más recientes, 20 por página (como las demás tablas).
 */
export const useAttendancePunches = () => {
  const [filters, setFilters] = useState<PunchFilters>({
    dateFrom: null,
    dateTo: null,
    search: "",
    pointId: null,
  });
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [items, setItems] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPunchesApi(filters, pagination.p_page, pagination.p_size);
      setItems(res.items);
      setPagination((p) => ({ ...p, total: res.total }));
    } catch (error) {
      toast({ title: "Error al cargar las marcas", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeFilters = (next: Partial<PunchFilters>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPagination((p) => ({ ...p, p_page: 1 }));
  };

  const save = async (payload: PunchPayload): Promise<boolean> => {
    setSaving(true);
    try {
      await savePunchApi(payload);
      toast({ title: payload.id ? "Marca corregida" : "Marca registrada" });
      await load();
      return true;
    } catch (error) {
      toast({ title: "No se pudo guardar la marca", description: errorText(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (punch: Punch): Promise<boolean> => {
    setSaving(true);
    try {
      await deletePunchApi(punch.id);
      toast({ title: "Marca eliminada" });
      await load();
      return true;
    } catch (error) {
      toast({ title: "No se pudo eliminar la marca", description: errorText(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Excel con todas las marcas de los filtros aplicados, no solo esta página. */
  const exportar = async () => {
    setExporting(true);
    try {
      const all: Punch[] = [];
      let total = 0;
      let page = 1;
      do {
        const res = await getPunchesApi(filters, page, EXPORT_PAGE_SIZE);
        total = res.total;
        all.push(...res.items);
        if (res.items.length === 0) break;
        page += 1;
      } while (all.length < total);

      if (all.length === 0) {
        toast({ title: "No hay marcas para descargar", description: "Ajusta los filtros e inténtalo de nuevo." });
        return;
      }
      generatePunchesExcel(all, filters);
    } catch (error) {
      toast({ title: "No se pudo descargar las marcas", description: errorText(error), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return {
    filters,
    changeFilters,
    pagination,
    onPageChange: (page: number) => setPagination((p) => ({ ...p, p_page: page })),
    onPageSizeChange: (size: number) => setPagination((p) => ({ ...p, p_size: size, p_page: 1 })),
    items,
    loading,
    saving,
    exporting,
    exportar,
    save,
    remove,
    reload: load,
  };
};
