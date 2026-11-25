import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { getTodayDate } from "@/shared/utils/date";
import {
  copyHolidaysApi,
  deleteHolidayApi,
  getAttendanceSettingsApi,
  getHolidaysApi,
  saveAttendanceSettingsApi,
  saveHolidayApi,
} from "../services/attendance.service";
import { AttendanceSettings, Holiday, HolidayCompensation } from "../types/attendance.types";

const errorText = (error: unknown) => (error instanceof Error ? error.message : undefined);

/** Año en curso en Lima. */
export const currentYear = () => Number(getTodayDate().slice(0, 4));

/**
 * Feriados de la empresa (Asistencia › Feriados), todos ordenados por fecha, y
 * el pago en feriado. Cada empresa crea los suyos: no hay lista nacional.
 */
export const useHolidays = () => {
  const [items, setItems] = useState<Holiday[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await getHolidaysApi()).holidays);
    } catch (error) {
      toast({ title: "Error al cargar los feriados", description: errorText(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getAttendanceSettingsApi()
      .then(setSettings)
      .catch((error) =>
        toast({ title: "Error al cargar el pago en feriado", description: errorText(error), variant: "destructive" }),
      );
  }, []);

  const run = async (fn: () => Promise<string>, fail: string) => {
    setSaving(true);
    try {
      toast({ title: await fn() });
      await load();
      return true;
    } catch (error) {
      toast({ title: fail, description: errorText(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Copiar al año siguiente: cuando el año en curso tiene feriados y el
  // siguiente todavía no.
  const year = currentYear();
  const deEsteAnio = items.filter((h) => h.day.startsWith(`${year}-`)).length;
  const delSiguiente = items.filter((h) => h.day.startsWith(`${year + 1}-`)).length;

  const today = getTodayDate();
  const porFecha = useMemo(() => [...items].sort((a, b) => a.day.localeCompare(b.day)), [items]);

  return {
    /** Todos los feriados, por fecha. */
    items: porFecha,
    today,
    settings,
    loading,
    saving,
    copyOffer: !loading && deEsteAnio > 0 && delSiguiente === 0 ? { from: year, to: year + 1, count: deEsteAnio } : null,
    save: (h: { id: number | null; day: string; name: string }) =>
      run(async () => {
        await saveHolidayApi(h);
        return "Feriado guardado";
      }, "No se pudo guardar el feriado"),
    remove: (h: Holiday) =>
      run(async () => {
        await deleteHolidayApi(h.id);
        return "Feriado eliminado";
      }, "No se pudo eliminar el feriado"),
    copyYear: (from: number, to: number) =>
      run(async () => {
        const n = await copyHolidaysApi(from, to);
        return n === 1 ? `Se copió 1 feriado a ${to}` : `Se copiaron ${n} feriados a ${to}`;
      }, "No se pudieron copiar los feriados"),
    saveSettings: async (multiplier: number, compensation: HolidayCompensation) => {
      setSaving(true);
      try {
        setSettings(
          await saveAttendanceSettingsApi({ holidayPayMultiplier: multiplier, holidayDefaultCompensation: compensation }),
        );
        toast({ title: "Pago en feriado guardado" });
        return true;
      } catch (error) {
        toast({ title: "No se pudo guardar el pago en feriado", description: errorText(error), variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
  };
};
