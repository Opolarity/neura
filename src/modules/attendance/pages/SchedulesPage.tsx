import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import SchedulesHeader from "../components/schedules/SchedulesHeader";
import { SchedulesTable } from "../components/schedules/SchedulesTable";
import { ScheduleFormDialog } from "../components/schedules/ScheduleFormDialog";
import { useSchedules } from "../hooks/useAttendanceConfig";
import { useClientPagination } from "../hooks/useClientPagination";
import { Schedule } from "../types/attendance.types";

/**
 * Horarios (attendance_schedules.list): opcionales; con horario el cuadre saca
 * tardanza, horas extra y faltas. Se asignan en la ficha de cada trabajador
 * (Usuarios y Operarios).
 */
const SchedulesPage = () => {
  const s = useSchedules();
  const page = useClientPagination(s.items);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Schedule | null>(null);

  const abrir = (schedule: Schedule | null) => {
    setEditing(schedule);
    setFormOpen(true);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SchedulesHeader onCreate={() => abrir(null)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <SchedulesTable items={page.pageItems} loading={s.loading} onEdit={abrir} onDelete={setDeleting} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={page.pagination}
            onPageChange={page.onPageChange}
            onPageSizeChange={page.onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <ScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} schedule={editing} saving={s.saving} onSave={s.save} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el horario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleting?.name}». Si prefieres conservarlo, desactívalo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={s.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={s.saving}
              onClick={() => {
                if (deleting) void s.remove(deleting).then(() => setDeleting(null));
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchedulesPage;
