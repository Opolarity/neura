import type { BadgeProps } from "@/components/ui/badge";

/**
 * Color del badge de etapa, a partir del código del STATUS macro y no del de la
 * situación. Así una etapa nueva del CRM hereda el color de su estado sin tocar
 * este archivo.
 *
 * Vive suelto y no dentro de un componente porque lo usan la lista y el
 * encabezado del hilo. El resto del ERP tiene este mismo mapa copiado en cinco
 * archivos distintos, la mitad indexando por nombre en español; acá se escribe
 * una sola vez.
 */
export const stageBadgeVariant = (statusCode: string | undefined): BadgeProps["variant"] => {
  switch ((statusCode ?? "").toUpperCase()) {
    case "COM":
      return "success";
    case "CAN":
      return "destructive-soft";
    case "PEN":
      return "warning";
    default:
      return "secondary";
  }
};
