import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ClientsOrderBy } from '../types';

interface ClientsSearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  order: ClientsOrderBy;
  onOrderChange: (order: ClientsOrderBy) => void;
  onFilterClick: () => void;
  hasActiveFilters: boolean;
}

const orderOptions: { value: ClientsOrderBy; label: string }[] = [
  { value: 'date-desc', label: 'Fecha (más reciente)' },
  { value: 'date-asc', label: 'Fecha (más antiguo)' },
  { value: 'amount-desc', label: 'Monto (mayor a menor)' },
  { value: 'amount-asc', label: 'Monto (menor a mayor)' },
  { value: 'purchases-desc', label: 'Compras (mayor a menor)' },
  { value: 'purchases-asc', label: 'Compras (menor a mayor)' },
];

export const ClientsSearchBar = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  order,
  onOrderChange,
  onFilterClick,
  hasActiveFilters,
}: ClientsSearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* Buscador */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o documento..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>

      {/* Ordenar */}
      <Select value={order} onValueChange={(value) => onOrderChange(value as ClientsOrderBy)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {orderOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botón de filtros */}
      <Button 
        variant="outline" 
        onClick={onFilterClick}
        className={hasActiveFilters ? 'border-primary text-primary' : ''}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtrar
        {hasActiveFilters && (
          <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            •
          </span>
        )}
      </Button>
    </div>
  );
};
