/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AttendancePoint,
  AttendanceSettings,
  HolidayYear,
  EmployeeOption,
  EmployeeRecord,
  HourlySettlement,
  AttendanceDevice,
  CLOCK_OPLOG_LABELS,
  ClockDetail,
  ClockSyncStatus,
  Punch,
  MyAttendanceToday,
  PunchResult,
  RestBalance,
  Schedule,
  Timesheet,
  TimesheetDay,
} from "../types/attendance.types";

const n = (v: unknown): number => Number(v ?? 0);
const nOrNull = (v: unknown): number | null => (v === undefined || v === null || v === "" ? null : Number(v));
const sOrNull = (v: unknown): string | null => (v === undefined || v === null || v === "" ? null : String(v));

export const adaptPunch = (p: any): Punch => ({
  id: n(p.id),
  employeeId: n(p.employee_id),
  code: String(p.code ?? ""),
  name: String(p.name ?? p.code ?? ""),
  documentNumber: sOrNull(p.document_number),
  punchedAt: String(p.punched_at),
  punchType: p.punch_type === "OUT" ? "OUT" : "IN",
  method: p.method,
  pointId: nOrNull(p.point_id),
  pointName: sOrNull(p.point_name),
  photoPath: sOrNull(p.photo_path),
  latitude: nOrNull(p.latitude),
  longitude: nOrNull(p.longitude),
  accuracyM: nOrNull(p.accuracy_m),
  note: sOrNull(p.note),
  createdBy: sOrNull(p.created_by),
});

const adaptDay = (d: any): TimesheetDay => ({
  day: String(d.day),
  firstIn: sOrNull(d.first_in),
  lastOut: sOrNull(d.last_out),
  segments: (Array.isArray(d.segments) ? d.segments : []).map((s: any) => ({
    in: sOrNull(s?.in),
    out: sOrNull(s?.out),
    minutes: nOrNull(s?.minutes),
    rate: nOrNull(s?.rate),
  })),
  punches: n(d.punches),
  workedMinutes: n(d.worked_minutes),
  breakMinutes: n(d.break_minutes),
  scheduledMinutes: nOrNull(d.scheduled_minutes),
  lateMinutes: n(d.late_minutes),
  overtimeMinutes: n(d.overtime_minutes),
  isAbsent: d.is_absent === true,
  isIncomplete: d.is_incomplete === true,
  isHoliday: d.is_holiday === true,
  holidayName: sOrNull(d.holiday_name),
  holidayMinutes: n(d.holiday_minutes),
  compensation: d.compensation === "REST" ? "REST" : d.compensation === "PAY" ? "PAY" : null,
  overtimeCompensation:
    d.overtime_compensation === "BANK" ? "BANK" : d.overtime_compensation === "PAY" ? "PAY" : null,
  restId: nOrNull(d.rest_id),
  restMinutes: n(d.rest_minutes),
  restFullDay: d.rest_full_day === true,
  restNote: sOrNull(d.rest_note),
  hourlyRate: nOrNull(d.hourly_rate),
  amount: n(d.amount),
});

export const adaptTimesheet = (raw: any): Timesheet => ({
  dateFrom: String(raw?.date_from ?? ""),
  dateTo: String(raw?.date_to ?? ""),
  employees: (raw?.employees ?? []).map((e: any) => ({
    employeeId: n(e.employee_id),
    code: String(e.code ?? ""),
    name: String(e.name ?? e.code ?? ""),
    kind: e.kind === "OPE" ? "OPE" : "COL",
    payType: e.pay_type,
    hourlyRate: nOrNull(e.hourly_rate),
    monthlySalary: nOrNull(e.monthly_salary),
    scheduleName: sOrNull(e.schedule_name),
    daysWorked: n(e.days_worked),
    workedMinutes: n(e.worked_minutes),
    lateMinutes: n(e.late_minutes),
    overtimeMinutes: n(e.overtime_minutes),
    absences: n(e.absences),
    incompleteDays: n(e.incomplete_days),
    holidaysWorked: n(e.holidays_worked),
    holidayMinutes: n(e.holiday_minutes),
    hourValue: nOrNull(e.hour_value),
    holidayPay: nOrNull(e.holiday_pay),
    holidayExtraMinutes: n(e.holiday_extra_minutes),
    restEarnedMinutes: n(e.rest_earned_minutes),
    restTakenMinutes: n(e.rest_taken_minutes),
    restBalanceMinutes: n(e.rest_balance_minutes),
    overtimePaidMinutes: n(e.overtime_paid_minutes),
    overtimeBankMinutes: n(e.overtime_bank_minutes),
    bankEarnedMinutes: n(e.bank_earned_minutes),
    amount: n(e.amount),
    days: (e.days ?? []).map(adaptDay),
  })),
});

