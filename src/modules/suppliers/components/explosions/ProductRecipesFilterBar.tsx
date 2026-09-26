import { useState, useEffect } from "react";
import { Search, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductRecipesFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  /** Hay un filtro del pop-up aplicado (receta o categoría). */
  hasActiveFilters?: boolean;
}

/** Búsqueda + el botón del pop-up, donde van el estado de receta y la categoría. */
export const ProductRecipesFilterBar = ({
  search,
  onSearchChange,
  onOpen,
  hasActiveFilters,
}: ProductRecipesFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearch = () => onSearchChange(inputValue);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          type="text"
          placeholder="Buscar por producto, código, SKU o modelo..."
          className="w-72"
        />
        <Button variant="outline" onClick={handleSearch}>
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
    </div>
  );
};
