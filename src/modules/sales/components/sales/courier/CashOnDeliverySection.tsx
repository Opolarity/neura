import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CashOnDelivery } from "../../../types/Couriers.types";

interface CashOnDeliverySectionProps {
  cod: CashOnDelivery | null;
  onChange: (cod: CashOnDelivery) => void;
  /** Saldo de la venta: es lo que sale a cobrar en el rótulo. */
  balance: number;
  /** Venta en situación física (-PHY) o sin envío: no se cambia. */
  disabled?: boolean;
}

/**
 * Contra entrega: solo la marca. El monto que sale en el rótulo es el saldo
 * de la venta (total − pagos registrados). Quién paga el flete lo resuelve la
 * sección del courier.
 */
export function CashOnDeliverySection({ cod, onChange, balance, disabled = false }: CashOnDeliverySectionProps) {
  const fullyPaid = balance <= 0;

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="cash-on-delivery"
          checked={!!cod?.enabled && !fullyPaid}
          disabled={fullyPaid || disabled}
          onCheckedChange={(checked) => onChange({ enabled: checked === true })}
        />
        <Label htmlFor="cash-on-delivery" className="font-normal">
          Contra entrega: el cliente paga al recibir
        </Label>
      </div>
      {fullyPaid && (
        <p className="text-xs text-muted-foreground">La venta ya está pagada.</p>
      )}
    </div>
  );
}
