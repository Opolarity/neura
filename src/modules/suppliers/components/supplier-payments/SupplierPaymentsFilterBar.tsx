import { useEffect, useState } from "react";
import { ListFilter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import { Input } from "@/components/ui/input";
import { SupplierPayablesStatusFilter } from "../../types/supplierPayments.types";
import { PaymentsStatusFilterModal } from "../payments-collections/PaymentsStatusFilterModal";

interface SupplierPaymentsFilterBarProps {
  search: string | null;
  status: SupplierPayablesStatusFilter;
  onSearch: (text: string) => void;
  onStatusChange: (status: SupplierPayablesStatusFilter) => void;
  /** «Cobros a clientes» la reusa con sus palabras. */
  placeholder?: string;
  openLabel?: string;
  paidLabel?: string;
  /** El título del modal de filtros. */
  filterTitle?: string;
}

/**
 * La barra de Pagos y cobros como la del resto del ERP (neura-styles): la
 * búsqueda con su lupa y «Filtrar», que abre el modal con el estado. El botón
 * se pinta relleno cuando hay un filtro aplicado.
 */
const SupplierPaymentsFilterBar = ({
  search,
  status,
  onSearch,
  onStatusChange,
  placeholder = "Buscar taller, servicio, cotización u OP...",
  openLabel = "Por pagar",
  paidLabel = "Pagados",
  filterTitle = "Filtrar pagos a proveedores",
}: SupplierPaymentsFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search ?? "");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setInputValue(search ?? "");
  }, [search]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(inputValue)}
          placeholder={placeholder}
          className="w-72"
        />
        <Button variant="outline" onClick={() => onSearch(inputValue)} aria-label="Buscar">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <TooltipIconButton
        onClick={() => setModalOpen(true)}
        variant={status ? "default" : "outline"}
        icon={<ListFilter className="w-4 h-4" />}
        label="Filtrar"
      />

      <PaymentsStatusFilterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={filterTitle}
        status={status ?? null}
        onApply={(value) => onStatusChange(value as SupplierPayablesStatusFilter)}
        openLabel={openLabel}
        paidLabel={paidLabel}
      />
    </div>
  );
};

export default SupplierPaymentsFilterBar;
