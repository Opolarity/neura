import { useEffect, useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/shared/hooks/use-toast";
import { AttendancePoint, PointPayload } from "../../types/attendance.types";
import { getBrowserLocation, LOCATION_ERROR_MESSAGES } from "../../utils/format";

interface PointFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: AttendancePoint | null;
  saving: boolean;
  onSave: (payload: PointPayload) => Promise<boolean>;
}

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

/**
 * Punto de marcación: dónde se puede marcar. Ubicación y radio son
 * obligatorios: el kiosco y el celular tienen que estar dentro. Sin dirección
 * (se ve en el mapa desde las coordenadas) ni IPs permitidas (quién marca dónde
 * ya lo limitan los puntos y relojes de cada trabajador).
 */
export const PointFormDialog = ({ open, onOpenChange, point, saving, onSave }: PointFormDialogProps) => {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");
  const [requirePhoto, setRequirePhoto] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(point?.name ?? "");
    setLat(point?.latitude !== null && point?.latitude !== undefined ? String(point.latitude) : "");
    setLng(point?.longitude !== null && point?.longitude !== undefined ? String(point.longitude) : "");
    setRadius(point?.radiusM ? String(point.radiusM) : "");
    setRequirePhoto(point?.requirePhoto ?? true);
    setIsActive(point?.isActive ?? true);
  }, [open, point]);

  const usarUbicacion = async () => {
    setLocating(true);
    const r = await getBrowserLocation();
    setLocating(false);
    if ("error" in r) {
      toast({ title: "No se pudo obtener la ubicación", description: LOCATION_ERROR_MESSAGES[r.error], variant: "destructive" });
      return;
    }
    const pos = r.pos;
    setLat(pos.coords.latitude.toFixed(6));
    setLng(pos.coords.longitude.toFixed(6));
    if (!radius) setRadius(String(Math.max(100, Math.round(pos.coords.accuracy * 2))));
  };

  // La marca se valida por GPS: sin ubicación y radio el punto no sirve.
  const faltan = [
    !name.trim() && "Nombre",
    (lat.trim() === "" || lng.trim() === "") && "Ubicación (latitud y longitud)",
    !(Number(radius) > 0) && "Radio en metros",
  ].filter(Boolean) as string[];

  const guardar = async () => {
    if (faltan.length > 0) return;
    const ok = await onSave({
      id: point?.id ?? null,
      name: name.trim(),
      latitude: numOrNull(lat),
      longitude: numOrNull(lng),
      radiusM: numOrNull(radius),
      requirePhoto,
      isActive,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{point ? "Editar punto de marcación" : "Nuevo punto de marcación"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pt-name" required>
              Nombre
            </Label>
            <Input id="pt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Planta Ate" />
          </div>
          <div className="grid grid-cols-[1fr_1fr_120px] items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pt-lat" required>
                Latitud
              </Label>
              <Input id="pt-lat" type="number" step="0.000001" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-lng" required>
                Longitud
              </Label>
              <Input id="pt-lng" type="number" step="0.000001" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-radius" required>
                Radio (m)
              </Label>
              <Input id="pt-radius" type="number" min="1" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => void usarUbicacion()} disabled={locating}>
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            Usar mi ubicación actual
          </Button>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="pt-photo">Foto obligatoria al marcar</Label>
            <Switch id="pt-photo" checked={requirePhoto} onCheckedChange={setRequirePhoto} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="pt-active">Activo</Label>
            <Switch id="pt-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="gap-2"
            onClick={() => void guardar()}
            disabled={saving || faltan.length > 0}
            title={faltan.length > 0 ? `Falta: ${faltan.join(", ")}` : undefined}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
