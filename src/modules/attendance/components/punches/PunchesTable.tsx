import { SquarePen, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date";
import { METHOD_LABELS, Punch } from "../../types/attendance.types";
import { LocationLink } from "../LocationLink";
import { PhotoThumb } from "../PhotoThumb";
import { Dash, EmptyRow, LoadingRow } from "../TableStates";

interface PunchesTableProps {
  items: Punch[];
  loading: boolean;
  canManage: boolean;
  onEdit: (punch: Punch) => void;
  onDelete: (punch: Punch) => void;
}

/**
 * Lugar de la marca: el punto donde se hizo o "Sin punto" (trabajador sin
 * puntos, marcó desde cualquier lugar), con sus coordenadas enlazadas al mapa.
 */
const Lugar = ({ m }: { m: Punch }) => {
  const conUbicacion = m.latitude !== null && m.longitude !== null;
  if (!m.pointName && !conUbicacion) return <Dash />;
  return (
    <div className="flex flex-col items-start gap-0.5">
      {m.pointName ?? <Badge variant="outline">Sin punto</Badge>}
      <LocationLink latitude={m.latitude} longitude={m.longitude} accuracyM={m.accuracyM} />
    </div>
  );
};

/** Registro de marcas con su foto, lugar y método. */
export const PunchesTable = ({ items, loading, canManage, onEdit, onDelete }: PunchesTableProps) => {
  const colSpan = canManage ? 8 : 7;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Foto</TableHead>
          <TableHead>Fecha y hora</TableHead>
          <TableHead>Trabajador</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Lugar</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Nota</TableHead>
          {canManage && <TableHead className="w-[100px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Cargando marcas..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label="No hay marcas en este rango" />
        ) : (
          items.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <PhotoThumb path={m.photoPath} title={`${m.name} · ${formatDateTime(m.punchedAt)}`} />
              </TableCell>
              <TableCell className="tabular-nums whitespace-nowrap">{formatDateTime(m.punchedAt)}</TableCell>
              <TableCell>
                <div className="font-medium">{m.name}</div>
                {m.documentNumber && <div className="text-xs text-muted-foreground">{m.documentNumber}</div>}
              </TableCell>
              <TableCell>
                <Badge variant={m.punchType === "IN" ? "success" : "secondary"}>
                  {m.punchType === "IN" ? "Entrada" : "Salida"}
                </Badge>
              </TableCell>
              <TableCell>
                <Lugar m={m} />
              </TableCell>
              <TableCell>
                <div>{METHOD_LABELS[m.method] ?? m.method}</div>
                {m.createdBy && <div className="text-xs text-muted-foreground">{m.createdBy}</div>}
              </TableCell>
              <TableCell className="max-w-[220px] truncate" title={m.note ?? undefined}>
                {m.note ?? <Dash />}
              </TableCell>
              {canManage && (
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" title="Corregir marca" onClick={() => onEdit(m)}>
                      <SquarePen className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" title="Eliminar marca" onClick={() => onDelete(m)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
