import { useState } from "react";
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
import { Plus } from "lucide-react";
import { OrderProduct, ReturnProduct } from "../../types/Returns.types";

interface DVPProductsTableProps {
    orderProducts: OrderProduct[];
    returnProducts: ReturnProduct[];
    onAddProduct: (product: OrderProduct, quantity: number) => void;
    formatCurrency: (amount: number) => string;
    isReadOnly?: boolean;
}

export const DVPProductsTable = ({
    orderProducts,
    returnProducts,
    onAddProduct,
    formatCurrency,
    isReadOnly = false,
}: DVPProductsTableProps) => {
    const [quantities, setQuantities] = useState<Record<number, number>>({});

    const isAdded = (product: OrderProduct) =>
        returnProducts.some((p) => p.product_variation_id === product.product_variation_id);

    const getQty = (product: OrderProduct) => quantities[product.product_variation_id] ?? 1;

    const handleQtyChange = (product: OrderProduct, value: string) => {
        const parsed = parseInt(value);
        const clamped = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, product.quantity);
        setQuantities((prev) => ({ ...prev, [product.product_variation_id]: clamped }));
    };

    const handleAdd = (product: OrderProduct) => {
        const qty = getQty(product);
        onAddProduct(product, qty);
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orderProducts.map((product) => {
                    const added = isAdded(product);
                    const unitPrice = product.product_price * (1 - product.product_discount / 100);
                    return (
                        <TableRow key={product.id} className={added ? "opacity-50" : ""}>
                            <TableCell>{product.product_name ?? product.variations?.products?.title ?? ""}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {product.terms?.map((t) => t.term_name).join(" / ") ?? ""}
                            </TableCell>
                            <TableCell>{product.sku ?? product.variations?.sku ?? ""}</TableCell>
                            <TableCell>{formatCurrency(unitPrice)}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={product.quantity}
                                        value={added ? "" : getQty(product)}
                                        onChange={(e) => handleQtyChange(product, e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-20"
                                        disabled={added || isReadOnly}
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        onClick={() => handleAdd(product)}
                                        disabled={added || isReadOnly}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
