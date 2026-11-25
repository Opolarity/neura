import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  activateKioskApi,
  deleteScheduleApi,
  getClockDetailApi,
  getDevicesApi,
  getKioskLinkApi,
  getPointsApi,
  getSchedulesApi,
  linkClockUserApi,
  refreshClockUsersApi,
  regenerateKioskLinkApi,
  revokeDeviceApi,
  deleteDeviceApi,
  saveClockApi,
  savePointApi,
  saveScheduleApi,
} from "../services/attendance.service";
import {
  AttendanceDevice,
  AttendancePoint,
  ClockDetail,
  ClockPayload,
  KioskActivation,
  KioskLink,
  PointPayload,
  Schedule,
  SchedulePayload,
} from "../types/attendance.types";

const errorText = (error: unknown) => (error instanceof Error ? error.message : undefined);

/** Ejecuta una escritura con su toast de éxito o de error. */
const run = async (fn: () => Promise<void>, ok: string, fail: string): Promise<boolean> => {
  try {
    await fn();
    toast({ title: ok });
    return true;
  } catch (error) {
    toast({ title: fail, description: errorText(error), variant: "destructive" });
    return false;
  }
};

/** Horarios: los usan la ficha de cada trabajador y el cuadre. */
export const useSchedules = () => {
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getSchedulesApi());
    } catch (error) {
      toast({ title: "Error al cargar los horarios", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const wrap = async (fn: () => Promise<void>, ok: string, fail: string) => {
    setSaving(true);
    const done = await run(fn, ok, fail);
    setSaving(false);
    if (done) await load();
    return done;
  };

  return {
    items,
    loading,
    saving,
    save: (p: SchedulePayload) => wrap(() => saveScheduleApi(p), "Horario guardado", "No se pudo guardar el horario"),
    remove: (s: Schedule) => wrap(() => deleteScheduleApi(s.id), "Horario eliminado", "No se pudo eliminar el horario"),
  };
};

/** Puntos de marcación: dónde se puede marcar (ubicación y radio). */
export const usePoints = () => {
  const [items, setItems] = useState<AttendancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getPointsApi());
    } catch (error) {
      toast({ title: "Error al cargar los puntos de marcación", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (p: PointPayload) => {
    setSaving(true);
    const done = await run(() => savePointApi(p), "Punto guardado", "No se pudo guardar el punto");
    setSaving(false);
    if (done) await load();
    return done;
  };

  return { items, loading, saving, save };
};

/**
 * Equipos de marcación: kioscos (uno por empresa, link /asistencia: se activa
 * ESTE equipo) y relojes de huella (se registran con su número de serie). Se
 * desactivan los que ya no deben marcar.
 */
export const useDevices = (enabled: boolean) => {
  const [items, setItems] = useState<AttendanceDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getDevicesApi());
    } catch (error) {
      toast({ title: "Error al cargar los equipos", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  /** Activa ESTE navegador como kiosco: devuelve el secreto del equipo. */
  const activate = async (name: string): Promise<KioskActivation | null> => {
    setSaving(true);
    try {
      return await activateKioskApi(name);
    } catch (error) {
      toast({ title: "No se pudo activar el equipo", description: errorText(error), variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (device: AttendanceDevice) => {
    setSaving(true);
    const done = await run(() => revokeDeviceApi(device.id), "Equipo desactivado", "No se pudo desactivar el equipo");
    setSaving(false);
    if (done) await load();
    return done;
  };

  /** Registra o edita un reloj: devuelve su id, o null si no se pudo. */
  const saveClock = async (c: ClockPayload): Promise<number | null> => {
    setSaving(true);
    let id: number | null = null;
    const done = await run(
      async () => {
        id = await saveClockApi(c);
      },
      "Reloj guardado",
      "No se pudo guardar el reloj",
    );
    setSaving(false);
    if (done) await load();
    return done ? id : null;
  };

  const remove = async (device: AttendanceDevice) => {
    setSaving(true);
    const done = await run(() => deleteDeviceApi(device.id), "Equipo eliminado", "No se pudo eliminar el equipo");
    setSaving(false);
    if (done) await load();
    return done;
  };

  return { items, loading, saving, activate, revoke, remove, saveClock, reload: load };
};

/** Detalle de un reloj: sus trabajadores, los usuarios que ya tenía y sus eventos. */
export const useClockDetail = (deviceId: number | null) => {
  const [detail, setDetail] = useState<ClockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (deviceId === null) return;
    setLoading(true);
    try {
      setDetail(await getClockDetailApi(deviceId));
    } catch (error) {
      toast({ title: "Error al cargar el reloj", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    setDetail(null);
    void load();
  }, [load]);

  const wrap = async (fn: () => Promise<void>, ok: string, fail: string) => {
    setSaving(true);
    const done = await run(fn, ok, fail);
    setSaving(false);
    if (done) await load();
    return done;
  };

  return {
    detail,
    loading,
    saving,
    reload: load,
    link: (clockUserId: string, employeeId: number) =>
      wrap(
        () => linkClockUserApi(deviceId ?? 0, clockUserId, employeeId),
        "Usuario emparejado",
        "No se pudo emparejar el usuario",
      ),
    refreshUsers: () =>
      wrap(
        () => refreshClockUsersApi(deviceId ?? 0),
        "Listo: el reloj mandará sus usuarios en unos segundos",
        "No se pudo pedir los usuarios",
      ),
  };
};

/** El link del kiosco de la empresa: se carga al abrir y se puede regenerar. */
export const useKioskLink = (enabled: boolean) => {
  const [link, setLink] = useState<KioskLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let vigente = true;
    setLoading(true);
    getKioskLinkApi()
      .then((l) => vigente && setLink(l))
      .catch((error) =>
        toast({ title: "Error al cargar el link del kiosco", description: errorText(error), variant: "destructive" }),
      )
      .finally(() => vigente && setLoading(false));
    return () => {
      vigente = false;
    };
  }, [enabled]);

  const regenerate = async () => {
    setSaving(true);
    try {
      setLink(await regenerateKioskLinkApi());
      toast({ title: "Link nuevo generado", description: "El anterior ya no activa equipos" });
      return true;
    } catch (error) {
      toast({ title: "No se pudo generar el link", description: errorText(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { link, loading, saving, regenerate };
};
