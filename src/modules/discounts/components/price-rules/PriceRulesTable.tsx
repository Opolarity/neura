import { SquarePen, Trash, Loader2 } from "lucide-react";
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
import { hasConsignmentMarker } from "../../adapters/priceRule.adapter";
import { formatDateDisplay } from "@/shared/utils/date";
import { ComponentPermission } from "@/shared/components/component-permission";

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["price_rules.edit", "price_rules.delete"];

// La selección solo alimenta las dos acciones masivas de la cabecera —
// activar/desactivar (edit) y eliminar (delete)—, así que se pinta con los
// mismos codes. Va en su propia constante porque son cosas distintas: si
// mañana el borrado masivo desaparece, esta lista cambia y ACTION_CODES no.
const BULK_CODES = ["price_rules.edit", "price_rules.delete"];

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
          {/* Se envuelve la celda entera y no solo el Checkbox: un th/td vacío
              sigue ocupando su ancho y deja un hueco muerto. */}
          <ComponentPermission codeIn={BULK_CODES}>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
              />
            </TableHead>
          </ComponentPermission>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cupón</TableHead>
          <TableHead>Validez</TableHead>
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead className="text-right">Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <ComponentPermission codeIn={BULK_CODES}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(rule.id)}
                  onCheckedChange={(checked) => onToggleRow(rule.id, checked === true)}
                />
              </TableCell>
            </ComponentPermission>
            <TableCell>
              <div>
                <p className="font-medium">{rule.name}</p>
                {rule.code && (
                  <p className="text-xs text-muted-foreground">{rule.code}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant={rule.rule_type === "automatic" ? "default" : "secondary"}>
                  {rule.rule_type === "automatic" ? "Automática" : "Cupón"}
                </Badge>
                {hasConsignmentMarker(rule.conditions) && (
                  <Badge variant="outline">Franquicia</Badge>
                )}
              </div>
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
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <ComponentPermission codeIn={["price_rules.edit"]}>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Editar la regla de precio"
                      onClick={() => onEdit(rule)}
                    >
                      <SquarePen className="w-4 h-4" />
                    </Button>
                  </ComponentPermission>
                  <ComponentPermission codeIn={["price_rules.delete"]}>
                    <Button
                      variant="destructive"
                      size="sm"
                      title="Eliminar la regla de precio"
                      onClick={() => onDelete(rule)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </ComponentPermission>
                </div>
              </TableCell>
            </ComponentPermission>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
