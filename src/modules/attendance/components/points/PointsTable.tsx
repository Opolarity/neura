import { SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date";
import { AttendancePoint } from "../../types/attendance.types";
import { LocationLink } from "../LocationLink";
import { Dash, EmptyRow, LoadingRow } from "../TableStates";

interface PointsTableProps {
  items: AttendancePoint[];
  loading: boolean;
  onEdit: (point: AttendancePoint) => void;
}

export const PointsTable = ({ items, loading, onEdit }: PointsTableProps) => {
  const colSpan = 5;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Punto</TableHead>
          <TableHead>Controles</TableHead>
          <TableHead>Último uso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Cargando puntos..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label="Crea un punto de marcación para empezar a marcar" />
        ) : (
          items.map((pt) => (
            <TableRow key={pt.id}>
              <TableCell>
                <div className="font-medium">{pt.name}</div>
                <LocationLink latitude={pt.latitude} longitude={pt.longitude} className="text-muted-foreground" />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {pt.radiusM ? <Badge variant="outline">Radio {pt.radiusM} m</Badge> : null}
                  {pt.requirePhoto ? <Badge variant="outline">Foto</Badge> : null}
                  {!pt.radiusM && <Badge variant="warning">Sin ubicación: no acepta marcas</Badge>}
                </div>
              </TableCell>
              <TableCell className="tabular-nums">{pt.lastUsedAt ? formatDateTime(pt.lastUsedAt) : <Dash />}</TableCell>
              <TableCell>
                <Badge variant={pt.isActive ? "success" : "pending"}>{pt.isActive ? "Activo" : "Inactivo"}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" title="Editar punto" onClick={() => onEdit(pt)}>
                    <SquarePen className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
