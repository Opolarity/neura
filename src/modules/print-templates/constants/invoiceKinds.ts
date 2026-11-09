/**
 * Los tipos de comprobante (tabla `types`, por su code). Cada uno tiene su
 * plantilla del sistema en ticket de 80 mm y en A4 (`<tipo>_ticket`,
 * `<tipo>_a4`): así se personaliza la boleta sin tocar la factura, y cada
 * diseño lleva solo lo suyo (el título, las filas de la nota, la
 * representación impresa de los electrónicos).
 */
export type InvoiceKind =
  "boleta" | "factura" | "credit_note" | "debit_note" | "sale_note";

export interface InvoiceKindInfo {
  /** El nombre del documento en el listado. */
  label: string;
  /** El code en la tabla `types`: con él el botón elige la plantilla. */
  typeCode: string;
  /** El título del comprobante, como hoy (el nombre del tipo). */
  title: string;
  /** Electrónico: «Representación impresa de la …» y el QR de SUNAT. */
  electronic?: string;
  /** Una nota: el comprobante que modifica y el motivo. */
  note?: boolean;
}

export const INVOICE_KINDS: Record<InvoiceKind, InvoiceKindInfo> = {
  boleta: {
    label: "Boleta",
    typeCode: "2",
    title: "BOLETA",
    electronic: "BOLETA DE VENTA ELECTRÓNICA",
  },
  factura: {
    label: "Factura",
    typeCode: "1",
    title: "FACTURA",
    electronic: "FACTURA ELECTRÓNICA",
  },
  credit_note: {
    label: "Nota de crédito",
    typeCode: "3",
    title: "NOTA DE CRÉDITO",
    electronic: "NOTA DE CRÉDITO ELECTRÓNICA",
    note: true,
  },
  debit_note: {
    label: "Nota de débito",
    typeCode: "4",
    title: "NOTA DE DÉBITO",
    electronic: "NOTA DE DÉBITO ELECTRÓNICA",
    note: true,
  },
  sale_note: { label: "Comprobante", typeCode: "INV", title: "COMPROBANTE" },
};

export const INVOICE_KIND_IDS = Object.keys(INVOICE_KINDS) as InvoiceKind[];

/** Los dos formatos de cada comprobante. */
export type InvoiceFormat = "ticket" | "a4";

/** El code de la plantilla del sistema de un comprobante. */
export const invoiceTemplateCode = (kind: InvoiceKind, format: InvoiceFormat) =>
  `${kind}_${format}`;

/** El tipo de un code de la tabla `types`; uno desconocido, «Comprobante». */
export const invoiceKindOf = (typeCode: string): InvoiceKind =>
  INVOICE_KIND_IDS.find(
    (kind) => INVOICE_KINDS[kind].typeCode === typeCode.trim(),
  ) ?? "sale_note";
