import { SystemPrintTemplate } from "../types/printTemplates.types";
import {
  INVOICE_KIND_IDS,
  INVOICE_KINDS,
  invoiceTemplateCode,
  type InvoiceKind,
} from "./invoiceKinds";

/**
 * Alto mínimo de una hoja de alto automático, en mm: así la hoja vacía tiene
 * dónde soltar componentes. Es del sistema, igual para todos los tenants y
 * todas las plantillas: no se configura.
 */
export const AUTO_PAPER_MIN_HEIGHT_MM = 30;

/**
 * El ticket de un comprobante: de rollo continuo, una sola página que crece
 * con el contenido, con 3 mm a los lados y 4 arriba y abajo
 * (invoiceTicketPdf.ts).
 */
const invoiceTicketTemplate = (kind: InvoiceKind): SystemPrintTemplate => ({
  code: invoiceTemplateCode(kind, "ticket"),
  section: `${INVOICE_KINDS[kind].label} · ticket 80 mm`,
  paperWidthMm: 80,
  paperHeightMm: "auto",
  hasDesign: true,
  pagePaddingMm: { top: 4, right: 3, bottom: 4, left: 3 },
  dataSources: ["invoice_items"],
  area: "Ventas",
});

/**
 * El A4 de un comprobante: vertical, de varias páginas (invoiceA4Pdf.ts), con
 * 12 mm de margen y 14 abajo; su tabla lleva también el Importe.
 */
const invoiceA4Template = (kind: InvoiceKind): SystemPrintTemplate => ({
  code: invoiceTemplateCode(kind, "a4"),
  section: `${INVOICE_KINDS[kind].label} · A4`,
  paperWidthMm: 210,
  paperHeightMm: 297,
  multiPage: true,
  hasDesign: true,
  pagePaddingMm: { top: 12, right: 12, bottom: 14, left: 12 },
  dataSources: ["invoice_items"],
  dataColumns: {
    invoice_items: [
      "quantity",
      "unit",
      "description",
      "unitPrice",
      "discount",
      "total",
    ],
  },
  area: "Ventas",
});

/**
 * Plantillas del sistema: una por cada PDF que imprime el ERP, iguales para
 * todos los tenants y no se eliminan. Cada una es una sección del listado.
 *
 * El code lo guarda la plantilla personalizada (system_code) y es lo que
 * busca el botón del ERP que imprime: no se renombra.
 *
 * La hoja tiene las medidas que usa hoy cada generador de PDF y no se cambian
 * en el editor. Sus fuentes de datos (`dataSources`) se van sumando documento
 * por documento.
 */
