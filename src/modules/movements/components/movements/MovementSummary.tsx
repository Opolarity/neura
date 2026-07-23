import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { CurrentUserProfile } from "../../types/Movements.types";

interface MovementSummaryProps {
  isIncome: boolean;
  label: string;
  fundsAccountName: string;
  hasAccountSelected: boolean;
  businessAccountAmount: number;
  remainingAmount: number;
  exceedsAvailableAmount: boolean;
  currentUserProfile: CurrentUserProfile | null;
  loading: boolean;
  onCancel: () => void;
}

const formatSoles = (value: number): string =>
  `S/ ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))}`;

const MovementSummary = ({
  isIncome,
  label,
  fundsAccountName,
  hasAccountSelected,
  businessAccountAmount,
  remainingAmount,
  exceedsAvailableAmount,
  currentUserProfile,
  loading,
  onCancel,
}: MovementSummaryProps) => {
  const movementAmount = Math.abs(remainingAmount - businessAccountAmount);
  const registeredBy = currentUserProfile
    ? `${currentUserProfile.name} ${currentUserProfile.last_name}`.trim()
    : "—";

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Resumen
      </p>

      {/* Cuenta */}
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">
          {isIncome ? "Cuenta de destino" : "Cuenta de origen"}
        </p>
        <p className="text-base font-semibold">
          {hasAccountSelected ? fundsAccountName || "—" : "—"}
        </p>
      </div>

      {/* Saldos */}
      {hasAccountSelected && (
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Saldo actual</span>
            <span className="text-sm font-medium">{formatSoles(businessAccountAmount)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {isIncome ? "Este ingreso" : "Este gasto"}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                movementAmount <= 0
                  ? "text-muted-foreground"
                  : isIncome
                  ? "text-green-600"
                  : "text-destructive"
              )}
            >
              {movementAmount > 0
                ? `${isIncome ? "+" : "−"} ${formatSoles(movementAmount)}`
                : "—"}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t pt-2">
            <span className="text-sm">Saldo resultante</span>
            <span
              className={cn(
                "text-base font-semibold",
                exceedsAvailableAmount ? "text-destructive" : ""
              )}
            >
              {formatSoles(remainingAmount)}
            </span>
          </div>
          {exceedsAvailableAmount && (
            <p className="text-xs text-destructive">
              El monto supera el saldo disponible
            </p>
          )}
        </div>
      )}

      {/* Registrado por */}
      <div className="border-t pt-4">
        <p className="text-[13px] text-muted-foreground">
          Registrado por <span className="font-semibold text-foreground">{registeredBy}</span>
        </p>
      </div>

      {/* Acciones */}
      <div className="space-y-2 pt-1">
        <Button type="submit" className="w-full" disabled={loading || exceedsAvailableAmount}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar {label}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default MovementSummary;
