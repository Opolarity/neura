import { formatDateDisplay } from "@/shared/utils/date";
import { taxBreakdownOf, taxLabel } from "@/shared/utils/tax";
import { currencySymbol, formatDocumentMoney } from "@/shared/utils/currency";
import type { PrintDataRow } from "@/modules/print-templates/constants/printDataSources";
import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import { printDocument } from "@/modules/print-templates/print/printDocument";
import { notesToObservations } from "./quotationNotes";
import {
  ServiceOrderGarment,
  buildServiceOrderDocument,
  qty,
  unitPrice,
} from "./serviceOrderDocument/build";

export type {
  ServiceOrderData,
  ServiceOrderGarment,
  ServiceOrderLine,
} from "./serviceOrderDocument/build";

type ServiceOrderInput = Parameters<typeof buildServiceOrderDocument>[0];

/** Un dato vacío no llega: la plantilla oculta su rótulo, como el papel de antes. */
const conValor = (value: string | null | undefined) =>
  value && value.trim() !== "" ? value : null;

/** «Polo Básico - Negro»: producto y color, sin la talla (como garmentGrid). */
const garmentName = (garment: ServiceOrderGarment): string =>
  [garment.productTitle, garment.otherTerms].filter(Boolean).join(" - ") ||
  garment.label;

/**
 * Las prendas para la fuente service_order_garments: una fila por producto y
 * color, con las tallas ya escritas («S 100 · M 200 · L 100») y su total.
 *
 * Mismo orden que la rejilla de antes (garmentGrid): primero cada sistema de
 * tallas, en orden de aparición, con las tallas en el orden del catálogo
 * (`sizeTermId`); al final las prendas sin talla, una por fila. Una talla sin
 * cantidad (el servicio sabe qué prendas cubre, no cuántas) sale solo con su
 * nombre, y la fila sin total: un cero se leería como «ninguna».
 */
const garmentRows = (garments: ServiceOrderGarment[]): PrintDataRow[] => {
  interface Fila {
    name: string;
    /** Talla → id del término (para ordenar) y la suma, o null si falta alguna. */
    tallas: Map<string, { order: number; quantity: number | null }>;
  }
  const grupos = new Map<string, Map<string, Fila>>();
  const sinTalla: ServiceOrderGarment[] = [];

  for (const garment of garments) {
    if (garment.sizeTerm === null || garment.sizeGroup === null) {
      sinTalla.push(garment);
      continue;
    }
    const filas = grupos.get(garment.sizeGroup) ?? new Map<string, Fila>();
    grupos.set(garment.sizeGroup, filas);
    const name = garmentName(garment);
    const fila = filas.get(name) ?? { name, tallas: new Map() };
    filas.set(name, fila);
    // La misma talla dos veces en la misma fila es la misma prenda: se suma.
    const previa = fila.tallas.get(garment.sizeTerm);
    fila.tallas.set(garment.sizeTerm, {
      order: garment.sizeTermId ?? Number.MAX_SAFE_INTEGER,
      quantity: !previa
        ? garment.quantity
        : previa.quantity === null || garment.quantity === null
          ? null
          : previa.quantity + garment.quantity,
    });
  }

  const conTalla = [...grupos.values()].flatMap((filas) =>
    [...filas.values()].map((fila) => {
      const tallas = [...fila.tallas.entries()].sort((a, b) => a[1].order - b[1].order);
      const completa = tallas.every(([, talla]) => talla.quantity !== null);
      return {
        garment: fila.name,
        sizes: tallas
          .map(([talla, { quantity }]) => (quantity === null ? talla : `${talla} ${qty(quantity)}`))
          .join(" · "),
        total: completa
          ? qty(tallas.reduce((sum, [, talla]) => sum + (talla.quantity ?? 0), 0))
          : null,
      };
    })
  );

  return [
    ...conTalla,
    ...sinTalla.map((garment) => ({
      garment: garmentName(garment),
      sizes: null,
      total: garment.quantity === null ? null : qty(garment.quantity),
    })),
  ];
};

