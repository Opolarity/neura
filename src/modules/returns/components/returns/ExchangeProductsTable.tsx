import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { ExchangeProduct, ReturnProduct } from "../../types/Returns.types";

interface ExchangeProductsTableProps {
    exchangeProducts: ExchangeProduct[];
    returnProducts: ReturnProduct[];
    onUpdateProduct: (index: number, field: string, value: any) => void;
    onRemoveProduct: (index: number) => void;
    formatCurrency: (amount: number) => string;
}

export const ExchangeProductsTable = ({
    exchangeProducts,
    returnProducts,
    onUpdateProduct,
    onRemoveProduct,
    formatCurrency
}: ExchangeProductsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Descuento %</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Vinculado a</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {exchangeProducts.map((product, index) => (
                    <TableRow key={index}>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell>{product.variation_name}</TableCell>
                        <TableCell>
                            <Input
                                type="number"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => onUpdateProduct(index, "price", parseFloat(e.target.value) || 0)}
                                className="w-24"
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => onUpdateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                                className="w-20"
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={product.discount}
                                onChange={(e) => onUpdateProduct(index, "discount", parseFloat(e.target.value) || 0)}
                                className="w-20"
                            />
                        </TableCell>
                        <TableCell>
                            {formatCurrency(product.price * (1 - product.discount / 100) * product.quantity)}
                        </TableCell>
                        <TableCell>
                            <Select
                                value={product.linked_return_index?.toString() || ""}
                                onValueChange={(v) => onUpdateProduct(index, "linked_return_index", v ? parseInt(v) : null)}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sin vincular" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Sin vincular</SelectItem>
                                    {returnProducts.map((rp, rpIndex) => (
                                        <SelectItem key={rpIndex} value={rpIndex.toString()}>
                                            {rp.product_name} (x{rp.quantity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveProduct(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
