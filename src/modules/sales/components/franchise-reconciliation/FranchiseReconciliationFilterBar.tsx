import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import FranchiseeSelect from "../franchise-stock/FranchiseeSelect";
import FranchiseCategoryFilter from "../franchise-stock/FranchiseCategoryFilter";
import {
  FranchiseCategory,
  FranchiseeTenant,
} from "../../types/FranchiseStock.types";
import {
  FranchiseReconciliationTotals,
  ReconciliationStatus,
} from "../../types/FranchiseReconciliation.types";

interface Props {
  franchisees: FranchiseeTenant[];
  loadingFranchisees: boolean;
  tenantReference: string | null;
  onSelectFranchisee: (value: string) => void;
  search: string;
  onSearchChange: (text: string) => void;
  status: ReconciliationStatus | null;
  onStatusChange: (value: string) => void;
  counts: FranchiseReconciliationTotals["counts"] | null;
  categories: FranchiseCategory[];
  selectedCategories: number[] | null;
  onCategoriesChange: (ids: number[]) => void;
}

const withCount = (label: string, count: number | undefined) =>
  count === undefined ? label : `${label} (${count})`;

export default function FranchiseReconciliationFilterBar({
  franchisees,
  loadingFranchisees,
  tenantReference,
  onSelectFranchisee,
  search,
  onSearchChange,
  status,
  onStatusChange,
  counts,
  categories,
  selectedCategories,
  onCategoriesChange,
}: Props) {
  const disabled = !tenantReference;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FranchiseeSelect
        franchisees={franchisees}
        value={tenantReference ?? ""}
        onValueChange={onSelectFranchisee}
        disabled={loadingFranchisees}
        placeholder={
          loadingFranchisees
            ? "Cargando franquiciados..."
            : "Selecciona un franquiciado"
        }
        triggerClassName="w-[240px]"
      />

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por SKU o producto..."
          disabled={disabled}
          className="w-[240px] pl-10"
        />
      </div>

      <Select
        value={status ?? "all"}
        onValueChange={onStatusChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="shortage">{withCount("Faltante", counts?.shortage)}</SelectItem>
          <SelectItem value="surplus">{withCount("Sobrante", counts?.surplus)}</SelectItem>
          <SelectItem value="review">{withCount("Revisar", counts?.review)}</SelectItem>
          <SelectItem value="ok">{withCount("Cuadra", counts?.ok)}</SelectItem>
        </SelectContent>
      </Select>

      {!disabled && (
        <div className="w-[260px]">
          <FranchiseCategoryFilter
            categories={categories}
            selected={selectedCategories ?? []}
            onChange={onCategoriesChange}
          />
        </div>
      )}
    </div>
  );
}
