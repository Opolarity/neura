import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";

interface UsersFilterBarProps {
  search: string;
  handleSearchChange: (text: string) => void;
  onOpen: () => void;
}

const UsersFilterBar = ({
  search,
  handleSearchChange,
  onOpen,
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

      <Button className="gap-2" onClick={onOpen}>
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>
    </div>
  );
};

export default UsersFilterBar;
