import { useAuth } from "@/modules/auth/hooks/useAuth";

/**
 * Datos que el ERP ya tiene cargados en la sesión (useAuth), para que un
 * Texto los muestre en vez de escribirlos a mano: los de la empresa
 * (parámetros de Configuración > Negocio que usan los comprobantes). En el
 * editor se ven los de verdad, no de ejemplo, y no se escriben. El cajero no
 * va aquí: es quien emitió el comprobante, no quien imprime.
 */

export type ContextSourceId = "business";

export interface ContextField {
  key: string;
  label: string;
}

export interface ContextSource {
  id: ContextSourceId;
  label: string;
  fields: readonly ContextField[];
  /**
   * Interruptores de la configuración (mostrar o no un dato): no se escriben,
   * solo deciden si un Contenedor se oculta. Valen «Sí» si están encendidos
   * (como hoy: todo lo que no sea "false") y vacío si no.
   */
  switches?: readonly ContextField[];
}

/** Las claves de la empresa son los nombres de sus parámetros. */
export const CONTEXT_SOURCES: Record<ContextSourceId, ContextSource> = {
  business: {
    id: "business",
    label: "Datos de la empresa",
    fields: [
      { key: "CompanyName", label: "Razón social" },
      { key: "CompanyShortName", label: "Nombre corto" },
      { key: "CompanyDocumentNumber", label: "RUC" },
      { key: "CompanyAddress", label: "Domicilio fiscal" },
      // No es un parámetro: la primera sucursal activa (AuthProvider).
      { key: "BranchAddress", label: "Dirección de la sucursal" },
      { key: "CompanyPhoneNumber", label: "Teléfono" },
      { key: "CompanyEmail", label: "Correo" },
      { key: "CompanyWebsite", label: "Sitio web" },
      { key: "CompanyDireccionPartida", label: "Dirección de partida" },
      {
        key: "RemisionGuideFooterMessage",
        label: "Pie de la guía de remisión",
      },
    ],
    switches: [
      { key: "RemisionGuideShowPhone", label: "Guía: mostrar el teléfono" },
      { key: "RemisionGuideShowEmail", label: "Guía: mostrar el correo" },
    ],
  },
};

const SWITCH_KEYS = new Set(
  Object.values(CONTEXT_SOURCES).flatMap((source) =>
    (source.switches ?? []).map((field) => field.key),
  ),
);

/** Las imágenes de la configuración, para una Imagen (no para un Texto). */
export const CONTEXT_IMAGES: readonly ContextField[] = [
  { key: "InvoiceLogoUrl", label: "Logo del comprobante" },
];

export const isContextSource = (id: string): id is ContextSourceId =>
  id in CONTEXT_SOURCES;

/** Los datos de la sesión, por fuente y clave. "" si no hay. */
export function useContextValues() {
  const { documentParameters } = useAuth();
  return (sourceId: ContextSourceId, key: string): string => {
    void sourceId;
    const value = (documentParameters[key] ?? "").trim();
    if (SWITCH_KEYS.has(key)) return value === "false" ? "" : "Sí";
    return value;
  };
}
