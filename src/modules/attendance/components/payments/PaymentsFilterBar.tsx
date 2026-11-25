import { useEffect, useState } from "react";
import { Download, ListFilter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface PaymentsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  /** Abre el modal «Filtrar pagos». */
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  onExport: () => void;
  exportDisabled: boolean;
}

/**
 * Barra de la tabla de Pagos, como la de Clientes: buscador (busca al pulsar la
 * lupa o Enter), «Filtrar» (abre el modal; relleno cuando hay filtros
 * activos) y «Exportar» al extremo derecho.
 */
export const PaymentsFilterBar = ({
  search,
  onSearchChange,
  onOpenFilters,
  hasActiveFilters,
  onExport,
  exportDisabled,
}: PaymentsFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchChange(inputValue)}
          type="text"
          placeholder="Buscar por nombre o código..."
          aria-label="Buscar trabajador"
        />
        <Button variant="outline" onClick={() => onSearchChange(inputValue)} aria-label="Buscar">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <TooltipIconButton
        onClick={onOpenFilters}
        variant={hasActiveFilters ? "default" : "outline"}
        icon={<ListFilter className="w-4 h-4" />}
        label="Filtrar"
      />

      <div className="ml-auto flex items-center gap-2">
        <TooltipIconButton
          variant="outline"
          onClick={onExport}
          disabled={exportDisabled}
          icon={<Download className="w-4 h-4" />}
          label="Exportar"
        />
      </div>
    </div>
  );
};
