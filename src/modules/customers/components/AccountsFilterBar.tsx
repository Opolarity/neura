import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilter } from 'lucide-react'

interface AccountsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  order?: string | null;
  handleOrderChange: (value: string) => void;
  onOpen: () => void;
  hasActiveFilters?: boolean;
}

export const AccountsFilterBar = ({
  search,
  onSearchChange,
  order,
  handleOrderChange,
  onOpen,
  hasActiveFilters,
}: AccountsFilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar por nombre o documento..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      <Select
        value={order || "none"}
        onValueChange={(value) =>
          handleOrderChange(value === "none" ? "none" : value)
        }
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin orden</SelectItem>
          <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
          <SelectItem value="date-asc">Fecha mas antigua</SelectItem>
          <SelectItem value="date-dec">Fecha mas reciente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
