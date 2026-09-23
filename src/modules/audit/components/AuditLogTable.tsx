import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_VARIANT,
  AUDIT_SOURCE_LABELS,
  AUDIT_SOURCE_VARIANT,
} from "../constants/auditLabels";
import type { AuditLogEntry } from "../types/AuditLog.types";

// Fecha, Usuario, Origen, Acción, Registro, Cambios, Acciones.
const COL_SPAN = 7;

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  loading: boolean;
  hasFilters: boolean;
  onView: (entry: AuditLogEntry) => void;
}

const AuditLogTable = ({ entries, loading, hasFilters, onView }: AuditLogTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="whitespace-nowrap">Fecha y hora</TableHead>
        <TableHead>Usuario</TableHead>
        <TableHead>Origen</TableHead>
        <TableHead>Acción</TableHead>
        <TableHead>Registro</TableHead>
        <TableHead>Cambios</TableHead>
        <TableHead className="w-16">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading && entries.length === 0 ? (
        <TableRow>
          <TableCell colSpan={COL_SPAN} className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando auditoría...
            </div>
          </TableCell>
        </TableRow>
      ) : entries.length === 0 ? (
        <TableRow>
          <TableCell colSpan={COL_SPAN} className="text-center py-8 text-muted-foreground">
            {hasFilters
              ? "No hay cambios con los filtros aplicados"
              : "No hay cambios registrados en los últimos 7 días"}
          </TableCell>
        </TableRow>
      ) : (
        entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium whitespace-nowrap">{entry.dateLabel}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{entry.actorLabel}</span>
                {entry.actorRef && (
                  <span className="text-xs text-muted-foreground">{entry.actorRef}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={AUDIT_SOURCE_VARIANT[entry.actorSource]}>
                {AUDIT_SOURCE_LABELS[entry.actorSource] ?? entry.actorSource}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={AUDIT_ACTION_VARIANT[entry.action]}>
                {AUDIT_ACTION_LABELS[entry.action]}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">{entry.recordLabel}</TableCell>
            <TableCell className="max-w-xs truncate" title={entry.changedLabel}>
              {entry.changedLabel}
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onView(entry)} title="Ver cambio">
                <Eye className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default AuditLogTable;
