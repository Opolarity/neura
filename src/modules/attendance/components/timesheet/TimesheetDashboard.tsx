import { KpiCard } from "@/modules/reports/components/shared/KpiCard";
import { formatCurrency } from "@/shared/utils/currency";
import { TimesheetEmployee } from "../../types/attendance.types";
import { formatMinutes } from "../../utils/format";
import { timesheetKpis } from "../../utils/timesheetStats";
import { TimesheetDailyChart } from "./TimesheetDailyChart";
import { TimesheetRankingChart } from "./TimesheetRankingChart";

interface Props {
  employees: TimesheetEmployee[];
  loading: boolean;
}

/**
 * KPIs y gráficas del Cuadre de horas (rango y filtros aplicados): horas,
 * monto a pagar, horas extra (pagadas / a la bolsa), feriados, bolsa de horas,
 * tardanzas y faltas. Todo sale de sp_get_attendance_timesheet.
 */
export function TimesheetDashboard({ employees, loading }: Props) {
  const k = timesheetKpis(employees);
  const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString("es-PE")} ${n === 1 ? uno : varios}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Horas trabajadas"
          value={formatMinutes(k.workedMinutes)}
          loading={loading}
          subtitle={plural(k.people, "persona", "personas")}
        />
        <KpiCard title="Monto a pagar" value={formatCurrency(k.amount)} loading={loading} subtitle="por hora y extra por feriado" />
        <KpiCard
          title="Horas extra"
          value={formatMinutes(k.overtimePaidMinutes + k.overtimeBankMinutes)}
          loading={loading}
          subtitle={`${formatMinutes(k.overtimePaidMinutes)} pagadas · ${formatMinutes(k.overtimeBankMinutes)} a la bolsa (con feriados)`}
        />
        <KpiCard
          title="Feriados trabajados"
          value={k.holidaysWorked.toLocaleString("es-PE")}
          loading={loading}
          subtitle={`${formatMinutes(k.holidayMinutes)} en feriado`}
        />
        <KpiCard
          title="Bolsa de horas"
          value={formatMinutes(k.bankBalanceMinutes)}
          loading={loading}
          subtitle={`${plural(k.peopleWithBank, "persona con saldo", "personas con saldo")}`}
        />
        <KpiCard
          title="Horas usadas de la bolsa"
          value={formatMinutes(k.bankUsedMinutes)}
          loading={loading}
          subtitle={`entraron ${formatMinutes(k.bankEarnedMinutes)} en el rango`}
        />
        <KpiCard
          title="Tardanzas"
          value={k.lateCount.toLocaleString("es-PE")}
          loading={loading}
          subtitle={`${formatMinutes(k.lateMinutes)} en total`}
        />
        <KpiCard
          title="Faltas"
          value={k.absences.toLocaleString("es-PE")}
          loading={loading}
          subtitle={plural(k.incompleteDays, "día incompleto", "días incompletos")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TimesheetRankingChart employees={employees} loading={loading} />
        <TimesheetDailyChart employees={employees} loading={loading} />
      </div>
    </div>
  );
}
