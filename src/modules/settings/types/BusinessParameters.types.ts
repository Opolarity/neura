export type BusinessFieldControl =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "image";

export interface BusinessField {
  /** Valor de la columna `name` en la tabla public.parameters */
  key: string;
  label: string;
  help?: string;
  control: BusinessFieldControl;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface BusinessSection {
  id: string;
  title: string;
  description: string;
  fields: BusinessField[];
}

/**
 * Definición declarativa del formulario curado de Configuración > Negocio.
 * Es la única fuente de verdad de qué parámetros son "curados": la pestaña
 * Avanzado muestra estos y cualquier otro que exista en la tabla.
 */
export const BUSINESS_SECTIONS: BusinessSection[] = [
  {
    id: "company",
    title: "Empresa",
    description: "Datos de identificación y contacto que aparecen en documentos y en el ecommerce.",
    fields: [
      { key: "CompanyName", label: "Razón social", control: "text", placeholder: "OPOLARITY SAC" },
      { key: "CompanyShortName", label: "Nombre comercial", control: "text", placeholder: "Opolarity" },
      { key: "CompanyCode", label: "Código de empresa", control: "text", help: "Identificador interno usado por el chatbot y el ecommerce." },
      {
        key: "CompanyDocumentType",
        label: "Tipo de documento",
        control: "select",
        options: [
          { label: "RUC", value: "RUC" },
          { label: "DNI", value: "DNI" },
        ],
      },
      { key: "CompanyDocumentNumber", label: "Número de documento", control: "text", placeholder: "20611215895" },
      { key: "CompanyPhoneNumber", label: "Teléfono", control: "text" },
      { key: "CompanyEmail", label: "Correo", control: "email", placeholder: "admin@empresa.com" },
      { key: "CompanyAddress", label: "Dirección fiscal", control: "text" },
      { key: "CompanyWebsite", label: "Sitio web", control: "text", placeholder: "https://..." },
    ],
  },
  {
    id: "invoicing",
    title: "Facturación",
    description: "Branding y textos que se imprimen en comprobantes y tickets.",
    fields: [
      {
        key: "InvoiceLogoUrl",
        label: "Logo del comprobante",
        control: "image",
        help: "Se imprime en facturas, boletas, tickets de POS y etiquetas de envío.",
      },
      {
        key: "InvoiceFooterMessage",
        label: "Mensaje de pie de comprobante",
        control: "textarea",
        help: "Texto legal o informativo al final del comprobante.",
      },
    ],
  },
  {
    id: "operations",
    title: "Operación",
    description: "Parámetros logísticos y de tiempos del negocio.",
    fields: [
      {
        key: "TimeToCancelPendingOrder",
        label: "Horas para cancelar órdenes pendientes",
        control: "number",
        help: "Tiempo tras el cual una orden pendiente de pago libera su reserva de stock.",
      },
      {
        key: "CompanyDireccionPartida",
        label: "Dirección de partida",
        control: "text",
        help: "Punto de origen usado en las guías de remisión.",
      },
    ],
  },
];

export const CURATED_KEYS = BUSINESS_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key),
);
