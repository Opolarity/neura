import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SuppliersFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
}

export const SuppliersFilterBar = ({
  search,
  onSearchChange,
}: SuppliersFilterBarProps) => {
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
          type="text"
          placeholder="Buscar por nombre..."
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
