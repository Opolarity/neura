import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, MapPin, MapPinOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SplashPage from "@/shared/components/splash/SplashPage";
import { cn } from "@/shared/utils/utils";
import { formatTime } from "@/shared/utils/date";
import { CameraCapture, CameraCaptureHandle } from "../components/CameraCapture";
import { useClock } from "../hooks/useClock";
import { useKiosk } from "../hooks/useKiosk";
import { PunchResult } from "../types/attendance.types";
import { duplicateMessage, LOCATION_ERROR_MESSAGES } from "../utils/format";

/**
 * Kiosco de asistencia de la empresa, sin login (/asistencia). Uno solo.
 *
 * Solo abre en equipos activados: con el link del kiosco (/asistencia/<token>,
 * que activa el equipo solo) o desde Asistencia › Puntos de marcación ›
 * Kiosco. El trabajador escribe su DNI (o escanea su fotocheck) y marca; si
 * tiene PIN, el servidor lo pide y aparece el campo (quien no tiene PIN marca
 * con DNI y foto). La foto se toma al marcar y se manda la ubicación del equipo: el servidor busca
 * el punto de marcación que la acepta y decide si es entrada o salida.
 */
const AttendanceKioskPage = () => {
  const { token } = useParams<{ token?: string }>();
  const { info, joinError, sending, location, punch, retryLocation } = useKiosk(token);
  const camera = useRef<CameraCaptureHandle>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  // Paso 2: la persona tiene PIN; el DNI queda fijo y se pide el PIN.
  const [pinStep, setPinStep] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [result, setResult] = useState<PunchResult | null>(null);
  const now = useClock();

  // El resultado se ve unos segundos y el kiosco queda listo para el siguiente.
  useEffect(() => {
    if (!result) return;
    const id = window.setTimeout(() => {
      setResult(null);
      idRef.current?.focus();
    }, result.ok ? 4000 : 6000);
    return () => window.clearTimeout(id);
  }, [result]);

  // Al pasar al paso del PIN, el foco va al campo.
  useEffect(() => {
    if (pinStep) pinRef.current?.focus();
  }, [pinStep, pinError]);

  const volverAlDni = () => {
    setPinStep(false);
    setPinError(null);
    setPin("");
    window.setTimeout(() => idRef.current?.focus(), 0);
  };

  if (info === undefined) return <SplashPage message={token ? "Activando este equipo..." : "Abriendo el kiosco..."} />;

  const marcar = async () => {
    const photo = camera.current?.capture() ?? null;
    if (info?.requirePhoto && !photo) {
      setResult({
        ok: false,
        message: "No se pudo tomar la foto: revisa la cámara",
        duplicate: false,
        punchType: null,
        punchedAt: null,
        employeeName: null,
        employeeCode: null,
        pointName: null,
        nextType: null,
        nextAt: null,
        pinRequired: false,
      });
      return;
    }
    const res = await punch(identifier, pinStep ? pin : "", photo);
    setPin("");
    if (!res.ok && res.pinRequired) {
      // Tiene PIN: se pide (la primera vez sin mensaje de error).
      setPinError(pinStep ? res.message ?? "PIN incorrecto" : null);
      setPinStep(true);
      return;
    }
    setPinStep(false);
    setPinError(null);
    setResult(res);
    if (res.ok) setIdentifier("");
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-lg">
        {info === null ? (
          <CardContent className="space-y-2 p-6 text-center">
            <p className="text-lg font-semibold">Este equipo no es un kiosco</p>
            <p className="text-muted-foreground text-sm">
              {joinError ??
                "Ábrelo con el link del kiosco que te pase el administrador (Asistencia › Puntos de marcación › Kiosco)."}
            </p>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{info.tenantName ?? "Asistencia"}</CardTitle>
              <p className="text-4xl font-bold tabular-nums">{formatTime(now)}</p>
              <p className="text-muted-foreground text-sm">{info.deviceName}</p>
              <p className="flex flex-wrap items-center justify-center gap-1 text-sm" role="status">
                {location.status === "ok" ? (
                  <>
                    <MapPin className="w-4 h-4" />
                    {Date.parse(now) - location.at > 120_000
                      ? `Ubicación sin actualizar (hace ${Math.round((Date.parse(now) - location.at) / 60_000)} min): se pide al marcar`
                      : `Ubicación activa (±${Math.round(location.accuracy)} m)`}
                  </>
                ) : location.status === "denied" || location.status === "error" ? (
                  <>
                    <MapPinOff className="w-4 h-4" />
                    {location.status === "denied"
                      ? LOCATION_ERROR_MESSAGES.denied
                      : `${LOCATION_ERROR_MESSAGES[location.reason]}`}
                    <Button variant="outline" size="sm" className="ml-1" onClick={() => void retryLocation()}>
                      Reintentar
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando ubicación...
                  </>
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {info.requirePhoto && <CameraCapture ref={camera} onReadyChange={setCameraReady} />}

              {result ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center" role="status">
                  {result.ok ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  {result.ok && duplicateMessage(result, formatTime) ? (
                    <>
                      <p className="text-lg font-semibold">{result.employeeName ?? result.employeeCode}</p>
                      <p>{duplicateMessage(result, formatTime)}</p>
                    </>
                  ) : result.ok ? (
                    <>
                      <p className="text-xl font-semibold">
                        {result.punchType === "OUT" ? "Salida" : "Entrada"}{" "}
                        {result.duplicate ? "ya registrada" : "registrada"}
                      </p>
                      <p className="text-lg">{result.employeeName ?? result.employeeCode}</p>
                      {result.pointName && <p className="text-sm">{result.pointName}</p>}
                      {result.punchedAt && (
                        <p className="text-muted-foreground tabular-nums">{formatTime(result.punchedAt)}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-semibold">{result.message ?? "No se pudo marcar"}</p>
                  )}
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void marcar();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="kiosk-id" required>
                      DNI o fotocheck
                    </Label>
                    <Input
                      id="kiosk-id"
                      ref={idRef}
                      autoFocus
                      autoComplete="off"
                      inputMode="text"
                      className="h-12 text-lg"
                      readOnly={pinStep}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Escribe tu DNI o escanea tu fotocheck"
                    />
                  </div>
                  {pinStep ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="kiosk-pin" required>
                          Ingresa tu PIN
                        </Label>
                        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={volverAlDni}>
                          Cambiar DNI
                        </Button>
                      </div>
                      <Input
                        id="kiosk-pin"
                        ref={pinRef}
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={6}
                        className={cn("h-12 text-lg tracking-widest", pinError && "border-destructive")}
                        aria-invalid={pinError ? true : undefined}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      />
                      {pinError && (
                        <p className="text-sm text-destructive" role="alert">
                          {pinError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Si tienes PIN, te lo pedimos al marcar.</p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={
                      sending ||
                      !identifier.trim() ||
                      (pinStep && pin.length < 4) ||
                      location.status === "denied" ||
                      (info.requirePhoto && !cameraReady)
                    }
                  >
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Marcar
                  </Button>
                </form>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AttendanceKioskPage;
