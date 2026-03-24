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
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getSituationBadgeColor = (name?: string) => {
  if (name === 'Aprobado' || name === 'Recibido' || name === 'Enviado' || name === 'Completado') return 'bg-green-500 hover:bg-green-500 text-white border-transparent';
  if (name === 'Negociación' || name === 'Solicitado') return 'bg-yellow-500 hover:bg-yellow-500 text-white border-transparent';
  if (name === 'Cancelado') return 'bg-red-500 hover:bg-red-500 text-white border-transparent';
  return 'bg-secondary text-secondary-foreground hover:bg-secondary';
};

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
          <Label>Mi Almacén (Destino)</Label>
          <Input
            className="bg-muted"
            disabled
            type="text"
            value={userWarehouseName || ""}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén Origen (Solicitar de)</Label>
          {isEditMode ? (
            <Input
              className="bg-muted"
              disabled
              type="text"
              value={warehouses.find((w) => w.id.toString() === selectedWarehouseId)?.name || ""}
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
            value={format(new Date(), "dd/MM/yyyy")}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Estado</Label>
          <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted/50">
             {statusName ? <Badge className={getSituationBadgeColor(statusName)}>{statusName}</Badge> : <span className="text-muted-foreground text-sm">---</span>}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Situación</Label>
          <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted/50">
             {situationName ? <Badge className={getSituationBadgeColor(situationName)}>{situationName}</Badge> : <span className="text-muted-foreground text-sm">---</span>}
          </div>
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
