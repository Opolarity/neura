import { useRef, useState } from "react";
import { Loader2, LogIn, LogOut, MapPinOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { formatDateLong, formatTime } from "@/shared/utils/date";
import { CameraCapture, CameraCaptureHandle } from "../CameraCapture";
import { LocationLink } from "../LocationLink";
import { useClock } from "../../hooks/useClock";
import { useMyAttendance } from "../../hooks/useMyAttendance";
import { formatMinutes, LOCATION_ERROR_MESSAGES, punchSegments } from "../../utils/format";

type MyAttendance = ReturnType<typeof useMyAttendance>;

/**
 * «Marcar mi asistencia» en el header (permiso attendance.mark_self): un botón
 * que dice lo que toca («Marcar entrada» / «Marcar salida») y abre un panel
 * chico con el botón para marcar, la ubicación y las marcas de hoy. La cámara
 * sale solo si alguno de sus puntos pide foto (Puntos › «Foto obligatoria»).
 * No se muestra si el usuario no tiene la marcación activa en su ficha.
 */
export const MyAttendanceButton = () => {
  const { permissionCodes } = useAuth();
  if (!permissionCodes.includes("attendance.mark_self")) return null;
  return <MyAttendanceButtonInner />;
};

const MyAttendanceButtonInner = () => {
  const [open, setOpen] = useState(false);
  const m = useMyAttendance(open);
  const isMobile = useIsMobile();

  if (m.loading || !m.today?.ok) return null;
  const salida = m.today.nextType === "OUT";
  const label = salida ? "Marcar salida" : "Marcar entrada";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium" aria-label={label} title={label}>
          {salida ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {!isMobile && label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        {/* Se monta solo abierto: la cámara (si se pide) se enciende al abrir y se apaga al cerrar. */}
        {open && <MyAttendancePanel m={m} />}
      </PopoverContent>
    </Popover>
  );
};

const MyAttendancePanel = ({ m }: { m: MyAttendance }) => {
  const camera = useRef<CameraCaptureHandle>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const now = useClock();
  const t = m.today;
  if (!t) return null;

  const salida = t.nextType === "OUT";
  const tramos = punchSegments(t.punches, Date.parse(now));
  const total = tramos.reduce((a, s) => a + (s.minutes ?? 0), 0);

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold tabular-nums leading-none">{formatTime(now)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateLong(now)}</p>
        </div>
        <Badge variant={salida ? "secondary" : "success"}>{salida ? "Toca salida" : "Toca entrada"}</Badge>
      </div>

      {t.requirePhoto && <CameraCapture ref={camera} onReadyChange={setCameraReady} className="w-full" />}

      <Button
        className="w-full gap-2"
        onClick={() => void m.punch(t.requirePhoto ? camera.current?.capture() ?? null : null)}
        disabled={m.sending || (t.requirePhoto && !cameraReady) || m.waiting}
      >
        {m.sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : salida ? (
          <LogOut className="w-4 h-4" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        {salida ? "Marcar salida" : "Marcar entrada"}
      </Button>
      {m.waiting && t.nextAt && (
        <p className="text-center text-xs text-muted-foreground" role="status">
          Acabas de marcar: podrás marcar tu {salida ? "salida" : "entrada"} desde las {formatTime(t.nextAt)}.
        </p>
      )}

      <div className="space-y-1 text-xs" role="status">
        {m.location.status === "ok" ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground">Tu ubicación:</span>
            <LocationLink latitude={m.location.latitude} longitude={m.location.longitude} accuracyM={m.location.accuracy} />
          </div>
        ) : m.location.status === "error" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <MapPinOff className="w-3.5 h-3.5 shrink-0" />
              {LOCATION_ERROR_MESSAGES[m.location.reason]}
            </span>
            <Button variant="outline" size="sm" className="h-7" onClick={() => void m.locate()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Buscando tu ubicación...
          </span>
        )}
        <p className="text-muted-foreground">
          {t.remote ? "Sin punto: puedes marcar desde cualquier lugar" : `Debes estar en: ${t.points.join(", ")}`}
        </p>
      </div>

      <div className="border-t pt-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Hoy</span>
          {total > 0 && <span className="tabular-nums text-muted-foreground">{formatMinutes(total)}</span>}
        </div>
        {tramos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no marcas hoy.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {tramos.map((s, i) => {
              const abierto = s.in !== null && s.out === null && i === tramos.length - 1;
              return (
                <li key={s.in?.id ?? s.out?.id ?? i} className="flex items-center justify-between gap-2 tabular-nums">
                  <span>
                    {s.in ? formatTime(s.in.punchedAt) : "—"} → {s.out ? formatTime(s.out.punchedAt) : "—"}
                  </span>
                  {abierto ? (
                    <Badge variant="success">En curso · {formatMinutes(s.minutes)}</Badge>
                  ) : s.minutes !== null ? (
                    <span className="text-xs text-muted-foreground">{formatMinutes(s.minutes)}</span>
                  ) : (
                    <Badge variant="warning">{s.in ? "Sin salida" : "Sin entrada"}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
