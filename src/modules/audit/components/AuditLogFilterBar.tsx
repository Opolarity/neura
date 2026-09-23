import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, X } from "lucide-react";

interface AuditLogFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onOpenFilterModal: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const AuditLogFilterBar = ({
  search,
  onSearchChange,
  onOpenFilterModal,
  hasActiveFilters,
  onClearFilters,
}: AuditLogFilterBarProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="relative w-full sm:w-80">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por ID, usuario, referencia o campo..."
        className="pl-10"
      />
    </div>

    <Button
      onClick={onOpenFilterModal}
      variant={hasActiveFilters ? "default" : "outline"}
      className="gap-2"
    >
      <ListFilter className="w-4 h-4" />
      Filtros
    </Button>

    {hasActiveFilters && (
      <Button variant="ghost" onClick={onClearFilters} className="gap-2">
        <X className="w-4 h-4" />
        Limpiar
      </Button>
    )}
  </div>
);

export default AuditLogFilterBar;
