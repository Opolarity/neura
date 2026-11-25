import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Fingerprint, Loader2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import { getClockDetailApi } from "../../services/attendance.service";
import { AttendancePoint, ClockPayload, KioskActivation } from "../../types/attendance.types";
import { saveKioskSecret } from "../../utils/format";
import { KioskLinkPanel } from "../kiosk/KioskLinkPanel";
import { PointSelect } from "./PointSelect";

type Step = "type" | "kiosk" | "clock" | "connect";

interface EnableDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: AttendancePoint[];
  saving: boolean;
  onActivateKiosk: (name: string) => Promise<KioskActivation | null>;
  onSaveClock: (payload: ClockPayload) => Promise<number | null>;
}

/** Servidor que se escribe en el reloj: el del backend de este entorno. */
const clockServer = () => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL as string).host;
  } catch {
    return "";
  }
};

/**
 * «Habilitar equipo», por pasos: se elige el tipo (kiosco o reloj de huella),
 * se completan sus datos y, en un reloj, se muestra cómo configurarlo y se
 * espera a que se conecte.
 */
export const EnableDeviceDialog = ({
  open,
  onOpenChange,
  points,
  saving,
  onActivateKiosk,
  onSaveClock,
}: EnableDeviceDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("type");
  const [kioskName, setKioskName] = useState("");
  const [clockName, setClockName] = useState("");
  const [serial, setSerial] = useState("");
  const [pointId, setPointId] = useState("");
  const [clockId, setClockId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setKioskName("");
    setClockName("");
    setSerial("");
    setPointId("");
    setClockId(null);
    setConnected(false);
  }, [open]);

  // Paso "conectar": se pregunta cada 5 s si el reloj ya llamó.
  useEffect(() => {
    if (step !== "connect" || clockId === null || connected) return;
    let vigente = true;
    const revisar = () =>
      getClockDetailApi(clockId)
        .then((d) => vigente && d.online && setConnected(true))
        .catch(() => undefined);
    void revisar();
    const t = window.setInterval(() => void revisar(), 5000);
    return () => {
      vigente = false;
      window.clearInterval(t);
    };
  }, [step, clockId, connected]);

  const habilitarEsteEquipo = async () => {
    const res = await onActivateKiosk(kioskName.trim());
    if (!res) return;
    saveKioskSecret(res.deviceSecret);
    navigate("/asistencia");
  };

  const guardarReloj = async () => {
    const id = await onSaveClock({
      id: null,
      name: clockName.trim(),
      serial: serial.trim().toUpperCase(),
      pointId: Number(pointId),
    });
    if (id) {
      setClockId(id);
      setStep("connect");
    }
  };

  const titulo: Record<Step, string> = {
    type: "Habilitar equipo",
    kiosk: "Habilitar kiosco",
    clock: "Habilitar reloj de huella",
    connect: "Conectar el reloj",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo[step]}</DialogTitle>
          <DialogDescription>
            {step === "type" && "Un equipo es un aparato fijo donde tus trabajadores pueden marcar."}
            {step === "kiosk" && "Una tablet o computadora: marca quien esté dentro del radio de un punto de marcación."}
            {step === "clock" && "Un reloj ZKTeco con «Configuración de la nube» (ADMS). Los trabajadores se le asignan en su ficha."}
            {step === "connect" && "Escribe estos datos en el reloj: se conecta solo y empieza a mandar las marcas."}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeCard
              icon={<MonitorSmartphone className="w-6 h-6" />}
              title="Kiosco"
              description="Tablet o computadora con el kiosco web: DNI, PIN o foto."
              onClick={() => setStep("kiosk")}
            />
            <TypeCard
              icon={<Fingerprint className="w-6 h-6" />}
              title="Reloj de huella"
              description="Reloj ZKTeco conectado por la nube: huella o clave."
              onClick={() => setStep("clock")}
            />
          </div>
        )}

        {step === "kiosk" && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="kiosk-name" required>
                Habilitar este equipo
              </Label>
              <div className="flex gap-3">
                <Input
                  id="kiosk-name"
                  placeholder="Nombre del equipo (ej.: Tablet planta Ate)"
                  value={kioskName}
                  onChange={(e) => setKioskName(e.target.value)}
                />
                <Button className="gap-2 shrink-0" disabled={saving || !kioskName.trim()} onClick={() => void habilitarEsteEquipo()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorSmartphone className="w-4 h-4" />}
                  Habilitar y abrir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">O habilita otro equipo con el link</p>
              <KioskLinkPanel enabled={open && step === "kiosk"} />
            </div>
          </div>
        )}

        {step === "clock" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clock-name" required>
                Nombre
              </Label>
              <Input
                id="clock-name"
                placeholder="Ej.: Reloj planta Ate"
                value={clockName}
                onChange={(e) => setClockName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clock-serial" required>
                Número de serie
              </Label>
              <Input
                id="clock-serial"
                placeholder="Ej.: ACY8201060157"
                value={serial}
                onChange={(e) => setSerial(e.target.value.replace(/\s/g, ""))}
              />
              <p className="text-xs text-muted-foreground">En el reloj: Menú › Sistema › Información del dispositivo.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clock-point" required>
                Punto donde está
              </Label>
              <PointSelect id="clock-point" points={points} value={pointId} onChange={setPointId} />
            </div>
          </div>
        )}

        {step === "connect" && (
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <p className="mb-2 font-medium">En el reloj: Menú › Comunicación › Configuración de la nube</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Dirección del servidor</dt>
                <dd className="font-medium tabular-nums">{clockServer()}</dd>
                <dt className="text-muted-foreground">Puerto</dt>
                <dd className="font-medium tabular-nums">80</dd>
                <dt className="text-muted-foreground">HTTPS / SSL</dt>
                <dd className="font-medium">Apagado</dd>
                <dt className="text-muted-foreground">Proxy</dt>
                <dd className="font-medium">Apagado</dd>
              </dl>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
              {connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Conectado. Asígnale trabajadores desde su ficha (Asistencia y pago › Relojes de huella).
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esperando a que el reloj se conecte…
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {step === "kiosk" || step === "clock" ? (
            <Button variant="outline" className="gap-2" onClick={() => setStep("type")} disabled={saving}>
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>
          ) : (
            <span />
          )}
          {step === "clock" && (
            <Button
              className="gap-2"
              disabled={saving || !clockName.trim() || serial.trim().length < 4 || !pointId}
              onClick={() => void guardarReloj()}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar y conectar
            </Button>
          )}
          {step === "connect" && <Button onClick={() => onOpenChange(false)}>Listo</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TypeCard = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors",
      "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    )}
  >
    {icon}
    <span className="font-semibold">{title}</span>
    <span className="text-sm text-muted-foreground">{description}</span>
  </button>
);
