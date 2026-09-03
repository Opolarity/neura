import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";
import { FranchiseeAccount } from "@/modules/discounts/types/priceRule.types";

interface FranchiseStockFilterBarProps {
  franchisees: FranchiseeAccount[];
  loadingFranchisees: boolean;
  tenantReference: string | null;
  onSelectFranchisee: (value: string) => void;
  search: string;
  onSearchChange: (text: string) => void;
  onOpen: () => void;
  order?: string | null;
  onOrderChange: (value: string) => void;
  hasActiveFilters?: boolean;
}

const franchiseeLabel = (account: FranchiseeAccount) =>
  [account.name, account.last_name].filter(Boolean).join(" ").trim() ||
  account.tenant_reference;

export default function FranchiseStockFilterBar({
  franchisees,
  loadingFranchisees,
  tenantReference,
  onSelectFranchisee,
  search,
  order,
  onSearchChange,
  onOpen,
  onOrderChange,
  hasActiveFilters,
}: FranchiseStockFilterBarProps) {
  // Los demás controles no hacen nada hasta elegir franquiciado: sin él no hay
  // consulta que filtrar.
  const disabled = !tenantReference;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={tenantReference ?? ""}
        onValueChange={onSelectFranchisee}
        disabled={loadingFranchisees}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue
            placeholder={
              loadingFranchisees
                ? "Cargando franquiciados..."
                : "Selecciona un franquiciado"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {franchisees.map((account) => (
            <SelectItem
              key={account.tenant_reference}
              value={account.tenant_reference}
            >
              {franchiseeLabel(account)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Buscar productos..."
          disabled={disabled}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button
        onClick={onOpen}
        variant={hasActiveFilters ? "default" : "outline"}
        className="gap-2"
        disabled={disabled}
      >
        <ListFilter className="w-4 h-4" />
        Filtrar
      </Button>

      <Select
        value={order || "none"}
        onValueChange={(value) => onOrderChange(value)}
        disabled={disabled}
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin orden</SelectItem>
          <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
          <SelectItem value="stc-asc">Menor stock</SelectItem>
          <SelectItem value="stc-dsc">Mayor stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
