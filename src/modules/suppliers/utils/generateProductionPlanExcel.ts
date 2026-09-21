import * as XLSX from "xlsx";
import { formatDateDisplay } from "@/shared/utils/date";
import { productionOrderStatusBadge } from "./productionOrderStatus";
import { productionItemStatusBadge } from "./productionItemStatus";
import type {
  ProductionPlanRow,
  ProductionPlanProcessColumn,
} from "../types/productionPlan.types";

/**
 * El Plan Maestro a Excel, con la MISMA forma que la pantalla.
 *
 * Matriz: una fila por prenda y un par de columnas por proceso —Recibido y
 * Faltante—, bajo una cabecera con el nombre del proceso. Es la planilla que
 * se mira, volcada tal cual: quien la abre reconoce lo que tenía delante.
 *
 * Las columnas de proceso no salen de la ruta de cada orden sino de la lista
 * que ya devuelve el backend para pintar la tabla. Si salieran de cada orden,
 * dos órdenes con rutas distintas darían dos tablas que no se pueden apilar.
 *
 * Lo único que no viaja es la columna de acción de cada proceso: es un botón.
 */

/** Las dos cifras que la pantalla enseña bajo cada proceso. */
const SUBCOLUMNAS = ["Recibido", "Faltante"] as const;

/** Las columnas fijas, antes de los procesos. */
const FIJAS = [
  "Orden",
  "Código",
  "Tipo",
  "Estado orden",
  "Pedido",
  "Entrega",
  "Producto",
  "SKU",
  "Color",
  "Talla",
  "Categorías",
  "Solicitado",
] as const;

/** Las de después: la cuenta de la PRENDA, no la de un proceso. */
const FINALES = ["Recibido", "Faltante", "Estado prenda"] as const;

export function generateProductionPlanExcel(
  rows: ProductionPlanRow[],
  processes: ProductionPlanProcessColumn[],
  fileLabel: string,
): void {
  // ---- Las dos filas de cabecera -----------------------------------------
  //
  // La de arriba lleva el nombre del proceso sobre sus dos cifras; la de abajo
  // dice cuál es cuál. Las fijas ocupan las dos filas, combinadas, como el
  // rowSpan de la tabla.
  const cabecera1: string[] = [...FIJAS];
  const cabecera2: string[] = FIJAS.map(() => "");

  for (const proceso of processes) {
    cabecera1.push(proceso.processName, "");
    cabecera2.push(...SUBCOLUMNAS);
  }

  cabecera1.push(...FINALES);
  cabecera2.push(...FINALES.map(() => ""));

  // ---- Las filas ----------------------------------------------------------
  const filas = rows.map((row) => {
    const celdas: (string | number)[] = [
      row.productionOrderName,
      row.productionOrderCode ?? "",
      row.productionOrderClassName ?? "",
      // Los rótulos salen de las mismas utilidades que pintan los badges: un
      // Excel que dijera «IN_PROGRESS» donde la pantalla dice «En progreso»
      // sería el mismo dato con dos nombres.
      productionOrderStatusBadge(row.productionOrderStatus).label,
      row.createdAt ? formatDateDisplay(row.createdAt) : "",
      row.promisedDate ? formatDateDisplay(row.promisedDate) : "",
      row.productTitle ?? "",
      row.sku ?? "",
      row.variationTerms ?? "",
      row.termName,
      // Las del PRODUCTO. Varias caben en una celda separadas por coma: en un
      // Excel una columna por categoría sería variable, y es dato de lectura,
      // no de filtro fino.
      row.categories.map((c) => c.name).join(", "),
      row.quantity,
    ];

    for (const proceso of processes) {
      const celda =
        proceso.processId === null ? undefined : row.processes[proceso.processId];

      // Vacío y cero no son lo mismo: vacío es «este proceso no va en la ruta
      // de esta prenda», cero es «va y no ha salido nada». Un cero donde no
      // hay paso haría creer que falta trabajo que nadie tiene que hacer.
      celdas.push(celda?.good ?? "", celda?.remaining ?? "");
    }

    celdas.push(
      row.received,
      row.pending,
      productionItemStatusBadge(row.status).label,
    );

    return celdas;
  });

  const ws = XLSX.utils.aoa_to_sheet([cabecera1, cabecera2, ...filas]);

  // ---- Las combinaciones --------------------------------------------------
  //
  // Las fijas y las finales ocupan las dos filas de cabecera; cada proceso
  // ocupa sus dos columnas en la de arriba. Es lo que hace que se lea como la
  // tabla y no como una hilera de nombres sueltos.
  const merges: XLSX.Range[] = [];

  FIJAS.forEach((_, i) => {
    merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
  });

  processes.forEach((_, i) => {
    const desde = FIJAS.length + i * SUBCOLUMNAS.length;
    merges.push({
      s: { r: 0, c: desde },
      e: { r: 0, c: desde + SUBCOLUMNAS.length - 1 },
    });
  });

  const inicioFinales = FIJAS.length + processes.length * SUBCOLUMNAS.length;
  FINALES.forEach((_, i) => {
    merges.push({
      s: { r: 0, c: inicioFinales + i },
      e: { r: 1, c: inicioFinales + i },
    });
  });

  ws["!merges"] = merges;

  ws["!cols"] = [
    { wch: 26 }, // Orden
    { wch: 10 }, // Código
    { wch: 16 }, // Tipo
    { wch: 14 }, // Estado orden
    { wch: 12 }, // Pedido
    { wch: 12 }, // Entrega
    { wch: 34 }, // Producto
    { wch: 16 }, // SKU
    { wch: 16 }, // Color
    { wch: 8 },  // Talla
    { wch: 26 }, // Categorías
    { wch: 11 }, // Solicitado
    ...processes.flatMap(() => SUBCOLUMNAS.map(() => ({ wch: 11 }))),
    { wch: 10 }, // Recibido
    { wch: 10 }, // Faltante
    { wch: 15 }, // Estado prenda
  ];

  // Las dos filas de cabecera quedan fijas al desplazar: con una columna por
  // proceso, a la tercera pantalla ya no se sabe qué es cada cifra.
  ws["!freeze"] = { xSplit: "0", ySplit: "2" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plan maestro");
  XLSX.writeFile(wb, `plan-maestro-${fileLabel}.xlsx`);
}
