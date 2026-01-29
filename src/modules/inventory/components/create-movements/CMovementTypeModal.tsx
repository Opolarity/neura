import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CMovementTypeModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isConfirm, setIsConfirm] = useState(false);
  const types = [
    { id: 13, name: "Intercambio de tipo", code: "TRS" },
    { id: 14, name: "Ingreso de mercadería", code: "TRS" },
  ];
  const [typeMovementId, setTypeMovementId] = useState<string | undefined>(
    undefined,
  );

  //Functions
  const closeModal = () => {
    if (typeMovementId !== undefined && isConfirm) {
      setIsOpen(false);
    }
  };
  const nextStep = () => {
    if (typeMovementId === undefined) return;
    setIsOpen(false);
    setIsConfirm(true);
  };

  //Events
  const handleTypeMovement = (v: string) => {
    setTypeMovementId(v);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar elemento</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-type">Tipo de Movimiento</Label>

            <Select
              value={typeMovementId}
              onValueChange={(v) => handleTypeMovement(v)}
            >
              <SelectTrigger id="movement-type" aria-labelledby="movement-type">
                <SelectValue placeholder="Seleccione un tipo"></SelectValue>
              </SelectTrigger>
              <SelectContent>
                {types.map((type, index) => (
                  <SelectItem key={index} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={nextStep}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CMovementTypeModal;
