import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoriesOrderBy } from '../../types/Categories.type';

interface CategoriesSearchBarProps {
  searchInput: string;
  order: CategoriesOrderBy;
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onOrderChange: (value: CategoriesOrderBy) => void;
  onFilterClick: () => void;
}

const orderOptions: { value: CategoriesOrderBy; label: string }[] = [
  { value: 'alp-asc', label: 'Nombre A-Z' },
  { value: 'alp-dsc', label: 'Nombre Z-A' },
  { value: 'prd-asc', label: 'Productos ↑' },
  { value: 'prd-dsc', label: 'Productos ↓' },
];

export const CategoriesSearchBar = ({
  searchInput,
  order,
  hasActiveFilters,
  onSearchInputChange,
  onSearch,
  onOrderChange,
  onFilterClick,
}: CategoriesSearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4">
      {/* Search Input */}
      <div className="relative w-full sm:w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorías..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9"
        />
      </div>

      {/* Order Select */}
      <Select value={order} onValueChange={onOrderChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
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

      {/* Filter Button */}
      <Button
        variant={hasActiveFilters ? 'default' : 'outline'}
        onClick={onFilterClick}
        className="w-full sm:w-auto"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
            ●
          </span>
        )}
      </Button>
    </div>
  );
};
