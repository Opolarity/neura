import { SquarePen, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Schedule, WEEKDAY_LABELS } from "../../types/attendance.types";
import { EmptyRow, LoadingRow } from "../TableStates";

interface SchedulesTableProps {
  items: Schedule[];
  loading: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

/** "Lun, Mar 08:00-17:00 · Sáb 08:00-13:00": agrupa los días que comparten horas. */
const resumen = (s: Schedule) => {
  const grupos = new Map<string, number[]>();
  s.days.forEach((d) => {
    const key = `${d.startTime}-${d.endTime}`;
    grupos.set(key, [...(grupos.get(key) ?? []), d.weekday]);
  });
  return [...grupos.entries()]
    .map(([horas, dias]) => `${dias.map((w) => WEEKDAY_LABELS[w].slice(0, 3)).join(", ")} ${horas}`)
    .join(" · ");
};

export const SchedulesTable = ({ items, loading, onEdit, onDelete }: SchedulesTableProps) => {
  const colSpan = 5;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Días y horas</TableHead>
          <TableHead className="text-right">Trabajadores</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Cargando horarios..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label="Sin horarios: sin horario se cuentan las horas reales" />
        ) : (
          items.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="font-medium">{h.name}</TableCell>
              <TableCell>
                {resumen(h)}
                {h.toleranceMinutes > 0 && (
                  <div className="text-xs text-muted-foreground">Tolerancia {h.toleranceMinutes} min</div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{h.employees}</TableCell>
              <TableCell>
                <Badge variant={h.isActive ? "success" : "pending"}>{h.isActive ? "Activo" : "Inactivo"}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" title="Editar horario" onClick={() => onEdit(h)}>
                    <SquarePen className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    title={h.employees > 0 ? "Tiene trabajadores asignados: desactívalo" : "Eliminar horario"}
                    disabled={h.employees > 0}
                    onClick={() => onDelete(h)}
                  >
                    <Trash className="w-4 h-4" />
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
