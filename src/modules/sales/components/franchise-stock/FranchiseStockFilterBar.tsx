import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";
import FranchiseeSelect from "./FranchiseeSelect";
import { FranchiseeTenant } from "../../types/FranchiseStock.types";

interface FranchiseStockFilterBarProps {
  franchisees: FranchiseeTenant[];
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
      {/* El mismo selector del modal de entrada: una sola forma de listar
          franquiciados en toda la pantalla. */}
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

      <TooltipIconButton
        onClick={onOpen}
        variant={hasActiveFilters ? "default" : "outline"}
        disabled={disabled}
        icon={<ListFilter className="w-4 h-4" />}
        label="Filtrar"
      />

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
