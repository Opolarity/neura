import { useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { processesListApi } from "../services/processes.service";
import { ActiveFilter } from "../types/processes.types";
import { generateOperationsMasterExcel } from "../utils/generateOperationsMasterExcel";

interface ExportFilters {
  search: string;
  isActive: ActiveFilter;
  /** Total de filas con los filtros vigentes (de la paginación). */
  total: number;
}

/**
 * Exportar a Excel el maestro de operaciones (2026-10-23), con los filtros
 * de la pantalla. El backend no tiene modo "sin paginar": se pide una única
 * página del tamaño del total, como en Clientes.
 */
export const useOperationsMasterExport = ({ search, isActive, total }: ExportFilters) => {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const response = await processesListApi({
        search: search.trim() || null,
        is_active: isActive,
        page: 1,
        size: total || 9999,
      });

      if (response.data.length === 0) {
        toast({
          title: "Sin datos para exportar",
          description: "No hay operaciones que cumplan los filtros aplicados.",
          variant: "info",
        });
        return;
      }

      generateOperationsMasterExcel(response.data);
      toast({
        title: "Excel generado",
        description: `Se exportaron ${response.data.length} operaciones.`,
        variant: "success",
      });
    } catch (error) {
      toastError(error, "No se pudo generar el Excel");
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportToExcel };
};
