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
import { Trash2 } from "lucide-react";
import { OrderProduct, ReturnProduct } from "../../types/Returns.types";

interface ReturnProductsTableProps {
    orderProducts: OrderProduct[];
    returnProducts: ReturnProduct[];
    onQuantityChange: (product: OrderProduct, quantity: number) => void;
    isDVT: boolean;
    isDVP?: boolean;
    onRemoveProduct?: (variationId: number) => void;
    formatCurrency: (amount: number) => string;
}

export const ReturnProductsTable = ({
    orderProducts,
    returnProducts,
    onQuantityChange,
    isDVT,
    isDVP = false,
    onRemoveProduct,
    formatCurrency
}: ReturnProductsTableProps) => {
    // In DVP mode, we render only returnProducts rows (not all orderProducts)
    const rows = isDVP
        ? returnProducts.map((rp) => {
              const op = orderProducts.find((o) => o.product_variation_id === rp.product_variation_id);
              return { returnProduct: rp, orderProduct: op };
          })
        : orderProducts.map((op) => ({
              returnProduct: returnProducts.find((p) => p.product_variation_id === op.product_variation_id),
              orderProduct: op,
          }));

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
                    {isDVP && <TableHead>Acciones</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={isDVP ? 8 : 7} className="text-center text-muted-foreground py-6">
                            Sin productos agregados
                        </TableCell>
                    </TableRow>
                )}
                {rows.map(({ returnProduct, orderProduct }) => {
                    if (!orderProduct) return null;
                    const unitPrice = orderProduct.product_price * (1 - orderProduct.product_discount / 100);

                    return (
                        <TableRow key={orderProduct.id}>
                            <TableCell>{orderProduct.product_name ?? orderProduct.variations?.products?.title ?? ''}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{orderProduct.terms?.map(t => t.term_name).join(' / ') ?? ''}</TableCell>
                            <TableCell>{orderProduct.sku ?? orderProduct.variations?.sku ?? ''}</TableCell>
                            <TableCell>{formatCurrency(unitPrice)}</TableCell>
                            <TableCell>{orderProduct.quantity}</TableCell>
                            <TableCell>
                                {isDVP ? (
                                    <span>{returnProduct?.quantity ?? 0}</span>
                                ) : (
                                    <Input
                                        type="number"
                                        min="0"
                                        max={orderProduct.quantity}
                                        value={returnProduct?.quantity || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            onQuantityChange(orderProduct, Math.min(val, orderProduct.quantity));
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-24"
                                        disabled={isDVT}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                {formatCurrency((returnProduct?.quantity || 0) * unitPrice)}
                            </TableCell>
                            {isDVP && (
                                <TableCell>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => onRemoveProduct?.(orderProduct.product_variation_id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-white" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
