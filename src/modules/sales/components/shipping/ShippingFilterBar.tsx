import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";

interface ShppingFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  order?: string | null;
  onOrderChange: (value: string) => void;
  hasActiveFilters?: boolean;
}

export default function ShippingFilterBar({
  search,
  onSearchChange,
  onOpen,
  order,
  onOrderChange,
  hasActiveFilters,
}: ShppingFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar métodos de envío..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Button onClick={onOpen} variant={hasActiveFilters ? "default" : "outline"} className="gap-2">
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
          <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
          <SelectItem value="pri-asc">Precio más bajo</SelectItem>
          <SelectItem value="pri-dec">Precio más alto</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
