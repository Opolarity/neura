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

interface InventoryTableProps {
  inventory: Inventory[];
  warehouses: Warehouse[];
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
            <TableHead key={warehouse.id}>{warehouse.name}</TableHead>
          ))}
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => {
          const total = item.stock_by_warehouse.reduce((sum, stock) => {
            const value = getStockValue(item, stock.id, stock.stock || 0);
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
              {item.stock_by_warehouse.map((stock) => (
                <TableCell key={stock.id}>
                  <Input
                    type="number"
                    min="0"
                    value={getStockValue(item, stock.id, stock.stock)}
                    onChange={(e) =>
                      handleStockChange(item, stock.id, e.target.value)
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    disabled={!isEditing}
                    className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </TableCell>
              ))}
              <TableCell className="font-semibold">{total}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default InventoryTable;
