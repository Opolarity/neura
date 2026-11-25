import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceDevice, AttendancePoint, ClockPayload } from "../../types/attendance.types";
import { PointSelect } from "./PointSelect";

interface ClockFormDialogProps {
  /** Reloj a editar; null = cerrado. */
  device: AttendanceDevice | null;
  points: AttendancePoint[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: ClockPayload) => Promise<number | null>;
}

/** Editar un reloj: nombre y punto. El número de serie es el del equipo y no cambia. */
export const ClockFormDialog = ({ device, points, saving, onOpenChange, onSave }: ClockFormDialogProps) => {
  const [name, setName] = useState("");
  const [pointId, setPointId] = useState("");

  useEffect(() => {
    if (!device) return;
    setName(device.name);
    setPointId(device.pointId ? String(device.pointId) : "");
  }, [device]);

  const guardar = async () => {
    if (!device) return;
    const id = await onSave({ id: device.id, name: name.trim(), serial: device.serialNumber ?? "", pointId: Number(pointId) });
    if (id) onOpenChange(false);
  };

  return (
    <Dialog open={device !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar reloj de huella</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clock-edit-name" required>
              Nombre
            </Label>
            <Input id="clock-edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clock-edit-serial">Número de serie</Label>
            <Input id="clock-edit-serial" value={device?.serialNumber ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clock-edit-point" required>
              Punto donde está
            </Label>
            <PointSelect id="clock-edit-point" points={points} value={pointId} onChange={setPointId} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={() => void guardar()} disabled={saving || !name.trim() || !pointId}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
