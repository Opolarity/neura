import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPLAINT_STATUS_LABEL,
  type ComplaintStatus,
} from "../../types/reclamaciones.types";

interface ReclamacionesFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ComplaintStatus | "";
  onApply: (status: ComplaintStatus | "") => void;
}

/** Valor del Select para "sin filtro": Radix no admite un SelectItem con "". */
const ALL = "all";

const ReclamacionesFilterModal = ({
  open,
  onOpenChange,
  status,
  onApply,
}: ReclamacionesFilterModalProps) => {
  const [internalStatus, setInternalStatus] = useState<ComplaintStatus | "">(status);

  useEffect(() => {
    if (open) setInternalStatus(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = () => {
    onApply(internalStatus);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, el mismo patrón que el resto de
            filtros del sistema: hoy solo hay un estado, pero el modal no debe
            poder empujar el footer fuera de la pantalla cuando se le agreguen
            filtros. El max-h va en un contenedor propio, no en el ScrollArea ni
            en el DialogContent. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="complaint-status">Estado</Label>
                <Select
                  value={internalStatus === "" ? ALL : internalStatus}
                  onValueChange={(value) =>
                    setInternalStatus(value === ALL ? "" : (value as ComplaintStatus))
                  }
                >
                  <SelectTrigger id="complaint-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {(Object.keys(COMPLAINT_STATUS_LABEL) as ComplaintStatus[]).map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {COMPLAINT_STATUS_LABEL[value]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setInternalStatus("")}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReclamacionesFilterModal;
