import { CompanyDocumentHeader } from "@/shared/services/companyHeader";
import { SheetDocument, SheetField } from "@/shared/utils/sheetDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import { IGV_RATE, taxBreakdownOf, taxLabel } from "@/shared/utils/tax";
import { currencySymbol, formatDocumentMoney } from "@/shared/utils/currency";
import { notesToObservations } from "../quotationNotes";
import { GridGarment, garmentSections } from "@/shared/utils/garmentGrid";

/**
 * De lo que sabe el ERP al papel de la Orden de Servicio: lo que se le entrega
 * al taller.
 *
 * Usa el mismo motor que la Orden de Producción —`shared/utils/sheetDocument`,
 * A4 apaisada—, igual que la Orden de Compra. Al mismo proveedor se le mandan
 * los dos papeles y hasta ahora salían distintos.
 *
 * ## Dos alcances, un documento
 *
 * Desde **Cotizaciones** sale la cotización entera: todos los servicios de ese
 * proveedor, con su total. Desde **Avances** sale UN servicio: el del taller
 * que se tiene delante. Si una cotización lleva corte, costura y estampado en
 * tres talleres, imprimir los tres desde el pop-up de uno sería mandarle al de
 * corte el precio de los otros dos.
 *
 * Es el mismo papel con distinto alcance, no dos papeles: quien lo arma decide
 * qué líneas pone, y `serviceCode` / `processName` dicen cuál de los dos es.
 *
 * ## Sobre el cuadro de tallas
 *
 * Las prendas van como **rejilla**: una fila por producto (y color) y una
 * columna por talla, con una tabla por sistema de tallas. Antes salía una
 * fila por variación —el mismo polo seis veces—, porque el ERP no distinguía
 * la talla del resto de términos; ahora el backend la manda aparte con la
 * misma regla que el Plan Maestro (`term_groups.code = 'Tallas'`). Cómo se
 * agrupa está en `garmentGrid.ts`.
 *
 * ## Lo que NO imprime
 *
 * Precio de costura aparte del total, movilidad, el bloque de AVIOS, fecha de
 * entrega real, motivo, ni los recuadros de autorización y firmas: nada de eso
 * existe en el esquema. Tampoco fotos ni ruta de producción, que son de la
 * Orden de Producción.
 */

/** Una línea de servicio. */
export interface ServiceOrderLine {
  code: string | null;
  description: string;
  /** Lo PEDIDO, no lo último registrado: es lo que se encargó. */
  quantity: number | null;
  measurementUnit: string | null;
  /** El TOTAL de la línea, no el unitario. */
  price: number | null;
  /**
   * Si ese precio ya lleva el IGV dentro. Null = sin declarar.
   *
   * No cambia el precio: decide si el papel lo desglosa, se lo suma, o no lo
   * menciona.
   */
  includesTax?: boolean | null;
}

/**
 * Una prenda que los servicios atraviesan, con lo que se manda a producir.
 *
 * `quantity` null cuando el servicio sabe qué prendas cubre pero no cuántas
 * de cada una. Las partes de talla son lo que arma la rejilla; sin ellas la
 * prenda sale en la lista «sin talla» con su `label`.
 */
export type ServiceOrderGarment = GridGarment;

export interface ServiceOrderData {
  quotationCode: string | null;
  /**
   * El code del servicio. Solo cuando el papel es de UNO: entonces manda sobre
   * el de la cotización, porque es el número por el que se le pregunta al
   * taller.
   */
  serviceCode?: string | null;
  /** Qué proceso es. Solo tiene sentido cuando el papel es de un servicio. */
  processName?: string | null;
  quotationDescription: string | null;
  /**
   * Las notas de la cotización. Van en Observaciones, delante de las
   * condiciones fijas: lo particular de este encargo antes que lo de siempre.
   */
  quotationNotes?: string | null;
  /**
   * La moneda pactada, código ISO. Rige TODOS los importes del papel: la
   * cotización es de un proveedor y una negociación, así que mezclar monedas
   * dejaría un total que no suma nada real. Vacía = soles, que es lo que este
   * papel imprimió siempre.
   */
  currency?: string | null;
  /**
   * Lo acordado sobre el pago, tal como se escribió. Va en Observaciones,
   * delante de las condiciones fijas: lo pactado manda sobre lo de siempre.
   */
  paymentTerms?: string | null;
  createdAt: string;
  /** La más lejana de las comprometidas: la fecha en que se espera todo. */
  promisedDate: string | null;
  supplierName: string;
  supplierDocument: string | null;
  supplierPhone: string | null;
  company: CompanyDocumentHeader;
  /** Nombres de las órdenes de producción vinculadas, sin repetir. */
  productionOrderNames: string[];
  lines: ServiceOrderLine[];
  garments: ServiceOrderGarment[];
}



const qty = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * El unitario, derivado: `price` es el total de la línea y el unitario es eso
 * entre la cantidad, igual que lo calculan los SPs. Sin cantidad no hay entre
 * qué dividir.
 */
const unitPrice = (line: { price: number | null; quantity: number | null }) =>
  line.price === null || !line.quantity ? null : line.price / line.quantity;

/** Deja fuera los rótulos sin valor: un hueco se lee como un dato que falta. */
const conValor = (
  fields: Array<{ label: string; value: string | null }>,
): SheetField[] =>
  fields
    .filter((field) => field.value !== null && field.value.trim() !== "")
    .map((field) => ({ label: field.label, value: field.value as string }));

