/**
 * Etiqueta legible del origen de una solicitud. El valor que filtra es el host
 * (lo normaliza la API externa); aquí solo se le pone nombre a los que
 * conocemos y se cae al host crudo para cualquier otro: los dominios pueden
 * cambiar o aparecer nuevos, y un mapa cerrado envejecería mal.
 */
const HOST_LABELS: Record<string, string> = {
  "erp.neura.pe": "ERP",
  "demo.neura.pe": "ERP (demo)",
  "app.neura.pe": "Ecommerce",
  "demo.app.neura.pe": "Ecommerce (demo)",
  "mi.neura.pe": "Portal del cliente",
  "demo.mi.neura.pe": "Portal del cliente (demo)",
  "a.tasks.neura.pe": "Formulario público",
  "tasks.neura.pe": "Formulario público",
};

export const NO_ORIGIN_LABEL = "Sin origen";

/** `host` viene ya normalizado de la API; "" = sin origen registrado. */
export const originLabelFromHost = (host: string): string => {
  const normalized = host.trim().toLowerCase();
  if (!normalized) return NO_ORIGIN_LABEL;
  return HOST_LABELS[normalized] ?? normalized;
};

/**
 * Host a partir de la URL, por si la API no mandó `origin_host` (versión
 * anterior del endpoint). Misma normalización que hace el backend.
 */
export const originHostFromUrl = (url: string | null): string => {
  const raw = url?.trim().toLowerCase();
  if (!raw) return "";
  return raw
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/^.*@/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
};
