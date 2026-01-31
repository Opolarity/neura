import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ListFilter } from "lucide-react";

interface SalesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpen: () => void;
  order?: string | null;
  onOrderChange: (value: string) => void;
  hasActiveFilters?: boolean;
}

const SalesFilterBar = ({
  search,
  onSearchChange,
  onOpen,
  order,
  onOrderChange,
  hasActiveFilters,
}: SalesFilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar por cliente o documento..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Button variant={hasActiveFilters ? "default" : "outline"} onClick={onOpen} className="gap-2">
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>

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
          <SelectItem value="date_desc">Fecha (más reciente)</SelectItem>
          <SelectItem value="date_asc">Fecha (más antigua)</SelectItem>
          <SelectItem value="total_desc">Total (mayor)</SelectItem>
          <SelectItem value="total_asc">Total (menor)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SalesFilterBar;
