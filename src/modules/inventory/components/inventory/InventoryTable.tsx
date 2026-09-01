import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inventory, Warehouse } from "../../types/Inventory.types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface InventoryTableProps {
  inventory: Inventory[];
  warehouses: Warehouse[];
  loading: boolean;
  isEditing: boolean;
  getStockValue: (
    item: Inventory,
    warehouseId: number,
    originalStock: number,
  ) => string | number;
  handleStockChange: (
    item: Inventory,
    warehouseId: number,
    value: string,
  ) => void;
}

const InventoryTable = ({
  inventory,
  warehouses,
  loading,
  isEditing,
  getStockValue,
  handleStockChange,
}: InventoryTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Variación</TableHead>
          {warehouses.map((warehouse) => (
            <TableHead key={warehouse.id} className="text-center whitespace-nowrap">{warehouse.name}</TableHead>
          ))}
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={warehouses.length + 4} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando inventario...
              </div>
            </TableCell>
          </TableRow>
        ) : inventory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={warehouses.length + 4} className="text-center text-muted-foreground py-8">
              No se encontraron productos en el inventario
            </TableCell>
          </TableRow>
        ) : inventory.map((item) => {
          const total = warehouses.reduce((sum, warehouse) => {
            const stock = item.stock_by_warehouse.find(
              (s) => s.id === warehouse.id
            );

            const baseValue = stock?.stock ?? null;
            const value = getStockValue(item, warehouse.id, baseValue);

            const numericValue =
              value === "" ? 0 : typeof value === "string" ? 0 : value;

            return sum + numericValue;
          }, 0);

          return (
            <TableRow key={item.variation_id}>
              <TableCell className="font-mono text-sm">{item.sku}</TableCell>
              <TableCell className="font-medium">{item.product_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.variation_name}
              </TableCell>
              {warehouses.map((warehouse) => {
                // Buscamos si el producto ya tiene stock en este almacén
                const stockRecord = item.stock_by_warehouse.find(s => s.id === warehouse.id);
                const baseValue = stockRecord?.stock ?? null; // Si no existe registro, el valor es null (vacío)

                return (
                  <TableCell key={warehouse.id} className="text-center">
                    <div className="mx-auto flex w-fit items-stretch rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input
                        type="number"
                        value={getStockValue(item, warehouse.id, baseValue)}
                        onChange={(e) => handleStockChange(item, warehouse.id, e.target.value)}
                        min="0"
                        onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                        onWheel={(e) => e.currentTarget.blur()}
                        disabled={!isEditing}
                        className="w-20 rounded-r-none border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Input
                        type="number"
                        value={stockRecord?.stock_virtual ?? 0}
                        disabled
                        className="w-20 rounded-l-none border-0 border-l border-input text-center bg-muted/50 text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="font-semibold">
                <div className="flex items-center gap-2">
                  <span>{total}</span>
                  {/*
                    T-269 · El badge sigue al dato del SP (is_low_stock), NO a
                    `total`: esa suma es local (solo los almacenes filtrados,
                    con stock virtual) y además se recalcula en vivo desde los
                    inputs editables, así que parpadearía con cada tecla.
                    ASIMETRÍA DECLARADA: con un almacén filtrado el badge sigue
                    siendo global y la columna Total es local.
                  */}
                  {item.stock_global_prd === 0 ? (
                    <Badge
                      variant="destructive-soft"
                      title="Sin stock vendible en ningún almacén activo"
                    >
                      Sin stock
                    </Badge>
                  ) : item.is_low_stock ? (
                    <Badge
                      variant="warning"
                      title={`Stock global bajo el umbral: ${item.stock_global_prd} unidades en todos los almacenes activos`}
                    >
                      Stock bajo
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default InventoryTable;