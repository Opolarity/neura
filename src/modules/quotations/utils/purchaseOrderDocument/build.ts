import { CompanyDocumentHeader } from "@/shared/services/companyHeader";
import { SheetDocument, SheetField } from "@/shared/utils/sheetDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import { IGV_RATE, taxBreakdownOf, taxLabel } from "@/shared/utils/tax";
import { currencySymbol, formatDocumentMoney } from "@/shared/utils/currency";
import { notesToObservations } from "../quotationNotes";

/**
 * De lo que sabe el ERP al papel de la Orden de Compra.
 *
 * Usa el mismo motor que la Orden de Producción y el Requerimiento
 * —`shared/utils/sheetDocument`, A4 apaisada— y eso es deliberado: al mismo
 * proveedor se le manda la orden de compra y la de servicio, y hasta ahora
 * salían con dos maquetaciones distintas.
 *
 * ## Lo que este papel NO imprime
 *
 * El formato de referencia trae área, usuario, emitido por, atención a, forma
 * de pago, facturar a, lugar de entrega y la dirección del proveedor. Nada de
 * eso está en el esquema —no hay tabla de direcciones, y `accounts` no guarda
 * ninguna—. Se dejan fuera en vez de imprimir el rótulo vacío: un hueco en un
 * papel que se manda al proveedor se lee como un dato que falta, no como uno
 * que no aplica.
 *
 * Tampoco hay fotos, ruta ni materiales de receta: eso es de la Orden de
 * Producción. Este papel lleva lo suyo.
 *
 * ## El IGV se desglosa, el precio no se toca
 *
 * Cada línea dice cómo se lee su importe --lo lleva dentro, o hay que sumárselo--
 * y el pie hace la cuenta. Lo que NO cambia nunca es el precio pactado: es lo
 * que se acordó con el proveedor y lo que aparecerá en su factura.
 *
 * Si ninguna línea lo declara, el papel sale como antes: su total y nada más.
 * No se les inventa una convención retroactiva.
 */

/** Una línea de material de la cotización. */
export interface PurchaseOrderLine {
  code: string | null;
  description: string;
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

export interface PurchaseOrderData {
  quotationCode: string | null;
  /** El asunto de la cotización: va en «Solicitud». */
  quotationDescription: string;
  /** Las notas de la cotización. Son las Observaciones del papel. */
  quotationNotes?: string | null;
  /** La moneda pactada, código ISO. Rige todos los importes. Vacía = soles. */
  currency?: string | null;
  /** Lo acordado sobre el pago. Va en Observaciones, delante de las notas. */
  paymentTerms?: string | null;
  createdAt: string;
  /**
   * Cuándo se espera el material. Sale de las líneas --la fecha vive en cada
   * `supplier_services.promised_date`-- y se toma la MÁS LEJANA: es cuando se
   * espera tenerlo todo. Mismo criterio que la Orden de Servicio.
   */
  promisedDate?: string | null;
  supplierName: string;
  supplierDocument: string | null;
  supplierPhone: string | null;
  company: CompanyDocumentHeader;
  lines: PurchaseOrderLine[];
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

export const buildPurchaseOrderDocument = (
  data: PurchaseOrderData,
): SheetDocument => {
  // Todos los importes del papel, en la moneda de la cotización.
  const money = (value: number | null | undefined) =>
    formatDocumentMoney(value, data.currency);

  const total = data.lines.reduce((sum, line) => sum + (line.price ?? 0), 0);

  const desglose = taxBreakdownOf(data.lines);

  // Las cantidades solo se suman si todas las líneas van en la misma unidad.
  // Con jersey en KG y botones en UND, el total sería la suma de kilos con
  // unidades: un número que no significa nada y que además parece un dato.
  const unidades = [...new Set(data.lines.map((line) => line.measurementUnit))];
  const cantidadTotal =
    unidades.length === 1 && unidades[0]
      ? `${qty(data.lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0))} ${unidades[0]}`
      : null;

  return {
    title: "Orden de compra",
    company: data.company,

    identification: conValor([
      { label: "Orden de compra", value: data.quotationCode },
      { label: "Proveedor", value: data.supplierName },
      // «F. emisión» y no «Fecha», que es como lo rotula la Orden de Servicio:
      // con dos fechas en la banda, la de hoy necesita nombre.
      { label: "F. emisión", value: formatDateDisplay(data.createdAt) },
      {
        label: "F. entrega",
        value: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
      },
    ]),

    // A quién se le compra.
    generalTitle: "Proveedor",
    general: conValor([
      { label: "Razón social", value: data.supplierName },
      { label: "RUC / DNI", value: data.supplierDocument },
      { label: "Teléfono", value: data.supplierPhone },
    ]),

    // Qué se le compra, en cifras. Va aparte de la ficha del proveedor porque
    // son dos preguntas distintas: a quién, y cuánto.
    technicalTitle: "Pedido",
    technical: conValor([
      { label: "Solicitud", value: data.quotationDescription || null },
      {
        label: "Materiales distintos",
        value: data.lines.length > 0 ? String(data.lines.length) : null,
      },
      { label: "Cantidad total", value: cantidadTotal },
      // Dicha una vez y con todas las letras: los importes llevan su símbolo,
      // pero «S/» y «$» se confunden de un vistazo en una columna de cifras.
      { label: "Moneda", value: `${data.currency ?? "PEN"} · ${currencySymbol(data.currency)}` },
    ]),

    sections: [
      {
        title: "Materiales",
        // La descripción sin ancho: se lleva lo que sobra. Es la única que de
        // verdad lo necesita, y así las demás no hay que recalcularlas cuando
        // la sección gana o pierde una columna.
        columns: [
          { header: "Cantidad", width: 24, align: "right" },
          { header: "U/M", width: 20 },
          { header: "Código", width: 34, tone: "code" },
          { header: "Descripción" },
          // Unitario y total por separado: con solo el total, quien lee el
          // papel no puede comprobar la cuenta contra la cantidad.
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
        empty: "Esta compra no tiene materiales registrados.",
      },
    ],

    // El desglose sale del indicador de cada línea, y solo si alguna declara.
    // Sin declarar, el papel se imprime como hasta ahora: su total y nada más.
    totals: desglose
      ? [
          { label: "Subtotal", value: money(desglose.base) },
          {
            label: `IGV ${Math.round(IGV_RATE * 100)}%`,
            value: money(desglose.igv),
          },
          { label: "TOTAL", value: money(desglose.total) },
        ]
      : [{ label: "TOTAL", value: money(total) }],

    // Las notas de la cotización, un párrafo por línea escrita. Sin notas no
    // se dibuja el recuadro, como hasta ahora.
    // Lo pactado sobre el pago, delante de las notas del pedido.
    observations: [
      ...notesToObservations(data.paymentTerms),
      ...notesToObservations(data.quotationNotes),
    ],

    // Sin pie: la columna de IGV y el desglose de abajo ya lo dicen todo.
    footnotes: [],
  };
};
