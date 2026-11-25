import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { limaDateTimeLocalToIso } from "@/shared/utils/date";
import {
  adaptEmployeeOption,
  adaptDevice,
  adaptClockDetail,
  adaptEmployeeRecord,
  adaptPoint,
  adaptPunch,
  adaptMyAttendanceToday,
  adaptPunchResult,
  adaptSchedule,
  adaptTimesheet,
  adaptAttendanceSettings,
  adaptRestBalance,
  adaptHolidayYear,
} from "../adapters/attendance.adapter";
import {
  AttendancePoint,
  EmployeeOption,
  EmployeePayload,
  EmployeeRecord,
  EmployeeRecordValue,
  KioskActivation,
  AttendanceDevice,
  ClockDetail,
  ClockPayload,
  KioskInfo,
  KioskLink,
  MyAttendanceToday,
  PointPayload,
  Punch,
  PunchFilters,
  PunchPayload,
  PunchResult,
  Schedule,
  SchedulePayload,
  Timesheet,
  AttendanceSettings,
  AttendanceSettingsPatch,
  HolidayCompensation,
  OvertimeCompensation,
  RestBalance,
  RestPayload,
  HolidayYear,
} from "../types/attendance.types";

/**
 * Acceso a datos del módulo Asistencia. Todo el ERP pasa por la edge
 * `attendance` ({ action, params }); el kiosco público por `attendance-kiosk`.
 * El usuario lo pone el JWT, nunca este archivo.
 */
const call = async (action: string, params: Record<string, unknown> = {}) => {
  const res = await invokeFunction("attendance", { body: { action, params } });
  return res?.data;
};

export const getPunchesApi = async (
  filters: PunchFilters,
  page: number,
  size: number,
): Promise<{ total: number; items: Punch[] }> => {
  const data = await call("punches", {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    search: filters.search.trim() || null,
    point_id: filters.pointId,
    page,
    size,
  });
  return { total: Number(data?.total ?? 0), items: (data?.data ?? []).map(adaptPunch) };
};

export const savePunchApi = async (p: PunchPayload): Promise<void> => {
  await call("save_punch", {
    id: p.id,
    employee_id: p.employeeId,
    // Instante con offset de Lima: el SP lo pasa por fn_lima_ts.
    punched_at: limaDateTimeLocalToIso(p.punchedAt),
    punch_type: p.punchType,
    point_id: p.pointId,
    note: p.note,
  });
};

export const deletePunchApi = async (id: number): Promise<void> => {
  await call("delete_punch", { id });
};

export const getTimesheetApi = async (
  dateFrom: string,
  dateTo: string,
  search: string | null,
): Promise<Timesheet> => adaptTimesheet(await call("timesheet", { date_from: dateFrom, date_to: dateTo, search }));

/** La ficha laboral de una cuenta (para Usuarios y Operarios). */
export const getEmployeeRecordApi = async (accountId: number): Promise<EmployeeRecord> =>
  adaptEmployeeRecord(await call("employee", { account_id: accountId }));

/** Trabajadores que coinciden con el texto (máximo 20). */
export const getEmployeeOptionsApi = async (search: string): Promise<EmployeeOption[]> =>
  ((await call("employee_options", { search: search.trim() || null })) ?? []).map(adaptEmployeeOption);

export const saveEmployeeApi = async (p: EmployeePayload): Promise<void> => {
  await call("save_employee", {
    account_id: p.accountId,
    pay_type: p.payType,
    hourly_cost: p.hourlyCost,
    monthly_salary: p.monthlySalary,
    schedule_id: p.scheduleId,
    tracks_attendance: p.tracksAttendance,
    point_ids: p.pointIds,
    device_ids: p.deviceIds,
  });
};

export const setPinApi = async (accountId: number, pin: string): Promise<void> => {
  await call("set_pin", { account_id: accountId, pin });
};

/**
 * Guarda la sección "Asistencia y pago" de un trabajador: la ficha y, si se
 * escribió, el PIN nuevo. `hourlyCost` es la tarifa cuando el pago es por hora
 * (en Operarios sale de su "Costo por hora").
 */
export const saveEmployeeRecordApi = async (
  accountId: number,
  value: EmployeeRecordValue,
  hourlyCost: number | null,
): Promise<void> => {
  await saveEmployeeApi({
    accountId,
    payType: value.payType,
    hourlyCost,
    monthlySalary: value.monthlySalary.trim() === "" ? null : Number(value.monthlySalary),
    scheduleId: value.scheduleId,
    tracksAttendance: value.tracksAttendance,
    pointIds: value.pointIds,
    deviceIds: value.tracksAttendance ? value.deviceIds : [],
  });
  if (value.tracksAttendance && value.pin) await setPinApi(accountId, value.pin);
  else if (value.removePin) await setPinApi(accountId, "");
};

