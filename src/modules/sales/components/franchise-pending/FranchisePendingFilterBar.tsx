import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FranchiseeMultiSelect,
  type FranchiseeMultiSelectOption,
} from "../FranchiseeMultiSelect";

interface FranchisePendingFilterBarProps {
  onlyPending: boolean;
  onOnlyPendingChange: (value: boolean) => void;
  franchiseeOptions: FranchiseeMultiSelectOption[];
  accountIds: number[];
  onAccountIdsChange: (value: number[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function FranchisePendingFilterBar({
  onlyPending,
  onOnlyPendingChange,
  franchiseeOptions,
  accountIds,
  onAccountIdsChange,
  search,
  onSearchChange,
}: FranchisePendingFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Filtro principal de la pantalla (T-782). */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="only-pending"
          checked={onlyPending}
          onCheckedChange={(checked) => onOnlyPendingChange(checked === true)}
        />
        <Label htmlFor="only-pending" className="cursor-pointer">
          Solo pendientes de aceptar
        </Label>
      </div>

      <div className="w-[280px]">
        <FranchiseeMultiSelect
          options={franchiseeOptions}
          value={accountIds}
          onChange={onAccountIdsChange}
        />
      </div>

      <div className="relative w-[240px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar pedido o franquiciado..."
          className="pl-9"
        />
      </div>
    </div>
  );
}
