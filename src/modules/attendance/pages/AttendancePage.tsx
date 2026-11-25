import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatDateTime } from "@/shared/utils/date";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import AttendanceHeader from "../components/AttendanceHeader";
import { AttendanceFilterBar } from "../components/AttendanceFilterBar";
import { AttendanceFilterModal } from "../components/AttendanceFilterModal";
import { PunchesTable } from "../components/punches/PunchesTable";
import { PunchFormDialog } from "../components/punches/PunchFormDialog";
import { useAttendancePunches } from "../hooks/useAttendancePunches";
import { getPointsApi } from "../services/attendance.service";
import { AttendancePoint, Punch } from "../types/attendance.types";

const TODOS = "all";

/**
 * Asistencia › Marcas (attendance.list): las marcas con su foto, lugar (punto
 * o sin punto, con su ubicación) y método, por fechas, persona y punto. Con
 * attendance.manage el supervisor registra, corrige o elimina marcas.
 */
const AttendancePage = () => {
  const { permissionCodes } = useAuth();
  const canManage = permissionCodes.includes("attendance.manage");
  const p = useAttendancePunches();
  const [filterOpen, setFilterOpen] = useState(false);
  /** Borrador del «Lugar» del popup; se aplica con las fechas. */
  const [draftPointId, setDraftPointId] = useState<number | null>(null);
  const [points, setPoints] = useState<AttendancePoint[]>([]);
  const [editing, setEditing] = useState<Punch | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Punch | null>(null);

  useEffect(() => {
    void getPointsApi().then(setPoints).catch(() => undefined);
  }, []);

  const conFechas = p.filters.dateFrom !== null && p.filters.dateTo !== null;
  const activos = (conFechas ? 1 : 0) + (p.filters.pointId !== null ? 1 : 0);

  const abrir = (punch: Punch | null) => {
    setEditing(punch);
    setFormOpen(true);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <AttendanceHeader
        canManage={canManage}
        onCreate={() => abrir(null)}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <AttendanceFilterBar
            search={p.filters.search}
            onSearch={(search) => p.changeFilters({ search })}
            placeholder="Buscar por nombre, código o DNI..."
            onOpenFilters={() => {
              setDraftPointId(p.filters.pointId);
              setFilterOpen(true);
            }}
            hasActiveFilters={activos > 0}
            onExport={() => void p.exportar()}
            exporting={p.exporting}
            exportDisabled={p.pagination.total === 0}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <PunchesTable
            items={p.items}
            loading={p.loading}
            canManage={canManage}
            onEdit={abrir}
            onDelete={setDeleting}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar pagination={p.pagination} onPageChange={p.onPageChange} onPageSizeChange={p.onPageSizeChange} />
        </CardFooter>
      </Card>

      <AttendanceFilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filtrar marcas"
        range={{ dateFrom: p.filters.dateFrom, dateTo: p.filters.dateTo }}
        defaultRange={{ dateFrom: null, dateTo: null }}
        allowEmpty
        maxRangeDays={92}
        activeCount={activos}
        onClearExtra={() => setDraftPointId(null)}
        onApply={(r) => p.changeFilters({ dateFrom: r.dateFrom, dateTo: r.dateTo, pointId: draftPointId })}
      >
        <div className="space-y-2">
          <Label htmlFor="punches-point">Lugar</Label>
          <Select
            value={draftPointId ? String(draftPointId) : TODOS}
            onValueChange={(v) => setDraftPointId(v === TODOS ? null : Number(v))}
          >
            <SelectTrigger id="punches-point">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los lugares</SelectItem>
              {points.map((pt) => (
                <SelectItem key={pt.id} value={String(pt.id)}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AttendanceFilterModal>

      {canManage && (
        <PunchFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          punch={editing}
          points={points}
          saving={p.saving}
          onSave={p.save}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la marca?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.punchType === "IN" ? "Entrada" : "Salida"} de ${deleting.name} del ${formatDateTime(deleting.punchedAt)}. Queda registrado en la auditoría.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={p.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={p.saving}
              onClick={() => {
                if (deleting) void p.remove(deleting).then(() => setDeleting(null));
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

export default AttendancePage;
