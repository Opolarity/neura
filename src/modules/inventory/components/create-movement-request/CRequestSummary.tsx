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
import { formatDateDisplay, getTodayDate } from "@/shared/utils/date";

interface SimpleWarehouse {
  id: number;
  name: string;
}

interface CRequestSummaryProps {
  userName: string;
  userWarehouseName: string;
  warehouses: SimpleWarehouse[];
  selectedWarehouseId: string | undefined;
  reason: string;
  statusName: string;
  situationName: string;
  onWarehouseChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  isEditMode?: boolean;
  editInWarehouseName?: string;
  editOutWarehouseName?: string;
}

const CRequestSummary = ({
  userName,
  userWarehouseName,
  warehouses,
  selectedWarehouseId,
  reason,
  statusName,
  situationName,
  onWarehouseChange,
  onReasonChange,
  isEditMode = false,
  editInWarehouseName,
  editOutWarehouseName,
}: CRequestSummaryProps) => {
  return (
    <>
      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Usuario</Label>
          <Input
            className="bg-muted"
            disabled
            type="text"
            value={userName || ""}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén de ingreso</Label>
          <Input
            className="bg-muted"
            disabled
            type="text"
            value={(isEditMode ? editInWarehouseName : userWarehouseName) || ""}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén de Salida</Label>
          {isEditMode ? (
            <Input
              className="bg-muted"
              disabled
              type="text"
              value={editOutWarehouseName || ""}
            />
          ) : (
            <Select value={selectedWarehouseId} onValueChange={onWarehouseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un almacén" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id.toString()}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Fecha</Label>
          <Input
            className="bg-muted"
            disabled
            type="text"
            value={formatDateDisplay(getTodayDate())}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Estado</Label>
          <Input className="bg-muted" disabled type="text" value={statusName || ""} />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Situación</Label>
          <Input className="bg-muted" disabled type="text" value={situationName || ""} />
        </div>
      </div>

      {!isEditMode && (
        <div className="flex flex-col gap-2">
          <Label>Motivo de la solicitud</Label>
          <Textarea
            placeholder="Ingresa el motivo de la solicitud..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
          />
        </div>
      )}
    </>
  );
};

export default CRequestSummary;
