import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatDateDisplay } from "@/shared/utils/date";
import HolidaysHeader from "../components/holidays/HolidaysHeader";
import { HolidaysTable } from "../components/holidays/HolidaysTable";
import { HolidayFormDialog } from "../components/holidays/HolidayFormDialog";
import { HolidayPayDialog } from "../components/holidays/HolidayPayDialog";
import { HolidayRulesStrip } from "../components/holidays/HolidayRulesStrip";
import { useHolidays } from "../hooks/useHolidays";
import { useClientPagination } from "../hooks/useClientPagination";
import { Holiday } from "../types/attendance.types";

/**
 * Asistencia › Feriados (attendance_holidays.list): cada empresa crea sus
 * feriados (nacionales, regionales, aniversario...). En el Cuadre de horas un
 * feriado no cuenta como falta ni tardanza, y la hora trabajada se paga con el
 * aumento de «Pago en feriado». Arriba se dice eso en una frase; la tabla los
 * muestra todos por fecha, cada uno con su estado (Hoy / Próximo / Pasado).
 */
const HolidaysPage = () => {
  const h = useHolidays();
  const page = useClientPagination(h.items);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const copia = h.copyOffer;

  const abrir = (holiday: Holiday | null) => {
    setEditing(holiday);
    setFormOpen(true);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <HolidaysHeader onCreate={() => abrir(null)} />

      <HolidayRulesStrip settings={h.settings} onChangePay={() => setPayOpen(true)} />

      {copia && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
          <span>
            {copia.to} todavía no tiene feriados. Copia los {copia.count} de {copia.from} con la misma fecha y corrige
            los que cambian (como Semana Santa).
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={h.saving}
            onClick={() => void h.copyYear(copia.from, copia.to)}
          >
            {h.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copiar a {copia.to}
          </Button>
        </div>
      )}

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <HolidaysTable
            items={page.pageItems}
            loading={h.loading}
            today={h.today}
            emptyLabel="Sin feriados: agrega los que da tu empresa"
            onEdit={abrir}
            onDelete={setDeleting}
          />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={page.pagination}
            onPageChange={page.onPageChange}
            onPageSizeChange={page.onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        holiday={editing}
        saving={h.saving}
        onSave={h.save}
      />

      <HolidayPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        settings={h.settings}
        saving={h.saving}
        onSave={h.saveSettings}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el feriado?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleting?.name}» del {deleting ? formatDateDisplay(deleting.day) : ""}. Ese día volverá a
              contar como un día normal: con faltas, tardanzas y pago sin aumento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={h.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={h.saving}
              onClick={() => {
                if (deleting) void h.remove(deleting).then(() => setDeleting(null));
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

export default HolidaysPage;
