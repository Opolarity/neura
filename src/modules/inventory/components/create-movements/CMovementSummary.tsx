import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface CMovementSummaryProps {
  movementType: string;
  userName: string;
  warehouseName: string;
  currentDate: string;
}

const CMovementSummary = ({
  movementType,
  userName,
  warehouseName,
  currentDate,
}: CMovementSummaryProps) => {
  return (
    <>
      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Tipo de Movimiento</Label>
          <Input
            className="bg-muted"
            placeholder="Intercambio de tipo"
            disabled
            type="text"
            value={movementType || ""}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Usuario</Label>
          <Input
            className="bg-muted"
            placeholder="Kevin"
            disabled
            type="text"
            value={userName || ""}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén</Label>
          <Input
            className="bg-muted"
            placeholder="Almacén"
            disabled
            type="text"
            value={warehouseName || ""}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Fecha</Label>
          <Input
            className="bg-muted"
            placeholder="29-01-2026"
            disabled
            type="text"
            value={format(
              new Date(currentDate.replace(/-/g, "/")),
              "dd/MM/yyyy",
            ) || ""}
          />
        </div>
      </div>
    </>
  );
};

export default CMovementSummary;