export const getSchedulesApi = async (): Promise<Schedule[]> => ((await call("schedules")) ?? []).map(adaptSchedule);

export const saveScheduleApi = async (s: SchedulePayload): Promise<void> => {
  await call("save_schedule", {
    id: s.id,
    name: s.name,
    tolerance_minutes: s.toleranceMinutes,
    is_active: s.isActive,
    days: s.days.map((d) => ({
      weekday: d.weekday,
      start_time: d.startTime,
      end_time: d.endTime,
      break_minutes: d.breakMinutes,
    })),
  });
};

export const deleteScheduleApi = async (id: number): Promise<void> => {
  await call("delete_schedule", { id });
};

export const getPointsApi = async (): Promise<AttendancePoint[]> => ((await call("points")) ?? []).map(adaptPoint);

export const savePointApi = async (p: PointPayload): Promise<void> => {
  await call("save_point", {
    id: p.id,
    name: p.name,
    // Sin dirección ni IPs permitidas: ya no se usan.
    address: null,
    latitude: p.latitude,
    longitude: p.longitude,
    radius_m: p.radiusM,
    allowed_ips: [],
    require_photo: p.requirePhoto,
    is_active: p.isActive,
  });
};

/** Equipos de marcación: kioscos (link único /asistencia) y relojes de huella. */
export const getDevicesApi = async (): Promise<AttendanceDevice[]> =>
  ((await call("devices")) ?? []).map(adaptDevice);

/** Activa ESTE equipo como kiosco: devuelve su secreto, que solo guarda este navegador. */
export const activateKioskApi = async (name: string): Promise<KioskActivation> => {
  const data = await call("kiosk_activate", { name });
  return { deviceId: Number(data?.device_id ?? 0), deviceSecret: String(data?.device_secret ?? "") };
};

export const revokeDeviceApi = async (deviceId: number): Promise<void> => {
  await call("device_revoke", { device_id: deviceId });
};

/** Elimina el equipo: deja de marcar y sale del listado (sus marcas se conservan). */
export const deleteDeviceApi = async (deviceId: number): Promise<void> => {
  await call("device_delete", { device_id: deviceId });
};

/** Registra o edita un reloj de huella (número de serie y punto donde está): devuelve su id. */
export const saveClockApi = async (c: ClockPayload): Promise<number> => {
  const data = await call("clock_save", { id: c.id, name: c.name, serial: c.serial, point_id: c.pointId });
  return Number(data?.device_id ?? 0);
};

/** Trabajadores del reloj, usuarios que ya tenía sin emparejar y eventos. */
export const getClockDetailApi = async (deviceId: number): Promise<ClockDetail> =>
  adaptClockDetail(await call("clock_detail", { device_id: deviceId }));

/** Empareja un usuario que el reloj ya tenía con la ficha de un trabajador. */
export const linkClockUserApi = async (deviceId: number, clockUserId: string, employeeId: number): Promise<void> => {
  await call("clock_link_user", { device_id: deviceId, clock_user_id: clockUserId, employee_id: employeeId });
};

/** El reloj vuelve a mandar sus usuarios en su siguiente latido. */
export const refreshClockUsersApi = async (deviceId: number): Promise<void> => {
  await call("clock_refresh_users", { device_id: deviceId });
};

/** El link del kiosco de la empresa (se crea la primera vez). */
export const getKioskLinkApi = async (): Promise<KioskLink> => {
  const data = await call("kiosk_link");
  return { token: String(data?.token ?? ""), createdAt: String(data?.created_at ?? "") };
};

/** Otro link: el anterior deja de activar equipos (los ya activados siguen). */
export const regenerateKioskLinkApi = async (): Promise<KioskLink> => {
  const data = await call("kiosk_link_regenerate");
  return { token: String(data?.token ?? ""), createdAt: String(data?.created_at ?? "") };
};

/** "Marcar mi asistencia": lo que toca marcar y las marcas de hoy. */
export const getMyAttendanceTodayApi = async (): Promise<MyAttendanceToday> =>
  adaptMyAttendanceToday(await call("my_today"));

export const punchSelfApi = async (payload: {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  photo: string | null;
  clientUuid: string;
}): Promise<PunchResult> =>
  adaptPunchResult(
    await call("punch_self", {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      photo: payload.photo,
      client_uuid: payload.clientUuid,
    }),
  );

