import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import {
  COMPLAINT_STATUS_LABEL,
  type ComplaintStatus,
} from "../../types/reclamaciones.types";

/**
 * Badges del libro de reclamaciones.
 *
 * El estado se mapea estado -> variante (no estado -> clases de color), que es
 * lo que pide el sistema visual. Antes el tipo se pintaba con `destructive`
 * sólido en el listado: un rojo pleno por fila para algo que no es un error.
 */

const STATUS_VARIANT: Record<ComplaintStatus, BadgeProps["variant"]> = {
  en_revision: "warning",
  respondido: "success",
  no_respondido: "destructive-soft",
};

export const ComplaintStatusBadge = ({ status }: { status: ComplaintStatus }) => (
  <Badge variant={STATUS_VARIANT[status] ?? "pending"}>
    {COMPLAINT_STATUS_LABEL[status] ?? status}
  </Badge>
);

/**
 * Tipo de reclamo. El SP ya devuelve claim_type ('queja' | 'reclamo'), así que
 * no hay que adivinarlo a partir del texto del detalle como hacía el listado
 * viejo — que por eso mostraba "Reclamo" en todas las filas.
 */
export const ComplaintTypeBadge = ({ claimType }: { claimType: string }) => {
  const isComplaint = claimType.trim().toLowerCase() === "queja";

  return (
    <Badge variant={isComplaint ? "secondary" : "destructive-soft"}>
      {isComplaint ? "Queja" : "Reclamo"}
    </Badge>
  );
};
