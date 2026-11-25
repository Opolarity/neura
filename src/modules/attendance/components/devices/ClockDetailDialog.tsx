import { useState } from "react";
import { Link2, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/shared/utils/date";
import { useClockDetail } from "../../hooks/useAttendanceConfig";
import {
  CLOCK_EVENT_LABELS,
  CLOCK_SYNC_LABELS,
  CLOCK_SYNC_VARIANTS,
  ClockFoundUser,
  EmployeeOption,
} from "../../types/attendance.types";
import { Dash, EmptyRow, LoadingRow } from "../TableStates";
import { EmployeePicker } from "../punches/EmployeePicker";

interface ClockDetailDialogProps {
  /** Reloj a mostrar; null = cerrado. */
  deviceId: number | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Un reloj de huella: quiénes están cargados y en qué estado (se asignan en la
 * ficha de cada trabajador), los usuarios que el reloj ya tenía y todavía no
 * son de nadie (se emparejan con su ficha y conservan su huella), y los últimos
 * eventos (marcas rechazadas, cambios que el reloj no aceptó).
 */
export const ClockDetailDialog = ({ deviceId, onOpenChange }: ClockDetailDialogProps) => {
  const c = useClockDetail(deviceId);
  const detail = c.detail;

  return (
    <Dialog open={deviceId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {detail?.name ?? "Reloj de huella"}
            {detail && (
              <Badge variant={detail.online ? "success" : "warning"}>{detail.online ? "En línea" : "Sin conexión"}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {detail?.serialNumber ? `N.° de serie ${detail.serialNumber}. ` : ""}
            {detail?.lastUsedAt ? `Última conexión: ${formatDateTime(detail.lastUsedAt)}.` : "Todavía no se conecta."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="employees" className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="employees">Trabajadores ({detail?.employees.length ?? 0})</TabsTrigger>
            <TabsTrigger value="found">Ya estaban en el reloj ({detail?.found.length ?? 0})</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Se agregan o quitan desde la ficha de cada trabajador (Operarios o Usuarios › Asistencia y pago).
            </p>
            <div className="overflow-hidden rounded-md border">
              <Table containerClassName="max-h-[45vh]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>N.° en el reloj</TableHead>
                    <TableHead>Huella</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.loading && !detail ? (
                    <LoadingRow colSpan={5} label="Cargando trabajadores..." />
                  ) : !detail || detail.employees.length === 0 ? (
                    <EmptyRow colSpan={5} label="Nadie cargado en este reloj todavía" />
                  ) : (
                    detail.employees.map((e) => (
                      <TableRow key={e.employeeId}>
                        <TableCell>
                          <div className="font-medium">{e.name}</div>
                          {e.code && <div className="text-xs text-muted-foreground">{e.code}</div>}
                        </TableCell>
                        <TableCell className="tabular-nums">{e.clockUserId ?? <Dash />}</TableCell>
                        <TableCell>{e.hasFingerprint ? "Registrada" : <span className="text-muted-foreground">Falta</span>}</TableCell>
                        <TableCell>{e.hasPassword ? "PIN" : <span className="text-muted-foreground">Sin clave</span>}</TableCell>
                        <TableCell>
                          <Badge variant={CLOCK_SYNC_VARIANTS[e.syncStatus]}>{CLOCK_SYNC_LABELS[e.syncStatus]}</Badge>
                          {e.syncError && <div className="mt-1 text-xs text-muted-foreground">{e.syncError}</div>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="found" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Usuarios que el reloj ya tenía. Emparéjalos con su ficha para no volver a registrar su huella.
              </p>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" disabled={c.saving} onClick={() => void c.refreshUsers()}>
                <RefreshCw className="w-4 h-4" />
                Volver a leer
              </Button>
            </div>
            <div className="overflow-hidden rounded-md border">
              <Table containerClassName="max-h-[45vh]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">N.° en el reloj</TableHead>
                    <TableHead>Nombre en el reloj</TableHead>
                    <TableHead>Trabajador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.loading && !detail ? (
                    <LoadingRow colSpan={3} label="Cargando usuarios..." />
                  ) : !detail || detail.found.length === 0 ? (
                    <EmptyRow
                      colSpan={3}
                      label={
                        detail?.usersQueriedAt
                          ? "No quedan usuarios del reloj sin emparejar"
                          : "El reloj mandará sus usuarios cuando se conecte"
                      }
                    />
                  ) : (
                    detail.found.map((u) => (
                      <FoundUserRow key={u.pin} user={u} saving={c.saving} onLink={c.link} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="overflow-hidden rounded-md border">
              <Table containerClassName="max-h-[45vh]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Fecha</TableHead>
                    <TableHead>Qué pasó</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!detail || detail.events.length === 0 ? (
                    <EmptyRow colSpan={3} label="Sin eventos" />
                  ) : (
                    detail.events.map((e, i) => (
                      <TableRow key={`${e.at}-${i}`}>
                        <TableCell className="tabular-nums">{formatDateTime(e.at)}</TableCell>
                        <TableCell>{CLOCK_EVENT_LABELS[e.kind] ?? e.kind}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[e.pin && `N.° ${e.pin}`, e.time && formatDateTime(e.time), e.detail].filter(Boolean).join(" · ") || <Dash />}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const FoundUserRow = ({
  user,
  saving,
  onLink,
}: {
  user: ClockFoundUser;
  saving: boolean;
  onLink: (clockUserId: string, employeeId: number) => Promise<boolean>;
}) => {
  const [employee, setEmployee] = useState<EmployeeOption | null>(null);
  return (
    <TableRow>
      <TableCell className="tabular-nums">{user.pin}</TableCell>
      <TableCell>{user.name || <Dash />}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <EmployeePicker value={employee} onChange={setEmployee} />
          </div>
          <Button
            size="sm"
            className="gap-2"
            disabled={saving || !employee}
            onClick={() => employee && void onLink(user.pin, employee.accountId)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Emparejar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
