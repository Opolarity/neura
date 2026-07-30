import { Badge } from "@/components/ui/badge";

/** Solo los campos de estado: lo cumplen tanto el item del listado como el detalle. */
interface SupportStatusFields {
  status: string;
  statusSource: string;
  statusCategory: string | null;
}

const FALLBACK_CLASS = "bg-slate-100 text-slate-700 border-slate-200";

// Prioridad 1: status_category (la solicitud ya es tarea en OPOLARITY).
// Conjunto ABIERTO: una categoría nueva cae al fallback, no se rompe ni se oculta.
const CATEGORY_CLASS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blocked: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

// Prioridad 2: solo cuando todavía no es tarea (status_source = "solicitud").
const SOLICITUD_CLASS: Record<string, string> = {
  recibido: "bg-indigo-100 text-indigo-700 border-indigo-200",
  rechazado: "bg-rose-100 text-rose-700 border-rose-200",
};

const resolveStatusClass = (item: SupportStatusFields): string => {
  if (item.statusCategory) {
    return CATEGORY_CLASS[item.statusCategory.toLowerCase()] ?? FALLBACK_CLASS;
  }
  if (item.statusSource === "solicitud") {
    return SOLICITUD_CLASS[item.status.toLowerCase()] ?? FALLBACK_CLASS;
  }
  return FALLBACK_CLASS;
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
    <Badge variant="outline" className={`${resolveStatusClass(item)} capitalize w-fit`}>
      {item.status}
    </Badge>
    {item.statusSource === "solicitud" && item.status.toLowerCase() === "recibido" && (
      <span className="text-[11px] text-muted-foreground">En revisión</span>
    )}
  </div>
);
