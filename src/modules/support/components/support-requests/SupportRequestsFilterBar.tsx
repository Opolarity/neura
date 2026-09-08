import { ListFilter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SupportRequestsFilterBarProps {
  /** Término tal cual lo escribe el usuario (sin debounce). */
  search: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  /** Abre el modal donde viven tipo / creada por / estado / origen. */
  onOpen: () => void;
}

/**
 * Un buscador de texto libre y el botón que abre el modal de filtros, igual que
 * el resto de listados del ERP (ver ProductsFilterBar / SalesFilterBar).
 *
 * La búsqueda se resuelve en el servidor, no sobre la página ya cargada: con
 * paginación de servidor, filtrar en el cliente solo encontraría lo que está a
 * la vista. Cruza título, código de solicitud (`S-n`) y código de la tarea
 * vinculada (`T-n`), y el prefijo lo compara ya concatenado la API, así que
 * "S-21", "s-21" y "21" encuentran lo mismo.
 */
export const SupportRequestsFilterBar = ({
  search,
  hasActiveFilters,
  onSearchChange,
  onOpen,
}: SupportRequestsFilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* El buscador NO se deshabilita mientras carga: cada término dispara una
          consulta, y bloquear el campo en vuelo le robaría el foco al usuario a
          media palabra. */}
      <div className="relative w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nombre, S-21 o T-45..."
          aria-label="Buscar por nombre, código de solicitud o código de tarea"
          className="pl-9"
        />
      </div>

      <Button
        onClick={onOpen}
        variant={hasActiveFilters ? "default" : "outline"}
        className="gap-2"
      >
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>
    </div>
  );
};
