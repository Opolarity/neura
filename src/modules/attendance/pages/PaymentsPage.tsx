import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { toast } from "@/shared/hooks/use-toast";
import { getTodayDate } from "@/shared/utils/date";
import PaymentsHeader from "../components/payments/PaymentsHeader";
import { PaymentsFilterBar } from "../components/payments/PaymentsFilterBar";
import { PaymentsFilterModal, PaymentsFilters } from "../components/payments/PaymentsFilterModal";
import { PaymentsTable } from "../components/payments/PaymentsTable";
import { DayChoice, PaymentDetailDialog } from "../components/payments/PaymentDetailDialog";
import { UseBankDialog } from "../components/payments/UseBankDialog";
import { useAttendanceTimesheet } from "../hooks/useAttendanceTimesheet";
import { useClientPagination } from "../hooks/useClientPagination";
import { deleteRestApi, saveRestApi, setDayCompensationApi } from "../services/attendance.service";
import { RestPayload, TimesheetDay, TimesheetEmployee } from "../types/attendance.types";
import { generateTimesheetExcel } from "../utils/generateTimesheetExcel";

const errorText = (error: unknown) => (error instanceof Error ? error.message : undefined);

/** Este mes en Lima: del día 1 a hoy. */
const defaultFilters = (): PaymentsFilters => {
  const hoy = getTodayDate();
  return { startDate: `${hoy.slice(0, 8)}01`, endDate: hoy, payType: null, onlyBank: false };
};

const sameFilters = (a: PaymentsFilters, b: PaymentsFilters) =>
  a.startDate === b.startDate && a.endDate === b.endDate && a.payType === b.payType && a.onlyBank === b.onlyBank;

/**
 * Asistencia › Pagos (attendance_payments.list): lo que se le paga a cada
 * trabajador en el rango y su bolsa de horas. La bolsa junta las horas de
 * feriados con descanso y las horas extra que no se pagan; se usan otro día
 * (descansar, llegar tarde, salir antes) y ese día se pagan. «Editar» en la
 * fila abre el pop-up del trabajador, donde se decide por día si el tiempo
 * extra se paga o va a la bolsa y se usan horas de la bolsa.
 */
const PaymentsPage = () => {
  const defaults = useMemo(defaultFilters, []);
  const [filters, setFilters] = useState<PaymentsFilters>(defaults);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [useFor, setUseFor] = useState<TimesheetEmployee | null>(null);
  const [deletingUse, setDeletingUse] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { permissionCodes } = useAuth();
  const canManage = permissionCodes.includes("attendance.manage");

  const t = useAttendanceTimesheet(filters.startDate, filters.endDate, search);
  const employees = useMemo(
    () =>
      (t.data?.employees ?? []).filter(
        (e) => (filters.payType === null || e.payType === filters.payType) && (!filters.onlyBank || e.restBalanceMinutes > 0),
      ),
    [t.data, filters.payType, filters.onlyBank],
  );
  const page = useClientPagination(employees);
  const detail = useMemo(
    () => (detailId === null ? null : t.data?.employees.find((e) => e.employeeId === detailId) ?? null),
    [t.data, detailId],
  );

  /** Escribe, avisa y recarga. */
  const run = async (fn: () => Promise<void>, ok: string, fail: string) => {
    setSaving(true);
    try {
      await fn();
      toast({ title: ok });
      await t.reload();
      return true;
    } catch (error) {
      toast({ title: fail, description: errorText(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setChoice = (e: TimesheetEmployee, d: TimesheetDay, choice: DayChoice) =>
    void run(
      () => setDayCompensationApi(e.employeeId, d.day, choice === "PAY" ? "PAY" : d.isHoliday ? "REST" : "BANK"),
      choice === "PAY" ? "Se pagarán" : "Pasan a su bolsa de horas",
      "No se pudo cambiar",
    );
  const saveUse = (r: RestPayload) => run(() => saveRestApi(r), "Horas usadas de la bolsa", "No se pudo registrar");

  const exportar = (list: TimesheetEmployee[]) => t.data && generateTimesheetExcel({ ...t.data, employees: list });

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <PaymentsHeader />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <PaymentsFilterBar
            search={search}
            onSearchChange={setSearch}
            onOpenFilters={() => setFiltersOpen(true)}
            hasActiveFilters={!sameFilters(filters, defaults)}
            onExport={() => exportar(employees)}
            exportDisabled={employees.length === 0}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <PaymentsTable items={page.pageItems} loading={t.loading} onEdit={(e) => setDetailId(e.employeeId)} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar pagination={page.pagination} onPageChange={page.onPageChange} onPageSizeChange={page.onPageSizeChange} />
        </CardFooter>
      </Card>

      <PaymentsFilterModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        defaults={defaults}
        onApply={setFilters}
      />

      <PaymentDetailDialog
        detail={detail}
        dateFrom={t.data?.dateFrom ?? filters.startDate}
        dateTo={t.data?.dateTo ?? filters.endDate}
        canManage={canManage}
        saving={saving}
        onClose={() => setDetailId(null)}
        onSetChoice={setChoice}
        onUseBank={setUseFor}
        onDeleteUse={setDeletingUse}
      />

      <UseBankDialog
        employee={useFor ? { id: useFor.employeeId, name: useFor.name, balanceMinutes: useFor.restBalanceMinutes } : null}
        saving={saving}
        onOpenChange={(o) => !o && setUseFor(null)}
        onSave={saveUse}
      />

      <AlertDialog open={deletingUse !== null} onOpenChange={(o) => !o && setDeletingUse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar las horas usadas?</AlertDialogTitle>
            <AlertDialogDescription>
              Vuelven a su bolsa de horas y, si ese día no marcó o llegó tarde, vuelve a contar como falta o tardanza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={() => {
                if (deletingUse !== null)
                  void run(() => deleteRestApi(deletingUse), "Horas devueltas a la bolsa", "No se pudo quitar").then(() =>
                    setDeletingUse(null),
                  );
              }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentsPage;