export const adaptEmployeeRecord = (e: any): EmployeeRecord => ({
  accountId: n(e.account_id),
  name: String(e.name ?? ""),
  documentNumber: sOrNull(e.document_number),
  isWorker: e.is_worker === true,
  kind: e.kind === "OPE" ? "OPE" : e.kind === "COL" ? "COL" : null,
  hasRecord: e.has_record === true,
  code: sOrNull(e.code),
  payType: sOrNull(e.pay_type) as EmployeeRecord["payType"],
  hourlyCost: nOrNull(e.hourly_cost),
  monthlySalary: nOrNull(e.monthly_salary),
  scheduleId: nOrNull(e.schedule_id),
  tracksAttendance: e.tracks_attendance === true,
  hasPin: e.has_pin === true,
  pointIds: (Array.isArray(e.point_ids) ? e.point_ids : []).map(n),
  deviceIds: (Array.isArray(e.device_ids) ? e.device_ids : []).map(n),
  devices: (Array.isArray(e.devices) ? e.devices : []).map((d: any) => ({
    deviceId: n(d.device_id),
    syncStatus: syncStatus(d.sync_status),
    syncError: sOrNull(d.sync_error),
  })),
  clockUserId: sOrNull(e.clock_user_id),
  hasFingerprint: e.has_fingerprint === true,
  hasClockPassword: e.has_clock_password === true,
});

const syncStatus = (v: unknown): ClockSyncStatus =>
  v === "SYNCED" || v === "PENDING_DELETE" || v === "ERROR" ? v : "PENDING_ADD";

export const adaptEmployeeOption = (e: any): EmployeeOption => ({
  accountId: n(e.account_id),
  code: sOrNull(e.code),
  name: String(e.name ?? e.code ?? ""),
  documentNumber: sOrNull(e.document_number),
  kind: e.kind === "OPE" ? "OPE" : "COL",
});

export const adaptSchedule = (s: any): Schedule => ({
  id: n(s.id),
  name: String(s.name ?? ""),
  toleranceMinutes: n(s.tolerance_minutes),
  isActive: s.is_active !== false,
  employees: n(s.employees),
  days: (s.days ?? []).map((d: any) => ({
    weekday: n(d.weekday),
    startTime: String(d.start_time ?? ""),
    endTime: String(d.end_time ?? ""),
    breakMinutes: n(d.break_minutes),
  })),
});

export const adaptPoint = (p: any): AttendancePoint => ({
  id: n(p.id),
  name: String(p.name ?? ""),
  latitude: nOrNull(p.latitude),
  longitude: nOrNull(p.longitude),
  radiusM: nOrNull(p.radius_m),
  requirePhoto: p.require_photo !== false,
  isActive: p.is_active !== false,
  lastUsedAt: sOrNull(p.last_used_at),
});

export const adaptPunchResult = (r: any): PunchResult => ({
  ok: r?.ok === true,
  message: sOrNull(r?.message),
  duplicate: r?.duplicate === true,
  punchType: r?.punch_type === "OUT" ? "OUT" : r?.punch_type === "IN" ? "IN" : null,
  punchedAt: sOrNull(r?.punched_at),
  employeeName: sOrNull(r?.employee_name),
  employeeCode: sOrNull(r?.employee_code),
  pointName: sOrNull(r?.point_name),
  nextType: r?.next_type === "OUT" ? "OUT" : r?.next_type === "IN" ? "IN" : null,
  nextAt: sOrNull(r?.next_at),
  pinRequired: r?.pin_required === true,
});

export const adaptMyAttendanceToday = (r: any): MyAttendanceToday => ({
  ok: r?.ok === true,
  message: sOrNull(r?.message),
  nextType: r?.next_type === "OUT" ? "OUT" : "IN",
  nextAt: sOrNull(r?.next_at),
  remote: r?.remote === true,
  points: Array.isArray(r?.points) ? r.points.map(String) : [],
  requirePhoto: r?.require_photo === true,
  punches: (Array.isArray(r?.punches) ? r.punches : []).map((p: any) => ({
    id: n(p.id),
    punchType: p.punch_type === "OUT" ? "OUT" : "IN",
    punchedAt: String(p.punched_at ?? ""),
    pointName: sOrNull(p.point_name),
    remote: p.remote === true,
    latitude: nOrNull(p.latitude),
    longitude: nOrNull(p.longitude),
    accuracyM: nOrNull(p.accuracy_m),
  })),
});

