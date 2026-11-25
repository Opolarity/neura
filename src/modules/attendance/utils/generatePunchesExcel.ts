import * as XLSX from "xlsx";
import { formatDateDisplay, formatTime, getTodayDate } from "@/shared/utils/date";
import { METHOD_LABELS, Punch, PunchFilters } from "../types/attendance.types";

/**
 * Excel de Asistencia › Marcas: una fila por marca, en el mismo orden que la
 * tabla (más reciente primero), con todas las que cumplen los filtros
 * aplicados. Fecha y hora van en Lima, separadas para poder ordenar y filtrar.
 */
export function generatePunchesExcel(punches: Punch[], filters: PunchFilters) {
  const rows = punches.map((m) => ({
    Fecha: formatDateDisplay(m.punchedAt),
    Hora: formatTime(m.punchedAt),
    Código: m.code,
    Trabajador: m.name,
    DNI: m.documentNumber ?? "",
    Tipo: m.punchType === "IN" ? "Entrada" : "Salida",
    Lugar: m.pointName ?? "Sin punto",
    Método: METHOD_LABELS[m.method] ?? m.method,
    Nota: m.note ?? "",
    "Registrada por": m.createdBy ?? "",
    Foto: m.photoPath ? "Sí" : "No",
    Latitud: m.latitude ?? "",
    Longitud: m.longitude ?? "",
    "Precisión (m)": m.accuracyM ?? "",
  }));

  const rango =
    filters.dateFrom && filters.dateTo ? `${filters.dateFrom}_${filters.dateTo}` : getTodayDate();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Marcas");
  XLSX.writeFile(wb, `marcas_${rango}.xlsx`);
}
