import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Supplier } from "../../types/suppliers.types";
import { SupplierPaymentsFilters } from "../../types/supplierPayments.types";

interface SupplierPaymentsFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  suppliers: Supplier[];
  filters: SupplierPaymentsFilters;
  onSupplierChange: (supplierId: number | null) => void;
  onStatusChange: (status: SupplierPaymentsFilters["status"]) => void;
}

/** El valor que usa el Select para "sin filtrar": Radix no admite "". */
const TODOS = "all";

const SupplierPaymentsFilterBar = ({
  search,
  onSearchChange,
  suppliers,
  filters,
  onSupplierChange,
  onStatusChange,
}: SupplierPaymentsFilterBarProps) => {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="text"
          placeholder="Buscar servicio, cotización o proveedor..."
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <Button variant="outline" onClick={() => onSearchChange(inputValue)}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <Select
        value={filters.supplier_id ? String(filters.supplier_id) : TODOS}
        onValueChange={(value) =>
          onSupplierChange(value === TODOS ? null : Number(value))
        }
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los proveedores</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={String(supplier.id)}>
              {supplier.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? TODOS}
        onValueChange={(value) =>
          onStatusChange(
            value === TODOS
              ? null
              : (value as NonNullable<SupplierPaymentsFilters["status"]>),
          )
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los estados</SelectItem>
          <SelectItem value="PENDING">Pendiente</SelectItem>
          <SelectItem value="PARTIAL">Parcial</SelectItem>
          <SelectItem value="PAID">Pagado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SupplierPaymentsFilterBar;
