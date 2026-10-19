import { getParameters } from "@/modules/settings/services/Parameters.service";

/**
 * Plantilla de los documentos imprimibles (T-1013).
 *
 * La plantilla no es una tabla: son filas de `parameters` que se editan en
 * Configuración > Negocio. Este archivo es el único que las lee para
 * los comprobantes y fija sus valores por defecto, que reproducen el diseño
 * anterior a la plantilla: un parámetro ausente imprime lo mismo que antes.
 *
 * Las banderas `InvoiceShow*` siguen la regla «ausente = "true"». La pantalla de
 * Negocio usa el mismo valor por defecto (`defaultValue` en
 * BusinessParameters.types.ts) para no mostrar apagado algo que sí se imprime.
 */

export type InvoicePrintFormat = "80mm" | "A4";

export interface InvoiceTemplateConfig {
  /** Formato de la lista de Comprobantes. El POS y WhatsApp siempre usan 80 mm. */
  format: InvoicePrintFormat;
  logoUrl: string;
  footerMessage: string;
  company: {
    name: string;
    documentNumber: string;
    /** Domicilio fiscal (CompanyAddress). */
    fiscalAddress: string;
    phone: string;
    email: string;
  };
  show: {
    /** Tipo y número de documento del cliente. Solo se puede ocultar en boletas de hasta S/ 700. */
    customerDocument: boolean;
    /** Dirección del cliente. */
    customerAddress: boolean;
    companyEmail: boolean;
    companyPhone: boolean;
  };
}

export const INVOICE_TEMPLATE_PARAMETERS = [
  "CompanyName",
  "CompanyDocumentNumber",
  "CompanyAddress",
  "CompanyPhoneNumber",
  "CompanyEmail",
  "InvoiceLogoUrl",
  "InvoiceFooterMessage",
  "InvoiceShowDocumentTypeAndNumber",
  "InvoiceShowAddress",
  "InvoiceShowEmail",
  "InvoiceShowPhone",
  "InvoicePrintFormat",
];

/** Bandera de plantilla: ausente o vacía cuenta como "true". */
const isShown = (value: string | undefined) => (value ?? "").trim() !== "false";

export const resolveInvoiceTemplateConfig = (
  params: Record<string, string>,
): InvoiceTemplateConfig => ({
  format: (params["InvoicePrintFormat"] ?? "").trim() === "A4" ? "A4" : "80mm",
  logoUrl: params["InvoiceLogoUrl"] ?? "",
  footerMessage: params["InvoiceFooterMessage"] ?? "",
  company: {
    name: params["CompanyName"] ?? "",
    documentNumber: params["CompanyDocumentNumber"] ?? "",
    fiscalAddress: params["CompanyAddress"] ?? "",
    phone: params["CompanyPhoneNumber"] ?? "",
    email: params["CompanyEmail"] ?? "",
  },
  show: {
    customerDocument: isShown(params["InvoiceShowDocumentTypeAndNumber"]),
    customerAddress: isShown(params["InvoiceShowAddress"]),
    companyEmail: isShown(params["InvoiceShowEmail"]),
    companyPhone: isShown(params["InvoiceShowPhone"]),
  },
});

/** Plantilla de comprobantes de la empresa. */
export const getInvoiceTemplateConfig = async (): Promise<InvoiceTemplateConfig> =>
  resolveInvoiceTemplateConfig(await getParameters(INVOICE_TEMPLATE_PARAMETERS));

/**
 * Importe a partir del cual la boleta debe identificar al adquirente: por
 * encima de él el documento del cliente se imprime aunque la bandera lo oculte.
 */
export const BOLETA_IDENTIFICATION_THRESHOLD = 700;

/** Tipo y número de documento del cliente: solo una boleta de hasta S/ 700 puede ocultarlos. */
export const shouldShowCustomerDocument = (
  config: InvoiceTemplateConfig,
  invoiceTypeCode: string,
  totalAmount: number,
): boolean =>
  config.show.customerDocument ||
  invoiceTypeCode.trim() !== "2" ||
  totalAmount > BOLETA_IDENTIFICATION_THRESHOLD;

const ELECTRONIC_DOCUMENT_NAMES: Record<string, string> = {
  "1": "FACTURA ELECTRÓNICA",
  "2": "BOLETA DE VENTA ELECTRÓNICA",
  "3": "NOTA DE CRÉDITO ELECTRÓNICA",
  "4": "NOTA DE DÉBITO ELECTRÓNICA",
};

/** Denominación SUNAT del comprobante electrónico, o null si es un comprobante interno. */
export const electronicDocumentName = (invoiceTypeCode: string): string | null =>
  ELECTRONIC_DOCUMENT_NAMES[invoiceTypeCode.trim()] ?? null;

/** Leyenda de la representación impresa; null en comprobantes internos. */
export const printedRepresentationLegend = (invoiceTypeCode: string): string | null => {
  const name = electronicDocumentName(invoiceTypeCode);
  return name ? `Representación impresa de la ${name}` : null;
};
