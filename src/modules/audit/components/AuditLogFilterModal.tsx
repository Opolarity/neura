import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter, DateRangeValue } from "@/shared/components/date-range";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_ID_HINT,
  AUDIT_ENTITY_LABELS,
  AUDIT_SOURCE_LABELS,
  AUDIT_TABLE_LABELS,
} from "../constants/auditLabels";
import { buildDefaultAuditFilters } from "../hooks/useAuditLog";
import type {
  AuditAction,
  AuditActor,
  AuditActorSource,
  AuditEntity,
  AuditLogFilters,
} from "../types/AuditLog.types";

const NONE = "none";

interface AuditLogFilterModalProps {
  isOpen: boolean;
  filters: AuditLogFilters;
  actors: AuditActor[];
  onClose: () => void;
  onApply: (filters: AuditLogFilters) => void;
}

const AuditLogFilterModal = ({
  isOpen,
  filters,
  actors,
  onClose,
  onApply,
}: AuditLogFilterModalProps) => {
  const [draft, setDraft] = useState<AuditLogFilters>(filters);
  const [entityError, setEntityError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      setEntityError(null);
    }
  }, [isOpen, filters]);

  const set = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) =>
    setDraft((prev) => ({ ...prev, start_date: startDate, end_date: endDate }));

  const handleApply = () => {
    if (draft.entity && !draft.entity_id?.trim()) {
      setEntityError("Ingresa el ID del registro");
      return;
    }
    onApply({
      ...draft,
      entity_id: draft.entity ? draft.entity_id?.trim() ?? null : null,
    });
  };

  const handleClear = () => {
    setEntityError(null);
    setDraft(buildDefaultAuditFilters(filters.size));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filtros de auditoría</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <DateRangeFilter
                startDate={draft.start_date}
                endDate={draft.end_date}
                onChange={handleDateChange}
              />
              <p className="text-xs text-muted-foreground">
                Sin fechas y sin registro concreto se muestran los últimos 7 días.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Registro concreto</Label>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <Select
                  value={draft.entity ?? NONE}
                  onValueChange={(v) => {
                    setEntityError(null);
                    set("entity", v === NONE ? null : (v as AuditEntity));
                    if (v === NONE) set("entity_id", null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ninguno</SelectItem>
                    {(Object.keys(AUDIT_ENTITY_LABELS) as AuditEntity[]).map((e) => (
                      <SelectItem key={e} value={e}>
                        {AUDIT_ENTITY_LABELS[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={draft.entity_id ?? ""}
                  onChange={(e) => {
                    setEntityError(null);
                    set("entity_id", e.target.value);
                  }}
                  disabled={!draft.entity}
                  placeholder={draft.entity ? AUDIT_ENTITY_ID_HINT[draft.entity] : "Elige un tipo"}
                  aria-invalid={!!entityError}
                  className={entityError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
              </div>
              {entityError ? (
                <p className="text-xs text-destructive">{entityError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Una venta incluye sus productos, pagos, estados y movimientos de stock.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de registro</Label>
              <Select
                value={draft.table ?? NONE}
                onValueChange={(v) => set("table", v === NONE ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos</SelectItem>
                  {Object.entries(AUDIT_TABLE_LABELS)
                    .sort(([, a], [, b]) => a.localeCompare(b, "es"))
                    .map(([table, label]) => (
                      <SelectItem key={table} value={table}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Acción</Label>
                <Select
                  value={draft.action ?? NONE}
                  onValueChange={(v) => set("action", v === NONE ? null : (v as AuditAction))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Todas</SelectItem>
                    {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {AUDIT_ACTION_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Origen</Label>
                <Select
                  value={draft.actor_source ?? NONE}
                  onValueChange={(v) =>
                    set("actor_source", v === NONE ? null : (v as AuditActorSource))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Todos</SelectItem>
                    {(Object.keys(AUDIT_SOURCE_LABELS) as AuditActorSource[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {AUDIT_SOURCE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select
                value={draft.actor_id ?? NONE}
                onValueChange={(v) => set("actor_id", v === NONE ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos</SelectItem>
                  {actors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogFilterModal;
