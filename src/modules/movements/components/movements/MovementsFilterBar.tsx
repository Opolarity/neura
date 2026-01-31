import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, Search, X } from "lucide-react";

interface MovementsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpenFilterModal: () => void;
  order?: string | null;
  onOrderChange: (value: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export default function MovementsFilterBar({
  search,
  onSearchChange,
  onOpenFilterModal,
  order,
  onOrderChange,
  hasActiveFilters = false,
  onClearFilters,
}: MovementsFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar movimientos..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Button onClick={onOpenFilterModal} variant={hasActiveFilters ? "default" : "outline"} className="gap-2">
        <ListFilter className="w-4 h-4" />
        Filtros
      </Button>

      {hasActiveFilters && onClearFilters && (
        <Button
          onClick={onClearFilters}
          variant="ghost"
          size="sm"
          className="gap-1"
        >
          <X className="w-4 h-4" />
          Limpiar
        </Button>
      )}

      <Select
        value={order || "none"}
        onValueChange={(value) => onOrderChange(value)}
      >
        <SelectTrigger className="w-auto min-w-[150px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin orden</SelectItem>
          <SelectItem value="date-desc">Fecha (mas reciente)</SelectItem>
          <SelectItem value="date-asc">Fecha (mas antigua)</SelectItem>
          <SelectItem value="amount-desc">Monto (mayor a menor)</SelectItem>
          <SelectItem value="amount-asc">Monto (menor a mayor)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
