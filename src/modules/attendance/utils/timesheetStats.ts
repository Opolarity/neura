import { EmployeeKind, PayType, TimesheetEmployee } from "../types/attendance.types";

/**
 * Agrupaciones del Cuadre de horas para los KPIs y las gráficas. Solo suman lo
 * que ya calculó el servidor (sp_get_attendance_timesheet): la tardanza, las
 * faltas y las horas extra las decide el horario de cada persona.
 */

/** Veces que llegó tarde: días con minutos de tardanza. */
/** Lo que se le paga en el rango: el monto de por hora, o el extra por feriado de quien tiene sueldo. */
export const paymentAmount = (e: TimesheetEmployee): number | null =>
  e.payType === "HOURLY" ? e.amount : e.holidayPay ? e.holidayPay : null;

export const lateCount = (e: TimesheetEmployee): number => e.days.filter((d) => d.lateMinutes > 0).length;

/** Situación de «Más filtros»: quién tiene algo pendiente de revisar. */
export type TimesheetSituation = "ABSENT" | "INCOMPLETE" | "LATE";

export interface TimesheetExtraFilters {
  kind: EmployeeKind | null;
  payType: PayType | null;
  situation: TimesheetSituation | null;
}

export const EMPTY_TIMESHEET_FILTERS: TimesheetExtraFilters = { kind: null, payType: null, situation: null };

/**
 * Tipo, Pago y Situación de «Más filtros» sobre lo que ya trajo el servidor
 * (el rango y la búsqueda van al SP). KPIs, gráficas y tabla usan esta lista.
 */
export const filterTimesheet = (employees: TimesheetEmployee[], f: TimesheetExtraFilters): TimesheetEmployee[] =>
  employees.filter(
    (e) =>
      (f.kind === null || e.kind === f.kind) &&
      (f.payType === null || e.payType === f.payType) &&
      (f.situation === null ||
        (f.situation === "ABSENT" && e.absences > 0) ||
        (f.situation === "INCOMPLETE" && e.incompleteDays > 0) ||
        (f.situation === "LATE" && e.lateMinutes > 0)),
  );

export interface TimesheetKpis {
  people: number;
  workedMinutes: number;
  lateCount: number;
  lateMinutes: number;
  absences: number;
  incompleteDays: number;
  overtimeMinutes: number;
  holidaysWorked: number;
  holidayMinutes: number;
  /** Lo que se paga en el rango: por hora (monto) + extra por feriado de quien tiene sueldo. */
  amount: number;
  /** Horas extra (las que pasan su jornada y las del feriado): pagadas y las que van a la bolsa. */
  overtimePaidMinutes: number;
  overtimeBankMinutes: number;
  /** Bolsa de horas: saldo de todos hoy, cuántos tienen saldo, lo que entró y lo usado en el rango. */
  bankBalanceMinutes: number;
  peopleWithBank: number;
  bankEarnedMinutes: number;
  bankUsedMinutes: number;
}

export const timesheetKpis = (employees: TimesheetEmployee[]): TimesheetKpis =>
  employees.reduce<TimesheetKpis>(
    (acc, e) => ({
      people: acc.people + 1,
      workedMinutes: acc.workedMinutes + e.workedMinutes,
      lateCount: acc.lateCount + lateCount(e),
      lateMinutes: acc.lateMinutes + e.lateMinutes,
      absences: acc.absences + e.absences,
      incompleteDays: acc.incompleteDays + e.incompleteDays,
      overtimeMinutes: acc.overtimeMinutes + e.overtimeMinutes,
      holidaysWorked: acc.holidaysWorked + e.holidaysWorked,
      holidayMinutes: acc.holidayMinutes + e.holidayMinutes,
      amount: acc.amount + (e.payType === "HOURLY" ? e.amount : e.holidayPay ?? 0),
      overtimePaidMinutes: acc.overtimePaidMinutes + e.overtimePaidMinutes + e.holidayExtraMinutes,
      overtimeBankMinutes: acc.overtimeBankMinutes + e.bankEarnedMinutes,
      bankBalanceMinutes: acc.bankBalanceMinutes + e.restBalanceMinutes,
      peopleWithBank: acc.peopleWithBank + (e.restBalanceMinutes > 0 ? 1 : 0),
      bankEarnedMinutes: acc.bankEarnedMinutes + e.bankEarnedMinutes,
      bankUsedMinutes: acc.bankUsedMinutes + e.restTakenMinutes,
    }),
    {
      people: 0,
      workedMinutes: 0,
      lateCount: 0,
      lateMinutes: 0,
      absences: 0,
      incompleteDays: 0,
      overtimeMinutes: 0,
      holidaysWorked: 0,
      holidayMinutes: 0,
      amount: 0,
      overtimePaidMinutes: 0,
      overtimeBankMinutes: 0,
      bankBalanceMinutes: 0,
      peopleWithBank: 0,
      bankEarnedMinutes: 0,
      bankUsedMinutes: 0,
    },
  );

export type RankingMetric = "late_count" | "late_minutes" | "absences" | "overtime";

export interface RankingRow {
  id: number;
  name: string;
  code: string;
  value: number;
  lateCount: number;
  lateMinutes: number;
  absences: number;
  workedMinutes: number;
  overtimeMinutes: number;
}

const metricValue = (e: TimesheetEmployee, metric: RankingMetric): number => {
  switch (metric) {
    case "late_count":
      return lateCount(e);
    case "late_minutes":
      return e.lateMinutes;
    case "absences":
      return e.absences;
    case "overtime":
      return e.overtimeMinutes;
  }
};

/** Ranking del personal por la métrica elegida; los que están en 0 no salen. */
export const rankingRows = (employees: TimesheetEmployee[], metric: RankingMetric, limit: number): RankingRow[] =>
  employees
    .map((e) => ({
      id: e.employeeId,
      name: e.name,
      code: e.code,
      value: metricValue(e, metric),
      lateCount: lateCount(e),
      lateMinutes: e.lateMinutes,
      absences: e.absences,
      workedMinutes: e.workedMinutes,
      overtimeMinutes: e.overtimeMinutes,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || b.lateMinutes - a.lateMinutes || a.name.localeCompare(b.name))
    .slice(0, limit);

export interface DayAttendance {
  day: string;
  onTime: number;
  late: number;
  absent: number;
}

/**
 * Por día del rango: cuántas personas llegaron a tiempo, tarde o faltaron.
 * Solo cuentan los días en que la persona tenía horario (un feriado no tiene
 * jornada programada, así que no cuenta).
 */
export const attendanceByDay = (employees: TimesheetEmployee[]): DayAttendance[] => {
  const byDay = new Map<string, DayAttendance>();
  for (const e of employees) {
    for (const d of e.days) {
      if (d.isHoliday || d.scheduledMinutes === null || d.scheduledMinutes <= 0) continue;
      const row = byDay.get(d.day) ?? { day: d.day, onTime: 0, late: 0, absent: 0 };
      if (d.isAbsent) row.absent += 1;
      else if (d.lateMinutes > 0) row.late += 1;
      else if (d.punches > 0) row.onTime += 1;
      byDay.set(d.day, row);
    }
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
};
