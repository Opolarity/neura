import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinKioskApi, kioskPunchApi, resolveKioskApi } from "../services/attendance.service";
import { KioskInfo, PunchResult } from "../types/attendance.types";
import {
  getBrowserLocation,
  kioskDeviceName,
  LOCATION_ERROR_MESSAGES,
  LocationError,
  readKioskSecret,
  saveKioskSecret,
} from "../utils/format";

/**
 * Estado de la ubicación del equipo (el lugar de la marca lo decide el GPS).
 * Solo "denied" impide marcar; "error" es que aún no llegó una posición (sin
 * señal o tardó), y al marcar se vuelve a pedir.
 */
export type KioskLocation =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error"; reason: Exclude<LocationError, "denied"> }
  | { status: "ok"; accuracy: number; at: number };

/** Una posición del seguimiento sirve para marcar si tiene menos de 2 minutos. */
const FRESH_MS = 120_000;

const fallo = (message: string): PunchResult => ({
  ok: false,
  message,
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

/**
 * Kiosco público /asistencia (uno por empresa). Abre solo en un equipo
 * activado desde el ERP: el secreto del equipo está en este navegador. `info`
 * es undefined mientras carga y null si el equipo no está activado.
 *
 * El lugar no lo dice el link: en cada marca se manda la ubicación del equipo
 * y el servidor busca el punto de marcación que la acepta.
 *
 * @param linkToken el token del link del kiosco (/asistencia/<token>): si este
 *   equipo no está activado, se activa solo con él y la URL queda en
 *   /asistencia (el token no queda a la vista).
 */
export const useKiosk = (linkToken?: string) => {
  const navigate = useNavigate();
  const [secret, setSecret] = useState(() => readKioskSecret());
  const [info, setInfo] = useState<KioskInfo | null | undefined>(undefined);
  /** Por qué el link no activó el equipo (anulado o falso). */
  const [joinError, setJoinError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<KioskLocation>({ status: "loading" });
  /** La última posición que dio el equipo, con la hora en que llegó. */
  const lastPos = useRef<{ pos: GeolocationPosition; at: number } | null>(null);
  /** Cambia para volver a empezar el seguimiento («Reintentar»). */
  const [watchKey, setWatchKey] = useState(0);

  const guardar = (pos: GeolocationPosition) => {
    const at = Date.now();
    lastPos.current = { pos, at };
    setLocation({ status: "ok", accuracy: pos.coords.accuracy, at });
  };

  useEffect(() => {
    let vigente = true;
    void (async () => {
      let actual = secret ? await resolveKioskApi(secret) : null;
      if (!actual && linkToken) {
        const r = await joinKioskApi(linkToken, kioskDeviceName());
        if ("deviceSecret" in r) {
          saveKioskSecret(r.deviceSecret);
          actual = await resolveKioskApi(r.deviceSecret);
          if (vigente) setSecret(r.deviceSecret);
        } else if (vigente) {
          setJoinError(r.error);
        }
      }
      if (!vigente) return;
      setInfo(actual);
      if (linkToken) navigate("/asistencia", { replace: true });
    })();
    return () => {
      vigente = false;
    };
    // Solo al abrir: el secreto nuevo del link ya viene resuelto aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se sigue la ubicación mientras el kiosco está abierto. Sin timeout: un
  // equipo quieto no manda posiciones nuevas, y eso no es falta de permiso.
  useEffect(() => {
    if (!info) return;
    if (!("geolocation" in navigator)) {
      setLocation({ status: "error", reason: "unavailable" });
      return;
    }
    const id = navigator.geolocation.watchPosition(
      guardar,
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setLocation({ status: "denied" });
        // Sin señal o tardó: si ya hubo una posición, se queda con esa.
        else if (!lastPos.current)
          setLocation({ status: "error", reason: e.code === e.TIMEOUT ? "timeout" : "unavailable" });
      },
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [info, watchKey]);

  /** «Reintentar»: vuelve a pedir la ubicación y a seguirla. */
  const retryLocation = async () => {
    setLocation({ status: "loading" });
    const r = await getBrowserLocation();
    if ("pos" in r) guardar(r.pos);
    else setLocation(r.error === "denied" ? { status: "denied" } : { status: "error", reason: r.error });
    setWatchKey((k) => k + 1);
  };

  const punch = async (identifier: string, pin: string, photo: string | null): Promise<PunchResult> => {
    setSending(true);
    try {
      // La del seguimiento si es reciente; si no, se pide una.
      let pos = lastPos.current && Date.now() - lastPos.current.at < FRESH_MS ? lastPos.current.pos : null;
      if (!pos) {
        const r = await getBrowserLocation();
        if ("error" in r) {
          if (r.error === "denied") setLocation({ status: "denied" });
          return fallo(LOCATION_ERROR_MESSAGES[r.error]);
        }
        guardar(r.pos);
        pos = r.pos;
      }
      return await kioskPunchApi({
        deviceSecret: secret ?? "",
        identifier: identifier.trim(),
        pin,
        photo,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        clientUuid: crypto.randomUUID(),
      });
    } catch (error) {
      return fallo(error instanceof Error ? error.message : "No se pudo marcar");
    } finally {
      setSending(false);
    }
  };

  return { info, joinError, sending, location, punch, retryLocation };
};
