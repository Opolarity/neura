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
import DevicesHeader from "../components/devices/DevicesHeader";
import { DevicesTable } from "../components/devices/DevicesTable";
import { EnableDeviceDialog } from "../components/devices/EnableDeviceDialog";
import { ClockDetailDialog } from "../components/devices/ClockDetailDialog";
import { ClockFormDialog } from "../components/devices/ClockFormDialog";
import { useDevices, usePoints } from "../hooks/useAttendanceConfig";
import { useClientPagination } from "../hooks/useClientPagination";
import { AttendanceDevice } from "../types/attendance.types";

/**
 * Equipos de marcación (attendance_devices.list): aparatos fijos donde se
 * permite marcar. Kiosco = tablet o computadora con el kiosco web (marca quien
 * esté en el radio de un punto); reloj de huella = ZKTeco por ADMS, fijo en un
 * punto, con los trabajadores que se le asignan en su ficha. El celular de cada
 * trabajador no es un equipo: lo deciden sus puntos de marcación.
 */
const DevicesPage = () => {
  const d = useDevices(true);
  const p = usePoints();
  const page = useClientPagination(d.items);
  const [enableOpen, setEnableOpen] = useState(false);
  const [detail, setDetail] = useState<AttendanceDevice | null>(null);
  const [editing, setEditing] = useState<AttendanceDevice | null>(null);
  const [revoking, setRevoking] = useState<AttendanceDevice | null>(null);
  const [deleting, setDeleting] = useState<AttendanceDevice | null>(null);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <DevicesHeader onEnable={() => setEnableOpen(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <DevicesTable
            items={page.pageItems}
            loading={d.loading}
            saving={d.saving}
            onDetail={setDetail}
            onEdit={setEditing}
            onRevoke={setRevoking}
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

      <EnableDeviceDialog
        open={enableOpen}
        onOpenChange={(o) => {
          setEnableOpen(o);
          if (!o) void d.reload();
        }}
        points={p.items}
        saving={d.saving}
        onActivateKiosk={d.activate}
        onSaveClock={d.saveClock}
      />

      <ClockDetailDialog
        deviceId={detail?.id ?? null}
        onOpenChange={(o) => {
          if (!o) {
            setDetail(null);
            void d.reload();
          }
        }}
      />

      <ClockFormDialog
        device={editing}
        points={p.items}
        saving={d.saving}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={d.saveClock}
      />

      <AlertDialog open={revoking !== null} onOpenChange={(o) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar el equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              {revoking?.kind === "CLOCK"
                ? `«${revoking?.name}» deja de marcar: el servidor ya no acepta sus marcas. Para volver a usarlo hay que habilitarlo otra vez.`
                : `«${revoking?.name}» deja de marcar. Para volver a usarlo hay que habilitarlo otra vez desde ese equipo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={d.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={d.saving}
              onClick={() => {
                if (revoking) void d.revoke(revoking).then(() => setRevoking(null));
              }}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.name}» deja de marcar y sale de la lista. Las marcas que ya hizo se conservan.
              {deleting?.kind === "CLOCK" && " Sus trabajadores asignados se le quitan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={d.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={d.saving}
              onClick={() => {
                if (deleting) void d.remove(deleting).then(() => setDeleting(null));
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

export default DevicesPage;
