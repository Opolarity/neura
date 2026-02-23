import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Store, AlertTriangle } from "lucide-react";
import type { OpenPOSSessionRequest, CashRegister } from "../../types/POS.types";
import { getCashRegisters } from "../../services/POSSession.service";
import { formatCurrency } from "../../adapters/POS.adapter";

interface POSSessionModalProps {
  isOpen: boolean;
  isOpening: boolean;
  onOpen: (request: OpenPOSSessionRequest) => Promise<unknown>;
}

export default function POSSessionModal({
  isOpen,
  isOpening,
  onOpen,
}: POSSessionModalProps) {
  const navigate = useNavigate();
  const [openingAmount, setOpeningAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedSaleTypeId, setSelectedSaleTypeId] = useState<string>("");
  const [saleTypes, setSaleTypes] = useState<POSSaleType[]>([]);
  const [loadingSaleTypes, setLoadingSaleTypes] = useState(true);
  const [linkedCashRegisterName, setLinkedCashRegisterName] = useState<string>("");
  const [expectedAmount, setExpectedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSaleTypes();
    }
  }, [isOpen]);

  const loadSaleTypes = async () => {
    try {
      setLoadingCashRegisters(true);
      const data = await getCashRegisters();
      setCashRegisters(data);
      if (data.length === 1) {
        setSelectedSaleTypeId(String(data[0].id));
        loadCashRegisterData(data[0].businessAccountId);
      }
    } catch (error) {
      console.error("Error loading POS sale types:", error);
    } finally {
      setLoadingSaleTypes(false);
    }
  };

  const loadCashRegisterData = async (businessAccountId: number | null) => {
    if (!businessAccountId) {
      setLinkedCashRegisterName("");
      setExpectedAmount(null);
      return;
    }
    const { data } = await supabase
      .from("business_accounts")
      .select("name, total_amount")
      .eq("id", businessAccountId)
      .single();
    setLinkedCashRegisterName(data?.name || "");
    setExpectedAmount(data?.total_amount ?? 0);
  };

  const handleSaleTypeChange = (value: string) => {
    setSelectedSaleTypeId(value);
    setOpeningAmount("");
    const selected = saleTypes.find((st) => String(st.id) === value);
    if (selected) {
      loadCashRegisterData(selected.businessAccountId);
    } else {
      setLinkedCashRegisterName("");
      setExpectedAmount(null);
    }
  };

  const selectedRegister = useMemo(() => {
    if (!selectedCashRegisterId) return null;
    return cashRegisters.find(r => String(r.id) === selectedCashRegisterId) || null;
  }, [selectedCashRegisterId, cashRegisters]);

  const expectedAmount = selectedRegister?.totalAmount ?? 0;

  const parsedAmount = openingAmount !== "" ? parseFloat(openingAmount) : null;
  const difference = parsedAmount !== null && !isNaN(parsedAmount) ? parsedAmount - expectedAmount : null;
  const hasNegativeDifference = difference !== null && difference < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSaleTypeId || !selectedSaleType?.businessAccountId || openingAmount === "" || openingAmount === null) {
      return;
    }

    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      return;
    }
    
    await onOpen({ 
      openingAmount: amount, 
      businessAccountId: parseInt(selectedCashRegisterId),
      openingDifference: difference ?? 0,
      notes: notes || undefined 
    });
  };

  const handleCancel = () => {
    navigate("/pos");
  };

  const isAmountValid = openingAmount !== "" && !isNaN(parseFloat(openingAmount)) && parseFloat(openingAmount) >= 0;
  const isFormValid = selectedSaleTypeId && selectedSaleType?.businessAccountId && isAmountValid && !loadingSaleTypes;

  const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Apertura de Caja</DialogTitle>
              <DialogDescription>
                Seleccione el canal de venta e ingrese el monto inicial
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Canal de venta y Caja en dos columnas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleType">Canal de venta *</Label>
              {loadingSaleTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </div>
              ) : (
                <Select
                  value={selectedSaleTypeId}
                  onValueChange={handleSaleTypeChange}
                  required
                >
                  <SelectTrigger id="saleType">
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {saleTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {saleTypes.length === 0 && !loadingSaleTypes && (
                <p className="text-xs text-destructive">
                  No hay canales POS disponibles
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashRegister">Caja *</Label>
              <Input
                id="cashRegister"
                value={linkedCashRegisterName}
                readOnly
                disabled
                placeholder={selectedSaleTypeId ? "" : "Seleccione canal"}
                className="bg-muted"
              />
              {expectedAmount !== null && (
                <p className="text-xs text-muted-foreground">
                  Saldo: {formatCurrency(expectedAmount)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openingAmount">Monto Inicial *</Label>
              {selectedRegister && (
                <span className="text-sm text-muted-foreground">
                  Saldo en sistema: <span className="font-semibold text-foreground">S/ {formatCurrency(expectedAmount)}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                S/
              </span>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                required
              />
            </div>

            {/* Difference warning */}
            {hasDifference && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-xs text-destructive">
                  <p className="font-medium">Diferencia detectada</p>
                  <p>
                    Monto esperado: {formatCurrency(expectedAmount!)} — Diferencia:{" "}
                    <span className="font-semibold">
                      {openingDifference! > 0 ? "+" : ""}
                      {formatCurrency(openingDifference!)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {!hasDifference && openingAmount !== "" && expectedAmount !== null && (
              <p className="text-xs text-muted-foreground">
                Monto coincide con el saldo registrado ✓
              </p>
            )}
          </div>

          {/* Difference display */}
          {difference !== null && difference !== 0 && selectedRegister && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diferencia</span>
                <span className="font-semibold text-destructive">
                  {difference > 0 ? '+' : ''} S/ {formatCurrency(difference)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>El monto inicial no coincide con el saldo registrado en el sistema. Esta diferencia se guardará.</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de la apertura..."
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isOpening}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isOpening || !isFormValid}
            >
              {isOpening ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Abriendo...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}