import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import {
  SALE_PAYMENT_STATUS_LABEL,
  SALE_PAYMENT_STATUS_SHORT_LABEL,
  type SalePaymentStatus,
} from "../../utils/salePaymentStatus";

const STATUS_VARIANT: Record<SalePaymentStatus, NonNullable<BadgeProps["variant"]>> = {
  paid: "success",
  pending: "warning",
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
    <Badge variant={STATUS_VARIANT[status]} className={cn("w-fit", className)}>
      {labels[status]}
    </Badge>
  );
};
