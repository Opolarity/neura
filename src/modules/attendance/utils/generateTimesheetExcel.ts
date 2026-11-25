import * as XLSX from "xlsx";
import { formatTime } from "@/shared/utils/date";
import { KIND_LABELS, PAY_TYPE_LABELS, Timesheet } from "../types/attendance.types";
import { minutesToHours } from "./format";

/**
 * Excel del cuadre de horas: «Resumen» (una fila por trabajador) y «Por día»
 * (una fila por trabajador y día, con todos sus tramos entrada-salida, los
 * minutos, tardanza, extra y monto). Las horas van en decimales para poder
 * sumarlas; los minutos, exactos (cada marca cuenta por su minuto).
 */
export function generateTimesheetExcel(data: Timesheet) {
  const resumen = data.employees.map((e) => ({
    Código: e.code,
    Trabajador: e.name,
    Tipo: KIND_LABELS[e.kind],
    Pago: PAY_TYPE_LABELS[e.payType] ?? e.payType,
    Horario: e.scheduleName ?? "",
    "Días trabajados": e.daysWorked,
    Minutos: e.workedMinutes,
    Horas: minutesToHours(e.workedMinutes),
    "Tardanza (min)": e.lateMinutes,
    "Horas extra": minutesToHours(e.overtimeMinutes),
    Faltas: e.absences,
    "Días incompletos": e.incompleteDays,
    "Feriados trabajados": e.holidaysWorked,
    "Horas en feriado": minutesToHours(e.holidayMinutes),
    "Horas extra por feriado": minutesToHours(e.holidayExtraMinutes),
    "Horas extra pagadas": minutesToHours(e.overtimePaidMinutes),
    "Horas extra a la bolsa": minutesToHours(e.overtimeBankMinutes),
    "Entró a la bolsa (h)": minutesToHours(e.bankEarnedMinutes),
    "Usó de la bolsa (h)": minutesToHours(e.restTakenMinutes),
    "Bolsa de horas (h)": minutesToHours(e.restBalanceMinutes),
    "Tarifa/hora": e.hourlyRate ?? "",
    "Sueldo mensual": e.monthlySalary ?? "",
    "Valor hora": e.hourValue ?? "",
    "Pago extra feriado": e.holidayPay ?? "",
    Monto: e.payType === "HOURLY" ? e.amount : "",
  }));

  const porDia = data.employees.flatMap((e) =>
    e.days.map((d) => ({
      Código: e.code,
      Trabajador: e.name,
      Día: d.day,
      Tramos: d.segments
        .map((s) => `${s.in ? formatTime(s.in) : "?"}-${s.out ? formatTime(s.out) : "?"}${s.minutes !== null ? ` (${s.minutes} min)` : ""}`)
        .join(", "),
      Marcas: d.punches,
      Minutos: d.workedMinutes,
      Horas: minutesToHours(d.workedMinutes),
      "Refrigerio (min)": d.breakMinutes,
      "Programado (h)": d.scheduledMinutes !== null ? minutesToHours(d.scheduledMinutes) : "",
      "Tardanza (min)": d.lateMinutes,
      "Horas extra": minutesToHours(d.overtimeMinutes),
      Estado: d.isHoliday
        ? `Feriado${d.holidayName ? `: ${d.holidayName}` : ""}`
        : d.restMinutes > 0
          ? "Usó horas de la bolsa"
          : d.isAbsent
            ? "Falta"
            : d.isIncomplete
              ? "Incompleto"
              : "",
      "Horas en feriado": d.isHoliday ? minutesToHours(d.holidayMinutes) : "",
      "Feriado trabajado": d.compensation === "PAY" ? "Pagar doble" : d.compensation === "REST" ? "A la bolsa" : "",
      "Horas extra: pago o bolsa": d.overtimeCompensation === "PAY" ? "Se pagan" : d.overtimeCompensation === "BANK" ? "A la bolsa" : "",
      "Usó de la bolsa (h)": d.restMinutes > 0 ? minutesToHours(d.restMinutes) : "",
      "Tarifa/hora": d.hourlyRate ?? "",
      Monto: d.hourlyRate !== null ? d.amount : "",
    })),
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porDia), "Por día");
  XLSX.writeFile(wb, `cuadre-horas_${data.dateFrom}_${data.dateTo}.xlsx`);
}
