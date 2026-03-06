import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SelectedRequestProduct } from "../../types/MovementRequests.types";

interface SendProductTableProps {
  products: SelectedRequestProduct[];
  myWarehouseName: string;
  destWarehouseName: string;
  onQuantityChange: (variationId: number, value: string) => void;
  onRemoveProduct: (variationId: number) => void;
}

const SendProductTable = ({
  products,
  myWarehouseName,
  destWarehouseName,
  onQuantityChange,
  onRemoveProduct,
}: SendProductTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="text-center">Variación</TableHead>
          <TableHead className="text-center">Mi Inventario ({myWarehouseName})</TableHead>
          <TableHead className="text-center">Cantidad a Enviar</TableHead>
          <TableHead className="text-center">Inventario {destWarehouseName}</TableHead>
          <TableHead className="text-center w-[60px]">Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No hay productos seleccionados. Busca y agrega productos.
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => {
            const termsDisplay = product.terms.map((t) => t.name).join(" / ");
            return (
              <TableRow key={product.variationId}>
                <TableCell>
                  <span className="font-medium">{product.productTitle}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {termsDisplay || "-"} ({product.sku})
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Input className="bg-muted text-center" disabled value={product.sourceStock} />
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    value={product.quantity === null ? "" : String(product.quantity)}
                    onChange={(e) => onQuantityChange(product.variationId, e.target.value)}
                    placeholder="0"
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Input className="bg-muted text-center" disabled value={product.myStock} />
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onRemoveProduct(product.variationId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default SendProductTable;
