import { Download, Loader2, Search } from "lucide-react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import InvoicesFilterModal from "./InvoicesFilterModal";
import type { ActiveInvoiceFilters } from "@/modules/invoices/hooks/useInvoices";
import type { InvoiceType } from "@/modules/invoices/types/Invoices.types";

interface InvoicesFilterBarProps {
  activeFilters?: ActiveInvoiceFilters;
  onApply?: (filters: ActiveInvoiceFilters) => void;
  onClear?: () => void;
  invoiceTypes?: InvoiceType[];
  search: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  exportLoading: boolean;
  exportDisabled: boolean;
}

const InvoicesFilterBar = ({
  activeFilters,
  onApply,
  onClear,
  invoiceTypes,
  search,
  onSearchChange,
  onExport,
  exportLoading,
  exportDisabled,
}: InvoicesFilterBarProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por serie, cliente, documento u orden..."
            className="w-80 pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <InvoicesFilterModal activeFilters={activeFilters} onApply={onApply} onClear={onClear} invoiceTypes={invoiceTypes} />

        <TooltipIconButton
          variant="outline"
          onClick={onExport}
          disabled={exportLoading || exportDisabled}
          icon={
            exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )
          }
          label={exportLoading ? "Generando..." : "Descargar Excel"}
        />
      </div>
    </div>
  );
};

export default InvoicesFilterBar;
