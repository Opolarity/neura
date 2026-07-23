import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethodWithAccount } from "../../types/Movements.types";

type BusinessAccountOption = { id: number; name: string; total_amount: number };

interface MovementFundsSourceProps {
  selectedPaymentMethod: PaymentMethodWithAccount | null;
  selectedBusinessAccount: string;
  needsManualBusinessAccount: boolean;
  businessAccounts: BusinessAccountOption[];
  selectedManualBusinessAccountId: string;
  setSelectedManualBusinessAccountId: (value: string) => void;
  isIncome: boolean;
}

const MovementFundsSource = ({
  selectedPaymentMethod,
  selectedBusinessAccount,
  needsManualBusinessAccount,
  businessAccounts,
  selectedManualBusinessAccountId,
  setSelectedManualBusinessAccountId,
  isIncome,
}: MovementFundsSourceProps) => {
  const [manualOverride, setManualOverride] = useState(false);

  // Autoselección: si el pool manual tiene una sola cuenta, elegirla automáticamente.
  const singleAccount =
    needsManualBusinessAccount && businessAccounts.length === 1
      ? businessAccounts[0]
      : null;

  useEffect(() => {
    if (singleAccount && !selectedManualBusinessAccountId && !manualOverride) {
      setSelectedManualBusinessAccountId(singleAccount.id.toString());
    }
  }, [singleAccount, selectedManualBusinessAccountId, manualOverride, setSelectedManualBusinessAccountId]);

  // Al cambiar de método, reiniciar el override para volver a la autoselección.
  useEffect(() => {
    setManualOverride(false);
  }, [selectedPaymentMethod?.id]);

  const label = isIncome ? "Cuenta de destino *" : "Cuenta de origen *";
  const hint = isIncome ? "el dinero entra aquí" : "de aquí sale el dinero";

  // Cuenta de solo lectura (método con cuenta fija, o autoselección de cuenta única)
  const readOnlyName =
    !needsManualBusinessAccount
      ? selectedBusinessAccount || selectedPaymentMethod?.business_accounts?.name || ""
      : singleAccount && !manualOverride
      ? singleAccount.name
      : null;

  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-3 transition-colors">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
          {label}
        </p>
        <div className="flex items-center gap-2">
          {readOnlyName && singleAccount && !manualOverride && (
            <button
              type="button"
              onClick={() => setManualOverride(true)}
              className="text-xs text-primary hover:underline"
            >
              Cambiar
            </button>
          )}
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      </div>

      <div className="mt-2">
        {!selectedPaymentMethod ? (
          <p className="text-[13px] text-muted-foreground">
            Elige un método de pago para definir la cuenta.
          </p>
        ) : readOnlyName ? (
          <div className="flex h-10 items-center rounded-md border bg-background px-3 text-sm">
            {readOnlyName || "—"}
          </div>
        ) : (
          <Select
            value={selectedManualBusinessAccountId}
            onValueChange={setSelectedManualBusinessAccountId}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Seleccionar cuenta" />
            </SelectTrigger>
            <SelectContent>
              {businessAccounts.map((ba) => (
                <SelectItem key={ba.id} value={ba.id.toString()}>
                  {ba.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default MovementFundsSource;
