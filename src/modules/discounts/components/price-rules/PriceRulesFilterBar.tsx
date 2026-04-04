import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PriceRuleFilters } from "../../types/priceRule.types";

interface PriceRulesFilterBarProps {
  filters: PriceRuleFilters;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: keyof PriceRuleFilters, value: string | null) => void;
}

export const PriceRulesFilterBar = ({
  filters,
  onSearchChange,
  onFilterChange,
}: PriceRulesFilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o código..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.rule_type || "all"}
        onValueChange={(val) =>
          onFilterChange("rule_type", val === "all" ? null : val)
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="automatic">Automática</SelectItem>
          <SelectItem value="coupon">Cupón</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.is_active || "all"}
        onValueChange={(val) =>
          onFilterChange("is_active", val === "all" ? null : val)
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activas</SelectItem>
          <SelectItem value="false">Inactivas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
