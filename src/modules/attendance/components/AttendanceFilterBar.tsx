import { KeyboardEvent, ReactNode, useEffect, useState } from "react";
import { Download, ListFilter, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface AttendanceFilterBarProps {
  /** Lo que se está buscando (aplicado). */
  search: string;
  /** Se llama al apretar la lupa o Enter, como en las demás tablas. */
  onSearch: (value: string) => void;
  placeholder: string;
  /** Abre el popup «Filtrar» (fechas y demás filtros). */
  onOpenFilters: () => void;
  /** El botón «Filtrar» se pinta lleno cuando hay filtros activos. */
  hasActiveFilters: boolean;
  /** «Quitar fechas»: se muestra solo si se pasa (hay fechas aplicadas). */
  onClearDates?: () => void;
  /** Controles propios de la pantalla, al inicio de la barra. */
  slot?: ReactNode;
  /** «Exportar» (botón de icono al extremo derecho, neura-styles parte 7): se muestra solo si se pasa. */
  onExport?: () => void;
  exporting?: boolean;
  exportDisabled?: boolean;
}

/**
 * Barra de filtros de las tablas de asistencia, igual que las demás del ERP:
 * buscador con su botón, «Filtrar» (popup con las fechas), que se pinta lleno
 * cuando hay filtros aplicados, y «Exportar» de icono al extremo derecho.
 */
export const AttendanceFilterBar = ({
  search,
  onSearch,
  placeholder,
  onOpenFilters,
  hasActiveFilters,
  onClearDates,
  slot,
  onExport,
  exporting = false,
  exportDisabled = false,
}: AttendanceFilterBarProps) => {
  const [text, setText] = useState(search);

  useEffect(() => {
    setText(search);
  }, [search]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch(text.trim());
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {slot}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-72"
          aria-label="Buscar"
        />
        <Button variant="outline" aria-label="Buscar" onClick={() => onSearch(text.trim())}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
      <TooltipIconButton
        variant={hasActiveFilters ? "default" : "outline"}
        onClick={onOpenFilters}
        icon={<ListFilter className="w-4 h-4" />}
        label="Filtrar"
      />
      {onClearDates && (
        <Button variant="ghost" className="gap-1" onClick={onClearDates}>
          <X className="h-4 w-4" />
          Quitar fechas
        </Button>
      )}
      {onExport && (
        <div className="ml-auto flex items-center gap-2">
          <TooltipIconButton
            variant="outline"
            onClick={onExport}
            disabled={exporting || exportDisabled}
            icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            label={exporting ? "Generando..." : "Exportar"}
          />
        </div>
      )}
    </div>
  );
};
