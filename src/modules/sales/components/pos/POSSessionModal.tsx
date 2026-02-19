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
import { AlertTriangle, Loader2, Store } from "lucide-react";
import type { OpenPOSSessionRequest, POSSaleType } from "../../types/POS.types";
import { getPosSaleTypesByBranch } from "@/shared/services/service";
import { supabase } from "@/integrations/supabase/client";

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
      setLoadingSaleTypes(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("branch_id")
        .eq("UID", user.id)
        .single();

      if (!profile) return;

      const data = await getPosSaleTypesByBranch(profile.branch_id);
      setSaleTypes(data);

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

  const selectedSaleType = saleTypes.find((st) => String(st.id) === selectedSaleTypeId);

  const openingDifference = useMemo(() => {
    if (expectedAmount === null || openingAmount === "") return null;
    const amount = parseFloat(openingAmount);
    if (isNaN(amount)) return null;
    return amount - expectedAmount;
  }, [openingAmount, expectedAmount]);

  const hasDifference = openingDifference !== null && openingDifference !== 0;

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
      businessAccountId: selectedSaleType.businessAccountId,
      saleTypeId: selectedSaleType.id,
      notes: notes || undefined,
    });
  };

  const handleCancel = () => {
    navigate("/sales");
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
          {/* Canal de venta */}
          <div className="space-y-2">
            <Label htmlFor="saleType">Canal de venta *</Label>
            {loadingSaleTypes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando canales...
              </div>
            ) : (
              <Select
                value={selectedSaleTypeId}
                onValueChange={handleSaleTypeChange}
                required
              >
                <SelectTrigger id="saleType">
                  <SelectValue placeholder="Seleccione un canal de venta" />
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
                No hay canales POS disponibles para su sucursal
              </p>
            )}
          </div>

          {/* Caja vinculada - read-only */}
          {selectedSaleTypeId && (
            <div className="space-y-2">
              <Label htmlFor="cashRegister">Caja *</Label>
              <Input
                id="cashRegister"
                value={linkedCashRegisterName}
                readOnly
                disabled
                className="bg-muted"
              />
              {expectedAmount !== null && (
                <p className="text-xs text-muted-foreground">
                  Saldo registrado: {formatCurrency(expectedAmount)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="openingAmount">Monto Inicial *</Label>
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
