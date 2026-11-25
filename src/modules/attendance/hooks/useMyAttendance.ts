import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { formatTime } from "@/shared/utils/date";
import { getMyAttendanceTodayApi, punchSelfApi } from "../services/attendance.service";
import { MyAttendanceToday } from "../types/attendance.types";
import { duplicateMessage, getBrowserLocation, LOCATION_ERROR_MESSAGES, LocationError } from "../utils/format";

/** Ubicación que se muestra antes de marcar ("Tu ubicación"). */
export type MyLocation =
  | { status: "loading" }
  | { status: "error"; reason: LocationError }
  | { status: "ok"; latitude: number; longitude: number; accuracy: number; at: number };

/** Una posición de hace menos de 2 minutos sirve para marcar. */
const FRESH_MS = 120_000;

/**
 * "Marcar mi asistencia" (botón del header): las marcas de hoy y lo que toca
 * marcar. El servidor decide entrada o salida (una entrada abierta de menos de
 * 16 h se cierra); aquí solo se muestra para que el botón diga qué se va a
 * marcar.
 *
 * @param active el panel está abierto: recién ahí se pide la ubicación (el
 *   botón vive en el header de todas las pantallas y no debe pedir el GPS en
 *   cada una) y se recargan las marcas.
 */
export const useMyAttendance = (active = true) => {
  const [today, setToday] = useState<MyAttendanceToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [location, setLocation] = useState<MyLocation>({ status: "loading" });
  const lastPos = useRef<GeolocationPosition | null>(null);

  // Se pide al abrir para mostrar "Tu ubicación" antes de marcar.
  const locate = useCallback(async () => {
    setLocation({ status: "loading" });
    const loc = await getBrowserLocation();
    if ("error" in loc) {
      setLocation({ status: "error", reason: loc.error });
      return loc;
    }
    lastPos.current = loc.pos;
    setLocation({
      status: "ok",
      latitude: loc.pos.coords.latitude,
      longitude: loc.pos.coords.longitude,
      accuracy: loc.pos.coords.accuracy,
      at: Date.now(),
    });
    return loc;
  }, []);

  useEffect(() => {
    if (active) void locate();
  }, [active, locate]);

  const load = useCallback(async () => {
    try {
      setToday(await getMyAttendanceTodayApi());
    } catch (error) {
      toast({
        title: "Error al cargar tus marcas",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Al montar (para la etiqueta del botón) y cada vez que se abre el panel.
  useEffect(() => {
    void load();
  }, [load, active]);

  // Doble toque: el botón se habilita solo cuando pasa el minuto.
  const waitUntil = today?.nextAt ? new Date(today.nextAt).getTime() : null;
  useEffect(() => {
    if (!waitUntil || waitUntil <= Date.now()) return;
    const id = window.setTimeout(() => setNow(Date.now()), waitUntil - Date.now() + 250);
    return () => window.clearTimeout(id);
  }, [waitUntil]);
  const waiting = waitUntil !== null && waitUntil > now;

  const punch = async (photo: string | null) => {
    setSending(true);
    try {
      const fresh = lastPos.current && Date.now() - lastPos.current.timestamp < FRESH_MS ? lastPos.current : null;
      const loc = fresh ? { pos: fresh } : await locate();
      if ("error" in loc) {
        toast({ title: "No se registró la marca", description: LOCATION_ERROR_MESSAGES[loc.error], variant: "destructive" });
        return;
      }
      const res = await punchSelfApi({
        latitude: loc.pos.coords.latitude,
        longitude: loc.pos.coords.longitude,
        accuracy: loc.pos.coords.accuracy,
        photo,
        clientUuid: crypto.randomUUID(),
      });
      if (!res.ok) {
        toast({ title: "No se registró la marca", description: res.message ?? undefined, variant: "destructive" });
      } else if (res.duplicate) {
        toast({ title: "Esa marca ya estaba", description: duplicateMessage(res, formatTime) ?? undefined });
      } else {
        toast({
          title: `${res.punchType === "OUT" ? "Salida" : "Entrada"} registrada`,
          description: res.punchedAt
            ? `${formatTime(res.punchedAt)} ${res.pointName ? `en ${res.pointName}` : "sin punto"}`
            : undefined,
        });
      }
      setNow(Date.now());
      await load();
      // Si se usó la posición guardada, se refresca para la próxima marca.
      if (fresh) void locate();
    } catch (error) {
      toast({
        title: "No se registró la marca",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return { today, loading, sending, waiting, punch, location, locate };
};
