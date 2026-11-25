import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { getTimesheetApi } from "../services/attendance.service";
import { Timesheet } from "../types/attendance.types";

/**
 * Cuadre de horas por persona en un rango (máximo 3 meses, lo valida el SP).
 * El rango y la búsqueda los decide la pantalla: en Reportes salen de la
 * barra de filtros compartida (ReportsFilterBar) y se aplican con «Aplicar».
 */
export const useAttendanceTimesheet = (dateFrom: string | null, dateTo: string | null, search: string) => {
  const [data, setData] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setData(await getTimesheetApi(dateFrom, dateTo, search.trim() || null));
    } catch (error) {
      toast({
        title: "Error al cargar el cuadre de horas",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, reload: load };
};
