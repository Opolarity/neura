import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_VARIANT,
  AUDIT_SOURCE_LABELS,
  AUDIT_SOURCE_VARIANT,
  buildFieldChanges,
} from "../constants/auditLabels";
import { useAuditTransaction } from "../hooks/useAuditTransaction";
import type { AuditLogEntry } from "../types/AuditLog.types";

interface AuditLogDetailSheetProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

const AuditLogDetailSheet = ({ entry, onClose }: AuditLogDetailSheetProps) => {
  // La entrada visible puede cambiar a otra de la misma operación sin cerrar el panel.
  const [current, setCurrent] = useState<AuditLogEntry | null>(entry);
  useEffect(() => setCurrent(entry), [entry]);

  const { related, loading } = useAuditTransaction(entry);
  const others = related.filter((r) => r.id !== current?.id);
  const changes = current
    ? buildFieldChanges(current.action, current.changedFields, current.oldData, current.newData)
    : [];

  return (
    <Sheet open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col gap-0 p-0">
        <SheetHeader className="space-y-3 border-b px-6 py-4 text-left">
          <div>
            <SheetTitle className="pr-6">{current?.recordLabel ?? "Detalle del cambio"}</SheetTitle>
            <SheetDescription>{current?.dateLabel}</SheetDescription>
          </div>
          {current && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={AUDIT_ACTION_VARIANT[current.action]}>
                {AUDIT_ACTION_LABELS[current.action]}
              </Badge>
              <Badge variant={AUDIT_SOURCE_VARIANT[current.actorSource]}>
                {AUDIT_SOURCE_LABELS[current.actorSource] ?? current.actorSource}
              </Badge>
              <span className="text-sm">{current.actorLabel}</span>
              {current.actorRef && (
                <span className="text-xs text-muted-foreground">{current.actorRef}</span>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {current?.action === "UPDATE"
                ? "Campos modificados"
                : current?.action === "INSERT"
                  ? "Valores creados"
                  : "Valores eliminados"}
            </h3>
            {changes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Antes</TableHead>
                      <TableHead>Después</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((c) => (
                      <TableRow key={c.field}>
                        <TableCell className="font-medium" title={c.field}>
                          {c.label}
                        </TableCell>
                        <TableCell className="break-all text-muted-foreground">{c.before}</TableCell>
                        <TableCell className="break-all">{c.after}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Misma operación</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : others.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cambio se hizo solo, sin otros registros en la misma operación.
              </p>
            ) : (
              <ul className="space-y-1">
                {others.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={AUDIT_ACTION_VARIANT[r.action]}>{AUDIT_ACTION_LABELS[r.action]}</Badge>
                      <span className="text-sm truncate">{r.recordLabel}</span>
                      {r.action === "UPDATE" && (
                        <span className="text-xs text-muted-foreground truncate">{r.changedLabel}</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrent(r)}>
                      Ver
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AuditLogDetailSheet;
