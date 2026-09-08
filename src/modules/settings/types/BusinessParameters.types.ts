export type BusinessFieldControl =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "image"
  | "boolean";

export interface BusinessField {
  /** Valor de la columna `name` en la tabla public.parameters */
  key: string;
  label: string;
  help?: string;
  control: BusinessFieldControl;
  placeholder?: string;
  options?: { label: string; value: string }[];
  /** Se muestra pero no se puede editar ni se envía al guardar. */
  readOnly?: boolean;
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
      {
        key: "CompanyCode",
        label: "Código de empresa",
        control: "text",
        readOnly: true,
        help: "Identificador interno usado por el chatbot y el ecommerce. No es editable.",
      },
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
      { key: "CompanyInstagram", label: "Instagram", control: "text", placeholder: "https://instagram.com/..." },
      { key: "CompanyFacebook", label: "Facebook", control: "text", placeholder: "https://facebook.com/..." },
      { key: "CompanyTiktok", label: "TikTok", control: "text", placeholder: "https://tiktok.com/@..." },
    ],
  },
  {
    id: "invoicing",
    title: "Facturación",
    description: "Branding y textos que se imprimen en comprobantes y tickets.",
    fields: [
      {
        key: "InvoiceEnabled",
        label: "Activar uso de facturación",
        control: "boolean",
        help: "Habilita la emisión de comprobantes electrónicos en el sistema.",
      },
      {
        key: "InvoiceShowDocumentTypeAndNumber",
        label: "Mostrar tipo y número de documento en el comprobante",
        control: "boolean",
      },
      {
        key: "InvoiceShowEmail",
        label: "Mostrar correo en el comprobante",
        control: "boolean",
      },
      {
        key: "InvoiceShowAddress",
        label: "Mostrar dirección en el comprobante",
        control: "boolean",
      },
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
        help: "Tiempo tras el cual una orden En proceso sin pagos libera su reserva de stock.",
      },
      {
        key: "LowStockThreshold",
        label: "Umbral de stock bajo (unidades)",
        control: "number",
        help: "Un SKU se considera con stock bajo cuando su stock vendible en almacenes activos es mayor a 0 y menor o igual a este valor. Gobierna la alerta de la campana al cruzar el umbral, el indicador de los listados de inventario y productos, y la bandeja de reposición (Reportes → Inventario). Sin valor configurado no se emiten alertas.",
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

/** Parámetros que la página muestra pero nunca escribe. */
export const READ_ONLY_KEYS = BUSINESS_SECTIONS.flatMap((section) =>
  section.fields.filter((field) => field.readOnly).map((field) => field.key),
);
