import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimeField } from "@/shared/components/date-range";
import { getLimaDateTimeNow, limaIsoToDateTimeLocal } from "@/shared/utils/date";
import { AttendancePoint, EmployeeOption, Punch, PunchPayload, PunchType } from "../../types/attendance.types";
import { EmployeePicker } from "./EmployeePicker";

interface PunchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = marca nueva. */
  punch: Punch | null;
  points: AttendancePoint[];
  saving: boolean;
  onSave: (payload: PunchPayload) => Promise<boolean>;
}

const SIN_PUNTO = "none";

/** Registrar o corregir una marca a mano (supervisor). Queda en la auditoría. */
export const PunchFormDialog = ({ open, onOpenChange, punch, points, saving, onSave }: PunchFormDialogProps) => {
  const [employee, setEmployee] = useState<EmployeeOption | null>(null);
  const [punchedAt, setPunchedAt] = useState<string | null>(null);
  const [punchType, setPunchType] = useState<PunchType>("IN");
  const [pointId, setPointId] = useState<string>(SIN_PUNTO);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmployee(
      punch
        ? { accountId: punch.employeeId, code: punch.code, name: punch.name, documentNumber: punch.documentNumber, kind: "COL" }
        : null,
    );
    setPunchedAt(punch ? limaIsoToDateTimeLocal(punch.punchedAt) : getLimaDateTimeNow());
    setPunchType(punch?.punchType ?? "IN");
    setPointId(punch?.pointId ? String(punch.pointId) : SIN_PUNTO);
    setNote(punch?.note ?? "");
  }, [open, punch]);

  const faltan = [!employee && "Trabajador", !punchedAt && "Fecha y hora", !note.trim() && "Motivo"].filter(Boolean);

  const guardar = async () => {
    if (faltan.length > 0 || !punchedAt || !employee) return;
    const ok = await onSave({
      id: punch?.id ?? null,
      employeeId: employee.accountId,
      punchedAt,
      punchType,
      pointId: pointId === SIN_PUNTO ? null : Number(pointId),
      note: note.trim(),
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{punch ? "Corregir marca" : "Registrar marca"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="punch-employee" required>
              Trabajador
            </Label>
            <EmployeePicker id="punch-employee" value={employee} onChange={setEmployee} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="punch-type" required>
                Tipo
              </Label>
              <Select value={punchType} onValueChange={(v) => setPunchType(v as PunchType)}>
                <SelectTrigger id="punch-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Entrada</SelectItem>
                  <SelectItem value="OUT">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="punch-point">Punto</Label>
              <Select value={pointId} onValueChange={setPointId}>
                <SelectTrigger id="punch-point">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_PUNTO}>Sin punto</SelectItem>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="punch-at" required>
              Fecha y hora
            </Label>
            <DateTimeField id="punch-at" value={punchedAt} onChange={setPunchedAt} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="punch-note" required>
              Motivo
            </Label>
            <Textarea
              id="punch-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej.: olvidó marcar la salida"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() => void guardar()}
            disabled={saving || faltan.length > 0}
            title={faltan.length > 0 ? `Falta: ${faltan.join(", ")}` : undefined}
            className="gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
