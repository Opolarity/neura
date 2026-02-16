import { Search } from "lucide-react";

interface POSListFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
}

export default function POSListFilterBar({
  search,
  onSearchChange,
}: POSListFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar sesiones..."
          className="pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-[300px]"
        />
      </div>
    </div>
  );
}