// Personalizado: sin los documentos de la planta que este ERP no tiene
// (tickets y hoja de paquetes, fotocheck de operario, operaciones del estilo,
// comprobante de registro), la orden de servicio de cliente ni la guía de
// traslado (aquí el traslado lleva la guía electrónica del PSE). Sus fuentes
// de datos y diseños se quedan en el módulo, igual que en multicliente.
export const SYSTEM_PRINT_TEMPLATES: readonly SystemPrintTemplate[] = [
  // Comprobantes: uno por tipo (constants/invoiceKinds), en ticket y en A4.
  ...INVOICE_KIND_IDS.flatMap((kind) => [
    invoiceTicketTemplate(kind),
    invoiceA4Template(kind),
  ]),
  // Etiquetas
  // Medidas elegibles: las dos de generateDeliveryLabel, la de 70 × 50
  // apaisada (template20611215895, la del rollo de 4") y la de 100 × 140
  // (template20607798002).
  {
    code: "delivery_label",
    section: "Etiqueta de envío",
    area: "Etiquetas",
    paperWidthMm: 100,
    paperHeightMm: 140,
    paperPresets: [
      { label: "100 × 140 mm · vertical", widthMm: 100, heightMm: 140 },
      {
        label: "70 × 50 mm · horizontal",
        widthMm: 70,
        heightMm: 50,
      },
    ],
    hasDesign: true,
    pagePaddingMm: { top: 4, right: 4, bottom: 4, left: 4 },
    dataSources: ["delivery_label"],
  },
  // Una etiqueta (generateBarcodePdf): la Hoja es una etiqueta, la del rollo
  // de 1 columna (30 × 20) o la de los rollos de 2 y 3 columnas (30 × 25).
  // Las columnas del rollo son la imposición: 62 y 94 mm de papel, con 2 mm
  // entre etiquetas.
  {
    code: "barcode_label",
    section: "Etiqueta de código de barras",
    area: "Etiquetas",
    paperWidthMm: 30,
    paperHeightMm: 20,
    paperPresets: [
      { label: "30 × 20 mm", widthMm: 30, heightMm: 20 },
      { label: "30 × 25 mm", widthMm: 30, heightMm: 25 },
    ],
    impositionPresets: [
      {
        label: "Rollo de 1 columna",
        imposition: { columns: 1, gapMm: 0, marginLeftMm: 0, marginRightMm: 0 },
      },
      {
        label: "Rollo de 2 columnas (62 mm)",
        imposition: { columns: 2, gapMm: 2, marginLeftMm: 0, marginRightMm: 0 },
      },
      {
        label: "Rollo de 3 columnas (94 mm)",
        imposition: { columns: 3, gapMm: 2, marginLeftMm: 0, marginRightMm: 0 },
      },
    ],
    hasDesign: true,
    pagePaddingMm: { top: 1, right: 2, bottom: 1.5, left: 2 },
    dataSources: ["barcode_label"],
  },
  // Guías (A4 vertical, remisionGuidePdf.ts)
  {
    code: "sale_remision_guide",
    section: "Guía de remisión de venta",
    area: "Guías",
    paperWidthMm: 210,
    paperHeightMm: 297,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 14, right: 14, bottom: 14, left: 14 },
    dataSources: ["remision_guide"],
  },
  {
    code: "production_remision_guide",
    section: "Guía de remisión de producción",
    area: "Guías",
    paperWidthMm: 210,
    paperHeightMm: 297,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 14, right: 14, bottom: 14, left: 14 },
    dataSources: ["production_guide"],
  },
  {
    code: "production_intake_guide",
    section: "Guía de ingreso de producción",
    area: "Guías",
    paperWidthMm: 210,
    paperHeightMm: 297,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 14, right: 14, bottom: 14, left: 14 },
    dataSources: ["intake_guide"],
  },
  {
    code: "material_remision_guide",
    section: "Guía de envío de material",
    area: "Guías",
    paperWidthMm: 210,
    paperHeightMm: 297,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 14, right: 14, bottom: 14, left: 14 },
    dataSources: ["material_guide"],
  },
  // Hojas (A4 apaisado, sheetDocument.ts)
  {
    code: "purchase_order",
    section: "Orden de compra",
    area: "Compras",
    paperWidthMm: 297,
    paperHeightMm: 210,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 12, right: 12, bottom: 7, left: 12 },
    dataSources: ["purchase_order"],
  },
  {
    code: "service_order",
    section: "Orden de servicio",
    area: "Compras",
    paperWidthMm: 297,
    paperHeightMm: 210,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 12, right: 12, bottom: 7, left: 12 },
    dataSources: ["service_order", "service_order_garments"],
  },
  {
    code: "production_order",
    section: "Orden de producción",
    area: "Producción",
    paperWidthMm: 297,
    paperHeightMm: 210,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 12, right: 12, bottom: 7, left: 12 },
    dataSources: [
      "production_order",
      "production_order_garments",
      "production_order_images",
    ],
  },
  {
    code: "material_requirement",
    section: "Requerimiento de materiales",
    area: "Producción",
    paperWidthMm: 297,
    paperHeightMm: 210,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 12, right: 12, bottom: 7, left: 12 },
    dataSources: ["material_requirement"],
  },
  {
    code: "recipe",
    section: "Receta",
    area: "Producción",
    paperWidthMm: 297,
    paperHeightMm: 210,
    hasDesign: true,
    multiPage: true,
    pagePaddingMm: { top: 12, right: 12, bottom: 7, left: 12 },
    dataSources: ["recipe"],
  },
];

export const findSystemPrintTemplate = (
  code: string,
): SystemPrintTemplate | undefined =>
  SYSTEM_PRINT_TEMPLATES.find((template) => template.code === code);

/** Sección de un code; uno que el ERP no conoce se muestra tal cual. */
export const sectionOf = (code: string): string =>
  findSystemPrintTemplate(code)?.section ?? code;
