import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Class } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import {
  InventoryOwner,
  MaterialInventoryFilters,
} from "../../types/materialInventory.types";
import { SupplierOption } from "../../types/materials.types";

interface MaterialInventoryFilterModalProps {
  filters: MaterialInventoryFilters;
  warehouses: Warehouse[];
  suppliers: SupplierOption[];
  stockTypes: Class[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: MaterialInventoryFilters) => void;
}

/** Los Select de shadcn no admiten "" como valor, así que «todos» va con clave. */
const TODOS = "all";

const MaterialInventoryFilterModal = ({
  filters,
  warehouses,
  suppliers,
  stockTypes,
  isOpen,
  onClose,
  onApply,
}: MaterialInventoryFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<MaterialInventoryFilters>(filters);

  useEffect(() => {
    if (isOpen) setInternalFilters(filters);
  }, [isOpen, filters]);

  const owner = internalFilters.owner ?? "all";

  // Al pedir «mis inventarios» los del taller sobran de la lista, y al revés.
  const almacenes = warehouses.filter((w) =>
    owner === "mine"
      ? !w.supplier_id
      : owner === "supplier"
        ? Boolean(w.supplier_id)
        : true,
  );

  const parseStock = (raw: string) => {
    if (raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  /**
   * Cambiar de dueño invalida lo de abajo: un almacén propio con el filtro en
   * «proveedores» no devuelve nada y se lee como un fallo de la pantalla.
   */
  const handleOwnerChange = (value: string) =>
    setInternalFilters((prev) => ({
      ...prev,
      owner: value as InventoryOwner,
      warehouse_id: null,
      supplier_id: value === "mine" ? null : prev.supplier_id,
    }));

  /** Pedir un proveedor es pedir almacenes de proveedor: el dueño se ajusta. */
  const handleSupplierChange = (value: string) =>
    setInternalFilters((prev) => ({
      ...prev,
      supplier_id: value === TODOS ? null : Number(value),
      owner: value === TODOS ? prev.owner : "supplier",
      warehouse_id: null,
    }));

  const handleClear = () =>
    setInternalFilters({
      ...internalFilters,
      owner: "all",
      warehouse_id: null,
      supplier_id: null,
      stock_type_id: null,
      min_stock: null,
      max_stock: null,
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar inventario</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, con el max-h en un contenedor
            propio para que cabecera y footer queden fuera del scroll. Mismo
            valor que el resto de modales de filtros. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              {/* El filtro que justifica la pantalla, y por eso va primero. */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Inventarios</Label>
                <Select value={owner} onValueChange={handleOwnerChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="mine">Mis inventarios</SelectItem>
                    <SelectItem value="supplier">
                      Inventarios de proveedores
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Proveedor</Label>
                <Select
                  value={
                    internalFilters.supplier_id
                      ? String(internalFilters.supplier_id)
                      : TODOS
                  }
                  onValueChange={handleSupplierChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos los proveedores</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Almacén</Label>
                <Select
                  value={
                    internalFilters.warehouse_id
                      ? String(internalFilters.warehouse_id)
                      : TODOS
                  }
                  onValueChange={(value) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      warehouse_id: value === TODOS ? null : Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los almacenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos los almacenes</SelectItem>
                    {almacenes.map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={String(warehouse.id)}
                      >
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de stock</Label>
                <Select
                  value={
                    internalFilters.stock_type_id
                      ? String(internalFilters.stock_type_id)
                      : TODOS
                  }
                  onValueChange={(value) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      stock_type_id: value === TODOS ? null : Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos</SelectItem>
                    {stockTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contra el TOTAL del material, no contra un almacén suelto:
                  es la columna por la que se ordena y la que se compara.
                  A diferencia del de productos, aquí SÍ se admite negativo:
                  material_stock puede serlo desde la 202610010103, y un
                  negativo es el faltante por comprar -- justo lo que alguien
                  querría buscar. */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Stock total</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={internalFilters.min_stock ?? ""}
                    onChange={(e) =>
                      setInternalFilters((prev) => ({
                        ...prev,
                        min_stock: parseStock(e.target.value),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={internalFilters.max_stock ?? ""}
                    onChange={(e) =>
                      setInternalFilters((prev) => ({
                        ...prev,
                        max_stock: parseStock(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(internalFilters)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialInventoryFilterModal;
