import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface AttributesFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  order?: string | null;
  onOrderChange: (value: string) => void;
  hasActiveFilters?: boolean;
}

export default function AttributesFilterBar({
  search,
  onSearchChange,
  onOpen,
  order,
  onOrderChange,
  hasActiveFilters,
}: AttributesFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar atributos..."
          className="pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
        />
      </div>

      <TooltipIconButton onClick={onOpen} variant={hasActiveFilters ? "default" : "outline"} icon={<ListFilter className="w-4 h-4" />} label="Filtrar" />

      <Select
        value={order || "none"}
        onValueChange={(value) =>
          onOrderChange(value === "none" ? "none" : value)
        }
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin orden</SelectItem>
          <SelectItem value="prd-asc">Productos (menor)</SelectItem>
          <SelectItem value="prd-dsc">Productos (mayor)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
