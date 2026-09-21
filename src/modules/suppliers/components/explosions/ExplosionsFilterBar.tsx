import { useState, useEffect } from "react";
import { Search, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExplosionsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  hasActiveFilters?: boolean;
}

export const ExplosionsFilterBar = ({
  search,
  onSearchChange,
  onOpen,
  hasActiveFilters,
}: ExplosionsFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearch = () => {
    onSearchChange(inputValue);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          type="text"
          placeholder="Buscar por descripción o tipo..."
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