/**
 * Los datos de la Orden de Servicio para su plantilla (fuentes service_order
 * y service_order_garments de print-templates), con los mismos textos y
 * formatos que armaba `buildServiceOrderDocument`. Las condiciones fijas
 * (CONDICIONES) las escribe la plantilla: aquí solo va lo de este encargo.
 */
export const serviceOrderPrintData = (data: ServiceOrderInput): PrintData => {
  // Todos los importes del papel, en la moneda de la cotización.
  const money = (value: number | null | undefined) =>
    formatDocumentMoney(value, data.currency);

  const totalPrice = data.lines.reduce((sum, line) => sum + (line.price ?? 0), 0);
  // Subtotal e IGV solo si alguna línea declara el IGV; si no, solo el total.
  const desglose = taxBreakdownOf(data.lines);

  // Solo con UNA línea y una unidad: con varios procesos sobre el mismo lote
  // la suma se leería como prendas y no lo es.
  const unidades = [...new Set(data.lines.map((line) => line.measurementUnit))];
  const cantidadPedida =
    data.lines.length === 1 && unidades.length === 1 && unidades[0]
      ? `${qty(data.lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0))} ${unidades[0]}`
      : null;

  // El total de prendas, solo si todas traen cantidad.
  const prendas = data.garments.reduce((sum, garment) => sum + (garment.quantity ?? 0), 0);
  const totalPrendas =
    data.garments.every((garment) => garment.quantity !== null) && prendas > 0
      ? qty(prendas)
      : null;

  // Lo pactado en ESTE encargo: las notas y la condición de pago.
  const observaciones = [
    ...notesToObservations(data.quotationNotes),
    ...notesToObservations(data.paymentTerms),
  ];

  return {
    service_order: {
      rows: data.lines.map((line) => ({
        quantity: qty(line.quantity),
        unit: line.measurementUnit ?? "—",
        code: line.code,
        description: line.description,
        unitPrice: money(unitPrice(line)),
        total: money(line.price),
        tax: taxLabel(line.includesTax),
      })),
      values: {
        // El papel de un servicio (Avances) lleva el número del servicio.
        orderNumber: conValor(data.serviceCode ?? data.quotationCode),
        processName: conValor(data.processName),
        supplierName: conValor(data.supplierName),
        productionOrders:
          data.productionOrderNames.length > 0 ? data.productionOrderNames.join(", ") : null,
        issueDate: formatDateDisplay(data.createdAt),
        deliveryDate: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
        supplierDocument: conValor(data.supplierDocument),
        supplierPhone: conValor(data.supplierPhone),
        request: conValor(data.quotationDescription),
        serviceCount: data.lines.length > 1 ? String(data.lines.length) : null,
        orderedQuantity: cantidadPedida,
        currency: `${data.currency ?? "PEN"} · ${currencySymbol(data.currency)}`,
        subtotal: desglose ? money(desglose.base) : null,
        igv: desglose ? money(desglose.igv) : null,
        total: money(desglose ? desglose.total : totalPrice),
        garmentsTotal: totalPrendas,
        observations: observaciones.length > 0 ? observaciones.join("\n") : null,
      },
    },
    service_order_garments: { rows: garmentRows(data.garments) },
  };
};

/**
 * Orden de Servicio: el papel que se le entrega al taller.
 *
 * Se imprime con su plantilla (la personalizada en uso o la del sistema). Desde
 * Cotizaciones va la cotización entera y desde Avances un servicio: lo decide
 * quien arma `data` (ver `serviceOrderDocument/build`). Los datos de la empresa
 * salen de la sesión, así que `data.company` ya no se usa aquí.
 */
export const openServiceOrderPdf = (data: ServiceOrderInput): void => {
  const numero = data.serviceCode ?? data.quotationCode ?? "";
  void printDocument("service_order", serviceOrderPrintData(data), {
    fileName: `Orden de Servicio ${numero}`.trim(),
  });
};