export const adaptHourlySettlement = (raw: any): HourlySettlement => ({
  dateFrom: String(raw?.date_from ?? ""),
  dateTo: String(raw?.date_to ?? ""),
  employees: (raw?.employees ?? []).map((e: any) => ({
    employeeId: n(e.employee_id),
    code: String(e.code ?? ""),
    name: String(e.name ?? e.code ?? ""),
    payType: e.pay_type,
    hourlyRate: nOrNull(e.hourly_rate),
    workedMinutes: n(e.worked_minutes),
    amount: n(e.amount),
    pending: n(e.pending),
    paid: n(e.paid),
    totalPending: n(e.total_pending),
    credit: n(e.credit),
    payments: (e.payments ?? []).map((p: any) => ({
      movementId: n(p.movement_id),
      amount: n(p.amount),
      date: sOrNull(p.date),
      paymentMethod: sOrNull(p.payment_method),
      voucherUrl: sOrNull(p.voucher_url),
    })),
  })),
  totals: {
    workedMinutes: n(raw?.totals?.worked_minutes),
    amount: n(raw?.totals?.amount),
    paid: n(raw?.totals?.paid),
    pending: n(raw?.totals?.pending),
    totalPending: n(raw?.totals?.total_pending),
  },
});

export const adaptDevice = (d: any): AttendanceDevice => ({
  id: n(d.id),
  kind: d.kind === "CLOCK" ? "CLOCK" : "KIOSK",
  name: String(d.name ?? ""),
  createdAt: String(d.created_at ?? ""),
  createdBy: sOrNull(d.created_by),
  lastUsedAt: sOrNull(d.last_used_at),
  revokedAt: sOrNull(d.revoked_at),
  serialNumber: sOrNull(d.serial_number),
  pointId: nOrNull(d.point_id),
  pointName: sOrNull(d.point_name),
  lastIp: sOrNull(d.last_ip),
  firmware: sOrNull(d.firmware),
  online: d.online === true,
  usersSynced: n(d.users_synced),
  usersPending: n(d.users_pending),
  usersError: n(d.users_error),
});

export const adaptClockDetail = (d: any): ClockDetail => ({
  id: n(d?.id),
  name: String(d?.name ?? ""),
  serialNumber: sOrNull(d?.serial_number),
  online: d?.online === true,
  lastUsedAt: sOrNull(d?.last_used_at),
  usersQueriedAt: sOrNull(d?.users_queried_at),
  employees: (Array.isArray(d?.employees) ? d.employees : []).map((e: any) => ({
    employeeId: n(e.employee_id),
    name: String(e.name ?? ""),
    code: sOrNull(e.code),
    clockUserId: sOrNull(e.clock_user_id),
    syncStatus: syncStatus(e.sync_status),
    syncError: sOrNull(e.sync_error),
    syncedAt: sOrNull(e.synced_at),
    hasFingerprint: e.has_fingerprint === true,
    hasPassword: e.has_password === true,
  })),
  found: (Array.isArray(d?.found) ? d.found : []).map((f: any) => ({
    pin: String(f.pin ?? ""),
    name: String(f.name ?? ""),
    seenAt: sOrNull(f.seen_at),
  })),
  events: (Array.isArray(d?.events) ? d.events : []).map((e: any) => ({
    at: String(e.at ?? ""),
    kind: String(e.kind ?? ""),
    pin: sOrNull(e.pin),
    time: sOrNull(e.time),
    detail:
      [
        e.code != null ? CLOCK_OPLOG_LABELS[String(e.code)] ?? `operación ${e.code}` : null,
        e.verify != null ? `verify ${e.verify}` : null,
        e.op ? `${e.op}` : null,
        e.return != null ? `código ${e.return}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
  })),
});

export const adaptHolidayYear = (r: any): HolidayYear => ({
  year: n(r?.year),
  holidays: (Array.isArray(r?.holidays) ? r.holidays : []).map((h: any) => ({
    id: n(h.id),
    day: String(h.day ?? ""),
    name: String(h.name ?? ""),
  })),
  previousYearCount: n(r?.previous_year_count),
});

export const adaptAttendanceSettings = (r: any): AttendanceSettings => ({
  holidayPayMultiplier: r?.holiday_pay_multiplier === undefined || r?.holiday_pay_multiplier === null ? 2 : n(r.holiday_pay_multiplier),
  holidayPayFrom: sOrNull(r?.holiday_pay_from),
  holidayDefaultCompensation: r?.holiday_default_compensation === "REST" ? "REST" : "PAY",
  overtimeDefaultCompensation: r?.overtime_default_compensation === "BANK" ? "BANK" : "PAY",
});

export const adaptRestBalance = (r: any): RestBalance => ({
  earnedMinutes: n(r?.earned_minutes),
  takenMinutes: n(r?.taken_minutes),
  balanceMinutes: n(r?.balance_minutes),
  rests: (Array.isArray(r?.rests) ? r.rests : []).map((x: any) => ({
    id: n(x.id),
    day: String(x.day ?? ""),
    minutes: n(x.minutes),
    isFullDay: x.is_full_day === true,
    note: sOrNull(x.note),
  })),
});
