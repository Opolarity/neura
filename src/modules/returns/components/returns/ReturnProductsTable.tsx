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
import { OrderProduct, ReturnProduct } from "../../types/Returns.types";

interface ReturnProductsTableProps {
    orderProducts: OrderProduct[];
    returnProducts: ReturnProduct[];
    onQuantityChange: (product: OrderProduct, quantity: number) => void;
    isDVT: boolean;
    formatCurrency: (amount: number) => string;
}

export const ReturnProductsTable = ({
    orderProducts,
    returnProducts,
    onQuantityChange,
    isDVT,
    formatCurrency
}: ReturnProductsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Cantidad Máx.</TableHead>
                    <TableHead>Cantidad a Devolver</TableHead>
                    <TableHead>Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orderProducts.map((product) => {
                    const returnProduct = returnProducts.find(
                        (p) => p.product_variation_id === product.product_variation_id
                    );
                    const unitPrice = product.product_price * (1 - product.product_discount / 100);

                    return (
                        <TableRow key={product.id}>
                            <TableCell>{product.product_name ?? product.variations?.products?.title ?? ''}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{product.terms?.map(t => t.term_name).join(' / ') ?? ''}</TableCell>
                            <TableCell>{product.sku ?? product.variations?.sku ?? ''}</TableCell>
                            <TableCell>{formatCurrency(unitPrice)}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    min="0"
                                    max={product.quantity}
                                    value={returnProduct?.quantity || 0}
                                    onChange={(e) => onQuantityChange(product, parseInt(e.target.value) || 0)}
                                    className="w-24"
                                    disabled={isDVT}
                                />
                            </TableCell>
                            <TableCell>
                                {formatCurrency((returnProduct?.quantity || 0) * unitPrice)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
