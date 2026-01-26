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
                    const total = warehouses.reduce((sum, warehouse) => {
                        const stock = item.stock_by_warehouse.find(
                            (s) => s.id === warehouse.id
                        );

                        const baseValue = stock?.stock ?? 0;
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
                                const stock = item.stock_by_warehouse.find(
                                    (s) => s.id === warehouse.id
                                );

                                const stockValue = stock?.stock ?? 0;

                                return (
                                    <TableCell key={warehouse.id}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={getStockValue(item, warehouse.id, stockValue)}
                                            onChange={(e) =>
                                                handleStockChange(item, warehouse.id, e.target.value)
                                            }
                                            onWheel={(e) => e.currentTarget.blur()}
                                            disabled={!isEditing}
                                            className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </TableCell>
                                );
                            })}
                            <TableCell className="font-semibold">{total}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default InventoryTable;