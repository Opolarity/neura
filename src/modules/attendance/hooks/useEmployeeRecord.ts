import { useEffect, useState } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  getDevicesApi,
  getEmployeeRecordApi,
  getPointsApi,
  getRestBalanceApi,
  getSchedulesApi,
} from "../services/attendance.service";
import {
  AttendanceDevice,
  AttendancePoint,
  EmployeeKind,
  EmployeeRecord,
  EmployeeRecordValue,
  RestBalance,
  Schedule,
} from "../types/attendance.types";

const PIN_RE = /^\d{4,6}$/;

/**
 * Sección "Asistencia y pago" de los formularios de Usuarios y Operarios.
 * Carga la ficha laboral de la cuenta (o parte de valores por defecto si aún
 * no existe) y los horarios. Solo se usa con el permiso attendance.config:
 * sin él, `visible` es false y la sección no se muestra.
 *
 * El tipo de trabajador decide el pago: un operario cobra por destajo o por
 * hora; un colaborador tiene sueldo y también marca con su sesión. El PIN es
 * opcional para todos: quien lo tiene lo ingresa en el kiosco, quien no marca
 * con DNI y foto.
 *
 * @param accountId cuenta a cargar; null = alta nueva (todavía sin cuenta).
 * @param kindHint tipo de trabajador si la ficha aún no lo dice (Operarios →
 *   OPE, Usuarios → COL). Si la cuenta ya tiene ficha, manda la de la base.
 */
export const useEmployeeRecord = (accountId: number | null, kindHint: EmployeeKind) => {
  const { permissionCodes } = useAuth();
  const enabled = permissionCodes.includes("attendance.config");
  const [record, setRecord] = useState<EmployeeRecord | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [points, setPoints] = useState<AttendancePoint[]>([]);
  /** Relojes de huella activos de la empresa (los kioscos no se asignan). */
  const [clocks, setClocks] = useState<AttendanceDevice[]>([]);
  /** Saldo de descanso por feriados trabajados (solo lectura en la ficha). */
  const [restBalance, setRestBalance] = useState<RestBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const kind: EmployeeKind = record?.kind ?? kindHint;
  const defaultPayType = kind === "OPE" ? "PIECE" : "SALARY";
  const [value, setValue] = useState<EmployeeRecordValue>({
    payType: defaultPayType,
    monthlySalary: "",
    scheduleId: null,
    tracksAttendance: false,
    pointIds: [],
    deviceIds: [],
    pin: "",
    removePin: false,
  });

  useEffect(() => {
    if (!enabled) return;
    let vigente = true;
    setLoading(true);
    void Promise.all([
      accountId ? getEmployeeRecordApi(accountId) : Promise.resolve(null),
      getSchedulesApi(),
      getPointsApi(),
      getDevicesApi().catch(() => [] as AttendanceDevice[]),
      accountId ? getRestBalanceApi(accountId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([r, s, pts, devs, bal]) => {
        if (!vigente) return;
        setRecord(r);
        setRestBalance(bal);
        setSchedules(s);
        setPoints(pts);
        setClocks(devs.filter((d) => d.kind === "CLOCK" && !d.revokedAt));
        const k = r?.kind ?? kindHint;
        setValue({
          payType: r?.payType ?? (k === "OPE" ? "PIECE" : "SALARY"),
          monthlySalary: r?.monthlySalary != null ? String(r.monthlySalary) : "",
          scheduleId: r?.scheduleId ?? null,
          tracksAttendance: r?.tracksAttendance ?? false,
          pointIds: r?.pointIds ?? [],
          deviceIds: r?.deviceIds ?? [],
          pin: "",
          removePin: false,
        });
      })
      .catch(console.error)
      .finally(() => vigente && setLoading(false));
    return () => {
      vigente = false;
    };
  }, [enabled, accountId, kindHint]);

  /** Lo que falta para poder guardar, con las etiquetas de pantalla. */
  const missing = (hourlyCost: number | null): string[] =>
    [
      kind === "OPE" &&
        value.payType === "HOURLY" &&
        !((hourlyCost ?? record?.hourlyCost ?? 0) > 0) &&
        "Tarifa por hora",
      value.pin !== "" && !PIN_RE.test(value.pin) && "PIN de 4 a 6 números",
      kind === "COL" &&
        value.monthlySalary.trim() !== "" &&
        !(Number(value.monthlySalary) >= 0) &&
        "Sueldo mensual válido",
    ].filter(Boolean) as string[];

  return {
    /** false = sin permiso o la cuenta no es colaborador/operario: no se muestra. */
    visible: enabled && (accountId === null || record?.isWorker === true),
    loading,
    record,
    schedules,
    points,
    clocks,
    restBalance,
    value,
    setValue: (patch: Partial<EmployeeRecordValue>) => setValue((v) => ({ ...v, ...patch })),
    missing,
    kind,
  };
};

export type EmployeeRecordState = ReturnType<typeof useEmployeeRecord>;
