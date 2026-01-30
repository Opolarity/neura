import { useState } from "react";
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
import { Loader2, DollarSign, Store } from "lucide-react";
import type { OpenPOSSessionRequest } from "../../types/POS.types";

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
  const [openingAmount, setOpeningAmount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount) || 0;
    await onOpen({ openingAmount: amount, notes: notes || undefined });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >        
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Apertura de Caja</DialogTitle>
              <DialogDescription>
                Ingrese el monto inicial para comenzar la sesion
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openingAmount">Monto Inicial</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="pl-10 text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500">
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

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isOpening}
          >
            {isOpening ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Abriendo caja...
              </>
            ) : (
              "Iniciar Sesion"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