/** URL temporal de una foto del bucket privado (la política deja verlas a quien ve las marcas). */
export const getPhotoUrlApi = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage.from("attendance").createSignedUrl(path, 60 * 30);
  if (error) return null;
  return data?.signedUrl ?? null;
};

// ---------------------------------------------------------------- Kiosco ----

/** null = el equipo no está activado (o el kiosco se revocó). */
export const resolveKioskApi = async (device: string): Promise<KioskInfo | null> => {
  try {
    const data = await invokeFunction(`attendance-kiosk?device=${encodeURIComponent(device)}`, { method: "GET" });
    if (!data?.ok) return null;
    return {
      deviceName: String(data.device_name ?? ""),
      tenantName: data.tenant_name ?? null,
      requirePhoto: data.require_photo !== false,
    };
  } catch {
    return null;
  }
};

/**
 * Link del kiosco: activa ESTE equipo (sin sesión) y devuelve su secreto, o
 * el mensaje de por qué no (link anulado o falso).
 */
export const joinKioskApi = async (
  token: string,
  name: string,
): Promise<{ deviceSecret: string } | { error: string }> => {
  try {
    const data = await invokeFunction("attendance-kiosk", { method: "POST", body: { action: "join", token, name } });
    if (data?.ok && typeof data.device_secret === "string") return { deviceSecret: data.device_secret };
    return { error: String(data?.message ?? "Este link del kiosco no es válido") };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Este link del kiosco no es válido" };
  }
};

export const kioskPunchApi = async (payload: {
  deviceSecret: string;
  identifier: string;
  pin: string;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  clientUuid: string;
}): Promise<PunchResult> => {
  const data = await invokeFunction("attendance-kiosk", {
    method: "POST",
    body: {
      device_secret: payload.deviceSecret,
      identifier: payload.identifier,
      pin: payload.pin,
      photo: payload.photo,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      client_uuid: payload.clientUuid,
    },
  });
  return adaptPunchResult(data);
};

// ------------------------------------------------------------- Feriados ----

/** Todos los feriados de la empresa (sin año) o los de un año. */
export const getHolidaysApi = async (year: number | null = null): Promise<HolidayYear> =>
  adaptHolidayYear(await call("holidays", { year }));

export const saveHolidayApi = async (h: { id: number | null; day: string; name: string }): Promise<void> => {
  await call("holiday_save", { id: h.id, day: h.day, name: h.name });
};

export const deleteHolidayApi = async (id: number): Promise<void> => {
  await call("holiday_delete", { id });
};

export const copyHolidaysApi = async (fromYear: number, toYear: number): Promise<number> =>
  Number((await call("holidays_copy", { from_year: fromYear, to_year: toYear }))?.copied ?? 0);

export const getAttendanceSettingsApi = async (): Promise<AttendanceSettings> =>
  adaptAttendanceSettings(await call("settings"));

/** Guarda los ajustes de pago; lo que no se manda no se toca. */
export const saveAttendanceSettingsApi = async (p: AttendanceSettingsPatch): Promise<AttendanceSettings> =>
  adaptAttendanceSettings(
    await call("settings_save", {
      holiday_pay_multiplier: p.holidayPayMultiplier ?? null,
      holiday_default_compensation: p.holidayDefaultCompensation ?? null,
      overtime_default_compensation: p.overtimeDefaultCompensation ?? null,
    }),
  );

/**
 * Tiempo extra de un día, para ese caso: un feriado trabajado o las horas extra
 * de un día normal se pagan (PAY) o van a la bolsa de horas (REST/BANK).
 */
export const setDayCompensationApi = async (
  employeeId: number,
  day: string,
  compensation: HolidayCompensation | OvertimeCompensation,
): Promise<void> => {
  await call("set_holiday_compensation", { employee_id: employeeId, day, compensation });
};

/** Registrar o editar un descanso (día completo o unas horas). */
export const saveRestApi = async (r: RestPayload): Promise<void> => {
  await call("save_rest", {
    id: r.id,
    employee_id: r.employeeId,
    day: r.day,
    full_day: r.fullDay,
    minutes: r.fullDay ? null : r.minutes,
    note: r.note,
  });
};

export const deleteRestApi = async (id: number): Promise<void> => {
  await call("delete_rest", { id });
};

/** Saldo de descanso de un trabajador (feriados con descanso − descansos tomados). */
export const getRestBalanceApi = async (employeeId: number): Promise<RestBalance> =>
  adaptRestBalance(await call("rest_balance", { employee_id: employeeId }));
