import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/shared/utils/currency";
import { Wallet, X } from "lucide-react";

interface SupplierPaymentsBulkBarProps {
  count: number;
  total: number;
  onClear: () => void;
  onPay: () => void;
}

/**
 * Lo que se ha marcado y qué se puede hacer con ello.
 *
 * Aparece solo con algo marcado, debajo de los filtros. Lleva la cifra
 * delante porque es lo que se comprueba antes de pulsar: no cuántos son, sino
 * cuánto suman.
 */
const SupplierPaymentsBulkBar = ({
  count,
  total,
  onClear,
  onPay,
}: SupplierPaymentsBulkBarProps) => {
  if (count === 0) return null;

  return (
    <div className="bg-muted/50 mt-3 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
      <span className="text-sm">
        <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
        <span className="text-muted-foreground">
          {" "}
          en {count} {count === 1 ? "servicio" : "servicios"}
        </span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
          <X className="h-4 w-4" />
          Quitar selección
        </Button>
        <Button size="sm" onClick={onPay} className="gap-2">
          <Wallet className="h-4 w-4" />
          Pagar seleccionados
        </Button>
      </div>
    </div>
  );
};

export default SupplierPaymentsBulkBar;
