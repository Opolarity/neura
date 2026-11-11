import { useEffect, useState } from "react";
import { Download, ListFilter, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import { Input } from "@/components/ui/input";

interface MasterPlanFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  hasActiveFilters: boolean;
  onExport: () => void;
  exporting: boolean;
}

/**
 * La barra del Plan de producción, como la del resto del ERP: la búsqueda (OP, O/C,
 * modelo o color) y «Filtrar», que abre el modal con lo demás. A la derecha,
 * el Excel de todo lo filtrado.
 */
export const MasterPlanFilterBar = ({
  search,
  onSearchChange,
  onOpen,
  hasActiveFilters,
  onExport,
  exporting,
}: MasterPlanFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearch = () => onSearchChange(inputValue);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          type="text"
          placeholder="Buscar por OP, O/C, modelo o color..."
          className="w-80"
        />
        <Button variant="outline" onClick={handleSearch} aria-label="Buscar">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <TooltipIconButton
        onClick={onOpen}
        variant={hasActiveFilters ? "default" : "outline"}
        icon={<ListFilter className="w-4 h-4" />}
        label="Filtrar"
      />

      <span className="flex-1" />
      <TooltipIconButton
        variant="outline"
        onClick={onExport}
        disabled={exporting}
        icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        label="Descargar Excel"
      />
    </div>
  );
};
