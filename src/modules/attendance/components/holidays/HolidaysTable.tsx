import { SquarePen, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/shared/utils/date";
import { Holiday } from "../../types/attendance.types";
import { HOLIDAY_STATUS, holidayStatus, holidayWeekday } from "../../utils/holidays";
import { EmptyRow, LoadingRow } from "../TableStates";

interface HolidaysTableProps {
  items: Holiday[];
  loading: boolean;
  /** Hoy en Lima ("YYYY-MM-DD"), para marcar Hoy / Próximo / Pasado. */
  today: string;
  emptyLabel: string;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

export const HolidaysTable = ({ items, loading, today, emptyLabel, onEdit, onDelete }: HolidaysTableProps) => {
  const colSpan = 4;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Fecha</TableHead>
          <TableHead>Feriado</TableHead>
          <TableHead className="w-[120px]">Estado</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Cargando feriados..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label={emptyLabel} />
        ) : (
          items.map((h) => {
            const estado = HOLIDAY_STATUS[holidayStatus(h.day, today)];
            return (
              <TableRow key={h.id}>
                <TableCell>
                  <div className="tabular-nums">{formatDateDisplay(h.day)}</div>
                  <div className="text-xs text-muted-foreground">{holidayWeekday(h.day)}</div>
                </TableCell>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell>
                  <Badge variant={estado.variant}>{estado.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" title="Editar feriado" onClick={() => onEdit(h)}>
                      <SquarePen className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" title="Eliminar feriado" onClick={() => onDelete(h)}>
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
