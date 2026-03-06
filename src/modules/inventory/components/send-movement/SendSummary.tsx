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

interface SimpleWarehouse {
  id: number;
  name: string;
}

interface SimpleSituation {
  id: number;
  name: string;
  code: string;
}

interface SendSummaryProps {
  userName: string;
  userWarehouseName: string;
  warehouses: SimpleWarehouse[];
  selectedWarehouseId: string | undefined;
  reason: string;
  statusName: string;
  situations: SimpleSituation[];
  selectedSituationCode: string | undefined;
  onWarehouseChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSituationChange: (value: string) => void;
}

const SendSummary = ({
  userName,
  userWarehouseName,
  warehouses,
  selectedWarehouseId,
  reason,
  statusName,
  situations,
  selectedSituationCode,
  onWarehouseChange,
  onReasonChange,
  onSituationChange,
}: SendSummaryProps) => {
  return (
    <>
      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Usuario</Label>
          <Input className="bg-muted" disabled type="text" value={userName || ""} />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Mi Almacén (Origen)</Label>
          <Input className="bg-muted" disabled type="text" value={userWarehouseName || ""} />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén Destino (Enviar a)</Label>
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
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Fecha</Label>
          <Input className="bg-muted" disabled type="text" value={format(new Date(), "dd/MM/yyyy")} />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Estado</Label>
          <Input className="bg-muted" disabled type="text" value={statusName || ""} />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Situación</Label>
          <Select value={selectedSituationCode} onValueChange={onSituationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una situación" />
            </SelectTrigger>
            <SelectContent>
              {situations.map((sit) => (
                <SelectItem key={sit.id} value={sit.code}>
                  {sit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Motivo del envío</Label>
        <Textarea
          placeholder="Ingresa el motivo del envío..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={2}
        />
      </div>
    </>
  );
};

export default SendSummary;