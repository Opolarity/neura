import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOption, UsersFilters } from "../../types/Users.types";
import { useState, useEffect } from "react";

interface UsersFilterModalProps {
  filters: UsersFilters;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: UsersFilters) => void;
  rolesOptions: FilterOption[];
  warehousesOptions: FilterOption[];
  branchesOptions: FilterOption[];
}

const UsersFilterModal = ({
  filters,
  isOpen,
  onClose,
  onApply,
  rolesOptions = [],
  warehousesOptions = [],
  branchesOptions = [],
}: UsersFilterModalProps) => {
  const [internalFilters, setInternalFilters] = useState<UsersFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleSelectChange = (key: keyof UsersFilters, value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      [key]: value === "none" ? null : value,
    }));
  };

  const handleIdChange = (key: keyof UsersFilters, value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      [key]: value === "none" ? null : parseInt(value),
    }));
  };

  const handleClear = () => {
    setInternalFilters((prev) => ({
      ...prev,
      person_type: null,
      show: null,
      role: null,
      warehouses: null,
      branches: undefined,
      order: undefined,
      page: 1,
      size: prev.size,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Usuarios</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="person_type">Tipo de Persona</Label>
            <Select
              value={internalFilters.person_type?.toString() || "none"}
              onValueChange={(val) => handleIdChange("person_type", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                <SelectItem value="1">Natural</SelectItem>
                <SelectItem value="2">Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={internalFilters.role?.toString() || "none"}
              onValueChange={(val) => handleIdChange("role", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos los roles</SelectItem>
                {rolesOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id.toString()}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="warehouses">Almacén</Label>
            <Select
              value={internalFilters.warehouses?.toString() || "none"}
              onValueChange={(val) => handleIdChange("warehouses", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos los almacenes</SelectItem>
                {warehousesOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id.toString()}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branches">Sucursal</Label>
            <Select
              value={internalFilters.branches?.toString() || "none"}
              onValueChange={(val) => handleIdChange("branches", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todas las sucursales</SelectItem>
                {branchesOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id.toString()}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply?.(internalFilters)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersFilterModal;
