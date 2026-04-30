import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { OrderProduct } from "../../types/Returns.types";

interface OrderProductsInfoTableProps {
    orderProducts: OrderProduct[];
    formatCurrency: (amount: number) => string;
}

export const OrderProductsInfoTable = ({ orderProducts, formatCurrency }: OrderProductsInfoTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orderProducts.map((product) => {
                    const unitPrice = product.product_price * (1 - product.product_discount / 100);
                    return (
                        <TableRow key={product.id}>
                            <TableCell>{product.product_name ?? product.variations?.products?.title ?? ""}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {product.terms?.map((t) => t.term_name).join(" / ") ?? ""}
                            </TableCell>
                            <TableCell>{product.sku ?? product.variations?.sku ?? ""}</TableCell>
                            <TableCell>{formatCurrency(unitPrice)}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(unitPrice * product.quantity)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
