import { Tags, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComponentPermission } from "@/shared/components/component-permission";

interface PriceRulesHeaderProps {
  onNewRule: () => void;
  selectedCount: number;
  bulkStatus: "true" | "false";
  onBulkStatusChange: (value: "true" | "false") => void;
  onApplyBulkStatus: () => void;
  isApplying: boolean;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
}

export const PriceRulesHeader = ({
  onNewRule,
  selectedCount,
  bulkStatus,
  onBulkStatusChange,
  onApplyBulkStatus,
  isApplying,
  onBulkDelete,
  isBulkDeleting,
}: PriceRulesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Tags className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Reglas de Precios</h1>
          <p className="text-muted-foreground">
            Gestiona las reglas de precios y cupones
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            {/* Activar/desactivar en masa cambia is_active de las reglas
                seleccionadas: es editar, solo que sin pasar por el formulario,
                de ahí que reutilice price_rules.edit. */}
            <ComponentPermission codeIn={["price_rules.edit"]}>
              <Select value={bulkStatus} onValueChange={onBulkStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activar</SelectItem>
                  <SelectItem value="false">Desactivar</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={onApplyBulkStatus}
                disabled={isApplying || isBulkDeleting}
              >
                Aplicar
              </Button>
            </ComponentPermission>
            <ComponentPermission codeIn={["price_rules.delete"]}>
              <Button
                variant="destructive"
                onClick={onBulkDelete}
                disabled={isApplying || isBulkDeleting}
                className="gap-2"
              >
                <Trash className="w-4 h-4" />
                Eliminar {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </Button>
            </ComponentPermission>
          </>
        )}
        {/* El botón lleva a /discounts/price-rules/create, ya protegida con
            price_rules.create: se reutiliza ese code para no ofrecer un botón
            que acaba en una pantalla bloqueada. */}
        <ComponentPermission codeIn={["price_rules.create"]}>
          <Button onClick={onNewRule} className={selectedCount > 0 ? "hidden" : ""}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Regla
          </Button>
        </ComponentPermission>
      </div>
    </div>
  );
};
