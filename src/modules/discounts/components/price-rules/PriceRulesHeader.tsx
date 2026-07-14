import { Tags, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceRulesHeaderProps {
  onNewRule: () => void;
  selectedCount: number;
  bulkStatus: "true" | "false";
  onBulkStatusChange: (value: "true" | "false") => void;
  onApplyBulkStatus: () => void;
  isApplying: boolean;
}

export const PriceRulesHeader = ({
  onNewRule,
  selectedCount,
  bulkStatus,
  onBulkStatusChange,
  onApplyBulkStatus,
  isApplying,
}: PriceRulesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Tags className="w-8 h-8 text-primary" />
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
            <Select value={bulkStatus} onValueChange={onBulkStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activar</SelectItem>
                <SelectItem value="false">Desactivar</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" onClick={onApplyBulkStatus} disabled={isApplying}>
              Aplicar
            </Button>
          </>
        )}
        <Button onClick={onNewRule} className={selectedCount > 0 ? "hidden" : ""}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Regla
        </Button>
      </div>
    </div>
  );
};
