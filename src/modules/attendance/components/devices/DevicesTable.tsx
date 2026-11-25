import { SquarePen, Trash, Unplug, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date";
import { AttendanceDevice } from "../../types/attendance.types";
import { Dash, EmptyRow, LoadingRow } from "../TableStates";

interface DevicesTableProps {
  items: AttendanceDevice[];
  loading: boolean;
  saving: boolean;
  onDetail: (device: AttendanceDevice) => void;
  onEdit: (device: AttendanceDevice) => void;
  onRevoke: (device: AttendanceDevice) => void;
  onDelete: (device: AttendanceDevice) => void;
}

/** Equipos de marcación: kioscos y relojes de huella, activos primero. */
export const DevicesTable = ({ items, loading, saving, onDetail, onEdit, onRevoke, onDelete }: DevicesTableProps) => {
  const colSpan = 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Equipo</TableHead>
          <TableHead>Punto</TableHead>
          <TableHead>Último uso</TableHead>
          <TableHead>Trabajadores</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[140px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Cargando equipos..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label="Habilita un equipo para que tus trabajadores marquen ahí" />
        ) : (
          items.map((dev) => {
            const reloj = dev.kind === "CLOCK";
            const activo = !dev.revokedAt;
            return (
              <TableRow key={dev.id}>
                <TableCell>
                  <div className="font-medium">{dev.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {reloj
                      ? `Reloj de huella · N.° de serie ${dev.serialNumber ?? ""}`
                      : `Kiosco${dev.createdBy ? ` · habilitado por ${dev.createdBy}` : ""}`}
                  </div>
                </TableCell>
                <TableCell>
                  {reloj ? dev.pointName ?? <Dash /> : <span className="text-muted-foreground">Por ubicación</span>}
                </TableCell>
                <TableCell className="tabular-nums">{dev.lastUsedAt ? formatDateTime(dev.lastUsedAt) : <Dash />}</TableCell>
                <TableCell className="tabular-nums">
                  {reloj ? (
                    <div className="space-y-0.5">
                      <div>{dev.usersSynced} cargados</div>
                      {(dev.usersPending > 0 || dev.usersError > 0) && (
                        <div className="text-xs text-muted-foreground">
                          {[
                            dev.usersPending > 0 && `${dev.usersPending} pendientes`,
                            dev.usersError > 0 && `${dev.usersError} con error`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Todos</span>
                  )}
                </TableCell>
                <TableCell>
                  {!activo ? (
                    <Badge variant="pending">Desactivado</Badge>
                  ) : reloj ? (
                    <Badge variant={dev.online ? "success" : "warning"}>{dev.online ? "En línea" : "Sin conexión"}</Badge>
                  ) : (
                    <Badge variant="success">Activo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {activo && reloj && (
                      <>
                        <Button variant="outline" size="sm" title="Trabajadores y eventos del reloj" onClick={() => onDetail(dev)}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Editar reloj" onClick={() => onEdit(dev)}>
                          <SquarePen className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {activo && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Desactivar: deja de marcar, sigue en la lista"
                        disabled={saving}
                        onClick={() => onRevoke(dev)}
                      >
                        <Unplug className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      title="Eliminar este equipo"
                      disabled={saving}
                      onClick={() => onDelete(dev)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
