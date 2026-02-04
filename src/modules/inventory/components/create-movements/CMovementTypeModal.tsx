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
import { TypesStock } from "@/shared/types/type";

interface CMovementTypeModalProps {
  types: TypesStock[];
  onTypeStock: (typeStock: TypesStock | null) => void;
}

const CMovementTypeModal = ({ types, onTypeStock }: CMovementTypeModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isConfirm, setIsConfirm] = useState(false);
  const [typeMovementId, setTypeMovementId] = useState<string>("");
  const [selectedMovementType, setSelectedMovementType] = useState<TypesStock | null>(null);

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
    onTypeStock(selectedMovementType);
  };

  //Events
  const handleTypeMovement = (v: string) => {
    setTypeMovementId(v);
    const findMovementType = types.find((type) => type.id.toString() === v);
    setSelectedMovementType(findMovementType);
  };

  const typesMovement = types.filter((type) => type.code === "TRS" || type.code === "MER");

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
                {typesMovement && typesMovement.length > 0 ? (
                  typesMovement.map((type, index) => (
                    <SelectItem key={index} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>Cargando...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={nextStep} disabled={typeMovementId === ""}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CMovementTypeModal;
