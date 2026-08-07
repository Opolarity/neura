import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import {
  SALE_PAYMENT_STATUS_LABEL,
  SALE_PAYMENT_STATUS_SHORT_LABEL,
  type SalePaymentStatus,
} from "../../utils/salePaymentStatus";

const STATUS_CLASS: Record<SalePaymentStatus, string> = {
  paid: "bg-green-500 hover:bg-green-600 text-white",
  pending: "bg-amber-400 hover:bg-amber-500 text-amber-950",
};

interface SalePaymentStatusBadgeProps {
  // undefined = el estado no se pudo calcular (p.ej. falló la consulta de pagos)
  status?: SalePaymentStatus;
  // Etiqueta corta ("Pendiente") para espacios reducidos como el listado.
  short?: boolean;
  className?: string;
}

export const SalePaymentStatusBadge = ({
  status,
  short = false,
  className,
}: SalePaymentStatusBadgeProps) => {
  if (!status) {
    return <span className="text-muted-foreground">—</span>;
  }

  const labels = short
    ? SALE_PAYMENT_STATUS_SHORT_LABEL
    : SALE_PAYMENT_STATUS_LABEL;

  return (
    <Badge className={cn("w-fit", STATUS_CLASS[status], className)}>
      {labels[status]}
    </Badge>
  );
};
