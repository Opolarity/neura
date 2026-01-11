import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { InventoryItem, Warehouse } from "../../inventory.types";

interface InventoryTableProps {
    inventory: InventoryItem[];
    warehouses: Warehouse[];
    isEditing: boolean;
    getStockValue: (variationId: number, warehouseId: number, originalStock: number) => number;
    getDefectsValue: (variationId: number, originalDefects: number) => number;
    handleStockChange: (variationId: number, warehouseId: number, value: string) => void;
    handleDefectsChange: (variationId: number, value: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
    inventory,
    warehouses,
    isEditing,
    getStockValue,
    getDefectsValue,
    handleStockChange,
    handleDefectsChange,
}) => {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variación</TableHead>
                        <TableHead className="bg-destructive/10 text-destructive">
                            Fallidos
                        </TableHead>
                        {warehouses.map((warehouse) => (
                            <TableHead key={warehouse.id}>{warehouse.name}</TableHead>
                        ))}
                        <TableHead>Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.map((item) => {
                        const total = item.stock_by_warehouse.reduce((sum, stock) => {
                            const value = getStockValue(
                                item.variation_id,
                                stock.warehouse_id,
                                stock.stock
                            );
                            return sum + value;
                        }, 0);

                        return (
                            <TableRow key={item.variation_id}>
                                <TableCell className="font-mono text-sm">
                                    {item.sku}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {item.product_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {item.variation_name}
                                </TableCell>
                                <TableCell className="bg-destructive/5">
                                    {(() => {
                                        const warehouse1Stock = item.stock_by_warehouse.find(
                                            (s) => s.warehouse_id === 1
                                        );
                                        const defects = warehouse1Stock?.defects || 0;
                                        return (
                                            <Input
                                                type="number"
                                                min="0"
                                                value={getDefectsValue(
                                                    item.variation_id,
                                                    defects
                                                )}
                                                onChange={(e) =>
                                                    handleDefectsChange(
                                                        item.variation_id,
                                                        e.target.value
                                                    )
                                                }
                                                onWheel={(e) => e.currentTarget.blur()}
                                                disabled={!isEditing}
                                                className="w-24 bg-destructive/10 border-destructive/20 focus-visible:ring-destructive/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        );
                                    })()}
                                </TableCell>
                                {item.stock_by_warehouse.map((stock) => (
                                    <TableCell key={stock.warehouse_id}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={getStockValue(
                                                item.variation_id,
                                                stock.warehouse_id,
                                                stock.stock
                                            )}
                                            onChange={(e) =>
                                                handleStockChange(
                                                    item.variation_id,
                                                    stock.warehouse_id,
                                                    e.target.value
                                                )
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
        </div>
    );
};
