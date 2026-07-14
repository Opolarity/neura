import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceRule } from "../../types/priceRule.types";
import { formatDateDisplay } from "@/shared/utils/date";

interface PriceRulesTableProps {
  rules: PriceRule[];
  loading: boolean;
  onEdit: (rule: PriceRule) => void;
  onDelete: (rule: PriceRule) => void;
  selectedIds: Set<number>;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (id: number, checked: boolean) => void;
}

export const PriceRulesTable = ({
  rules,
  loading,
  onEdit,
  onDelete,
  selectedIds,
  onToggleAll,
  onToggleRow,
}: PriceRulesTableProps) => {
  const allSelected = rules.length > 0 && rules.every((r) => selectedIds.has(r.id));
  const someSelected = rules.some((r) => selectedIds.has(r.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No se encontraron reglas de precios</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => onToggleAll(checked === true)}
            />
          </TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cupón</TableHead>
          <TableHead>Validez</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>
              <Checkbox
                checked={selectedIds.has(rule.id)}
                onCheckedChange={(checked) => onToggleRow(rule.id, checked === true)}
              />
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{rule.name}</p>
                {rule.code && (
                  <p className="text-xs text-muted-foreground">{rule.code}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={rule.rule_type === "automatic" ? "default" : "secondary"}>
                {rule.rule_type === "automatic" ? "Automática" : "Cupón"}
              </Badge>
            </TableCell>
            <TableCell>{rule.priority}</TableCell>
            <TableCell>
              <Badge variant={rule.is_active ? "default" : "destructive"}>
                {rule.is_active ? "Activa" : "Inactiva"}
              </Badge>
            </TableCell>
            <TableCell>
              {rule.discounts && rule.discounts.length > 0 ? (
                <Badge variant="outline">{rule.discounts[0].code}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              {rule.valid_from || rule.valid_to ? (
                <span className="text-sm">
                  {rule.valid_from
                    ? formatDateDisplay(rule.valid_from)
                    : "..."}{" "}
                  -{" "}
                  {rule.valid_to
                    ? formatDateDisplay(rule.valid_to)
                    : "..."}
                </span>
              ) : (
                <span className="text-muted-foreground">Sin límite</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(rule)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(rule)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