/**
 * Las condiciones del encargo. Van literales y no como nota al pie: son lo
 * único contractual del papel, y la tercera es la que define cuándo se le debe
 * al taller —es de donde sale `fn_supplier_service_payable`—.
 */
const CONDICIONES = [
  "La empresa proveerá los materiales necesarios, previo acuerdo con el proveedor, para cumplir la fecha de entrega acordada.",
  "El proveedor debe devolver los excedentes de avíos enviados en esta orden.",
  "El pago se realiza una vez recepcionada la totalidad de las prendas con conformidad de recepción.",
];

export const buildServiceOrderDocument = (
  data: ServiceOrderData,
): SheetDocument => {
  // Todos los importes del papel, en la moneda de la cotización.
  const money = (value: number | null | undefined) =>
    formatDocumentMoney(value, data.currency);

  const totalPrice = data.lines.reduce((sum, line) => sum + (line.price ?? 0), 0);

  // El IGV se desglosa; el precio pactado no se toca. Sin ninguna linea que lo
  // declare, el papel sale como antes: su total y nada mas.
  const desglose = taxBreakdownOf(data.lines);
  // Misma regla que en la Orden de Compra: solo se suman las cantidades si
  // todas las lineas van en la misma unidad.
  const unidades = [...new Set(data.lines.map((line) => line.measurementUnit))];
  // Solo con UNA linea. Con tres procesos sobre las mismas 1.200 prendas la
  // suma daria 3.600, que se lee como prendas y no lo es: cada linea es un
  // paso por el mismo lote. Con una sola no hay ambiguedad posible.
  const cantidadPedida =
    data.lines.length === 1 && unidades.length === 1 && unidades[0]
      ? `${qty(data.lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0))} ${unidades[0]}`
      : null;

  // Una sola línea es el papel de Avances: el número que se le pregunta al
  // taller es el del servicio, no el de la cotización que lo agrupa.
  const numero = data.serviceCode ?? data.quotationCode;

  return {
    title: "Orden de servicio",
    company: data.company,

    identification: conValor([
      { label: "Orden de servicio", value: numero },
      { label: "Proceso", value: data.processName ?? null },
      { label: "Proveedor", value: data.supplierName },
      {
        label:
          data.productionOrderNames.length > 1
            ? "Órdenes de producción"
            : "Orden de producción",
        value:
          data.productionOrderNames.length > 0
            ? data.productionOrderNames.join(", ")
            : null,
      },
      { label: "F. emisión", value: formatDateDisplay(data.createdAt) },
      {
        label: "F. entrega",
        value: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
      },
    ]),

    // A quién se le encarga.
    generalTitle: "Proveedor",
    general: conValor([
      { label: "Razón social", value: data.supplierName },
      { label: "RUC / DNI", value: data.supplierDocument },
      { label: "Teléfono", value: data.supplierPhone },
    ]),

    // Qué se le encarga, en cifras.
    technicalTitle: "Encargo",
    technical: conValor([
      { label: "Solicitud", value: data.quotationDescription },
      {
        label: "Servicios",
        value: data.lines.length > 1 ? String(data.lines.length) : null,
      },
      { label: "Cantidad pedida", value: cantidadPedida },
      // Dicha una vez y con todas las letras: los importes llevan su símbolo,
      // pero «S/» y «$» se confunden de un vistazo en una columna de cifras.
      { label: "Moneda", value: `${data.currency ?? "PEN"} · ${currencySymbol(data.currency)}` },
    ]),

    sections: [
      {
        title: "Servicios",
        columns: [
          { header: "Cantidad", width: 24, align: "right" },
          { header: "U/M", width: 20 },
          { header: "Código", width: 34, tone: "code" },
          { header: "Descripción" },
          // Mismas columnas que la Orden de Compra: unitario y total aparte.
          { header: "Importe", width: 30, align: "right" },
          { header: "Costo total", width: 34, align: "right" },
          { header: "IGV", width: 26, tone: "muted" },
        ],
        rows: data.lines.map((line) => [
          qty(line.quantity),
          line.measurementUnit ?? "—",
          line.code ?? "—",
          line.description,
          money(unitPrice(line)),
          money(line.price),
          taxLabel(line.includesTax),
        ]),
        empty: "Esta orden no tiene servicios registrados.",
      },
      // Las prendas salen una sola vez aunque tres servicios cuelguen de la
      // misma orden, como rejilla por talla: una tabla por sistema de tallas.
      ...garmentSections(data.garments),
    ],

    totals: desglose
      ? [
          { label: "Subtotal", value: money(desglose.base) },
          {
            label: `IGV ${Math.round(IGV_RATE * 100)}%`,
            value: money(desglose.igv),
          },
          { label: "TOTAL", value: money(desglose.total) },
        ]
      : [{ label: "TOTAL", value: money(totalPrice) }],

    // Lo pactado en ESTE encargo va delante de las condiciones de siempre: la
    // tercera de ellas dice cuándo se debe, y la condición negociada la
    // concreta sin contradecirla.
    observations: [
      ...notesToObservations(data.quotationNotes),
      ...notesToObservations(data.paymentTerms),
      ...CONDICIONES,
    ],

    // Sin pie: la columna de IGV y el desglose de abajo ya lo dicen todo.
    footnotes: [],
  };
};
