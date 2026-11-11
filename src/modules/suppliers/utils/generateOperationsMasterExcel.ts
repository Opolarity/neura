import * as XLSX from "xlsx";
import { getTodayDate } from "@/shared/utils/date";
import { ProcessCatalogItem } from "../types/processes.types";

const porNombre = (a: string, b: string) => a.localeCompare(b, "es", { sensitivity: "base" });

/**
 * El Excel del maestro de operaciones (2026-10-23): el catálogo como en
 * pantalla, cada bloque y debajo sus operaciones, por nombre.
 *
 * Solo lo que el catálogo tiene: bloque, operación, código y estado.
 */
export function generateOperationsMasterExcel(items: ProcessCatalogItem[]): void {
  /** El bloque de la fila: su padre, o ella misma si no cuelga de ninguno. */
  const bloqueDe = (item: ProcessCatalogItem) => item.parentProcessName ?? item.name;

  const ordenadas = [...items].sort(
    (a, b) =>
      porNombre(bloqueDe(a), bloqueDe(b)) ||
      // El bloque antes que sus operaciones.
      Number(a.parentProcessId !== null) - Number(b.parentProcessId !== null) ||
      porNombre(a.name, b.name)
  );

  const header = [
    "Bloque",
    "Tipo",
    "Código",
    "Operación",
    "Estado",
    "Operaciones del bloque",
    "Veces usada",
  ];
  const rows: (string | number | null)[][] = [header];
  for (const item of ordenadas) {
    const esBloque = item.parentProcessId === null;
    rows.push([
      bloqueDe(item),
      esBloque ? "Bloque" : "Operación",
      item.code,
      item.name,
      item.isActive ? "Activa" : "Inactiva",
      esBloque ? item.childrenCount : null,
      item.usageCount,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 11 }, { wch: 12 }, { wch: 36 }, { wch: 10 }, { wch: 22 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Maestro de operaciones");
  XLSX.writeFile(wb, `maestro-de-operaciones-${getTodayDate()}.xlsx`);
}
