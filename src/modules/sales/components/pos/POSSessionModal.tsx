import { useState, useEffect } from "react";
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
import { Loader2, Store } from "lucide-react";
import type { OpenPOSSessionRequest, CashRegister } from "../../types/POS.types";
import { getCashRegisters } from "../../services/POSSession.service";

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
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string>("");
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loadingCashRegisters, setLoadingCashRegisters] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCashRegisters();
    }
  }, [isOpen]);

  const loadCashRegisters = async () => {
    try {
      setLoadingCashRegisters(true);
      const data = await getCashRegisters();
      setCashRegisters(data);
      // Auto-select first cash register if only one exists
      if (data.length === 1) {
        setSelectedCashRegisterId(String(data[0].id));
      }
    } catch (error) {
      console.error("Error loading cash registers:", error);
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCashRegisterId || openingAmount === "" || openingAmount === null) {
      return;
    }
    
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      return;
    }
    
    await onOpen({ 
      openingAmount: amount, 
      businessAccountId: parseInt(selectedCashRegisterId),
      notes: notes || undefined 
    });
  };

  const handleCancel = () => {
    navigate("/ventas");
  };

  const isAmountValid = openingAmount !== "" && !isNaN(parseFloat(openingAmount)) && parseFloat(openingAmount) >= 0;
  const isFormValid = selectedCashRegisterId && isAmountValid && !loadingCashRegisters;

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
                Seleccione la caja e ingrese el monto inicial
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cashRegister">Caja *</Label>
            {loadingCashRegisters ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando cajas...
              </div>
            ) : (
              <Select
                value={selectedCashRegisterId}
                onValueChange={setSelectedCashRegisterId}
                required
              >
                <SelectTrigger id="cashRegister">
                  <SelectValue placeholder="Seleccione una caja" />
                </SelectTrigger>
                <SelectContent>
                  {cashRegisters.map((register) => (
                    <SelectItem key={register.id} value={String(register.id)}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {cashRegisters.length === 0 && !loadingCashRegisters && (
              <p className="text-xs text-destructive">
                No hay cajas disponibles
              </p>
            )}
          </div>

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
            <p className="text-xs text-muted-foreground">
              Ingrese el dinero en efectivo con el que inicia la caja
            </p>
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
