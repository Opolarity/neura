import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";

interface MaterialMovementsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  order: string;
  onOrderChange: (order: string) => void;
  hasActiveFilters?: boolean;
}

const MaterialMovementsFilterBar = ({
  search,
  onSearchChange,
  onOpen,
  order,
  onOrderChange,
  hasActiveFilters,
}: MaterialMovementsFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="text"
          placeholder="Buscar movimientos..."
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <Button variant="outline" onClick={() => onSearchChange(inputValue)}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <Button
        onClick={onOpen}
        variant={hasActiveFilters ? "default" : "outline"}
        className="gap-2"
      >
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>

      <Select value={order || "date-desc"} onValueChange={onOrderChange}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">Más reciente</SelectItem>
          <SelectItem value="date-asc">Más antiguo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default MaterialMovementsFilterBar;
