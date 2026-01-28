import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsersFilterBarProps {
  search: string;
  handleSearchChange: (text: string) => void;
  onFilterClick: () => void;
  order: string | undefined;
  onOrderChange: (value: string) => void;
}

const UsersFilterBar = ({
  search,
  handleSearchChange,
  onFilterClick,
  order,
  onOrderChange,
}: UsersFilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(u) => handleSearchChange(u.target.value)}
          type="text"
          placeholder="Buscar usuarios..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Button className="gap-2" variant="outline" onClick={onFilterClick}>
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>

      <Select value={order || "none"} onValueChange={onOrderChange}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin orden</SelectItem>
          <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UsersFilterBar;
