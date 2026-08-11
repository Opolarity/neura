import { Badge, type BadgeProps } from "@/components/ui/badge";

/** Solo los campos de estado: lo cumplen tanto el item del listado como el detalle. */
interface SupportStatusFields {
  status: string;
  statusSource: string;
  statusCategory: string | null;
}

type StatusVariant = NonNullable<BadgeProps["variant"]>;

const FALLBACK_VARIANT: StatusVariant = "pending";

// Prioridad 1: status_category (la solicitud ya es tarea en OPOLARITY).
// Conjunto ABIERTO: una categoría nueva cae al fallback, no se rompe ni se oculta.
const CATEGORY_VARIANT: Record<string, StatusVariant> = {
  todo: "pending",
  in_progress: "info",
  done: "success",
  blocked: "warning",
  cancelled: "destructive",
};

// Prioridad 2: solo cuando todavía no es tarea (status_source = "solicitud").
const SOLICITUD_VARIANT: Record<string, StatusVariant> = {
  recibido: "info",
  rechazado: "destructive",
};

const resolveStatusVariant = (item: SupportStatusFields): StatusVariant => {
  if (item.statusCategory) {
    return CATEGORY_VARIANT[item.statusCategory.toLowerCase()] ?? FALLBACK_VARIANT;
  }
  if (item.statusSource === "solicitud") {
    return SOLICITUD_VARIANT[item.status.toLowerCase()] ?? FALLBACK_VARIANT;
  }
  return FALLBACK_VARIANT;
};

interface SupportStatusBadgeProps {
  item: SupportStatusFields;
}

/**
 * El texto del estado se muestra TAL CUAL viene de OPOLARITY (los nombres son
 * configurables allá); solo el color se deriva, con fallback gris.
 */
export const SupportStatusBadge = ({ item }: SupportStatusBadgeProps) => (
  <div className="flex flex-col gap-0.5">
    <Badge variant={resolveStatusVariant(item)} className="capitalize w-fit">
      {item.status}
    </Badge>
    {item.statusSource === "solicitud" && item.status.toLowerCase() === "recibido" && (
      <span className="text-[11px] text-muted-foreground">En revisión</span>
    )}
  </div>
);
