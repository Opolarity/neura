import { Input } from "@/components/ui/input";
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
  order: string;
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
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div className="flex gap-2 items-center">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o documento..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant={hasActiveFilters ? "default" : "outline"} onClick={onOpen} className="gap-2">
          <ListFilter className="w-4 h-4" />
          Filtrar
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Ordenar por:</span>
        <Select value={order} onValueChange={onOrderChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Fecha (más reciente)</SelectItem>
            <SelectItem value="date_asc">Fecha (más antigua)</SelectItem>
            <SelectItem value="total_desc">Total (mayor)</SelectItem>
            <SelectItem value="total_asc">Total (menor)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SalesFilterBar;
