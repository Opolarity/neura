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
import { Trash2, X } from "lucide-react";
import { SelectedRequestProduct } from "../../types/MovementRequests.types";
import { cn } from "@/shared/utils/utils";
import { Badge } from "@/components/ui/badge";

interface CRequestProductTableProps {
  products: SelectedRequestProduct[];
  sourceWarehouseName: string;
  myWarehouseName: string;
  onQuantityChange: (variationId: number, value: string) => void;
  onRemoveProduct: (variationId: number) => void;
  isEditMode?: boolean;
  isSourceWarehouseUser?: boolean;
  onToggleDisapprove?: (variationId: number) => void;
  readOnly?: boolean;
}

const CRequestProductTable = ({
  products,
  sourceWarehouseName,
  myWarehouseName,
  onQuantityChange,
  onRemoveProduct,
  isEditMode = false,
  isSourceWarehouseUser = false,
  onToggleDisapprove,
  readOnly = false,
}: CRequestProductTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="text-center">Variación</TableHead>
          <TableHead className="text-center">Inventario {sourceWarehouseName}</TableHead>
          <TableHead className="text-center">Cantidad Solicitar</TableHead>
          <TableHead className="text-center">Inventario {myWarehouseName}</TableHead>
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
            const isDisapproved = product.disapproved === true;

            return (
              <TableRow key={product.variationId} className={cn(isDisapproved && "opacity-60")}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.productTitle}</span>
                    {isDisapproved && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Desaprobado</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {termsDisplay || "-"} ({product.sku})
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    className="bg-muted text-center"
                    disabled
                    value={product.sourceStock}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    value={isDisapproved ? "0" : (product.quantity === null ? "" : String(product.quantity))}
                    onChange={(e) =>
                      onQuantityChange(product.variationId, e.target.value)
                    }
                    placeholder="0"
                    className={cn("text-center", (isDisapproved || readOnly) && "bg-muted")}
                    disabled={isDisapproved || readOnly}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    className="bg-muted text-center"
                    disabled
                    value={product.myStock}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {readOnly ? null : isEditMode ? (
                    isSourceWarehouseUser && onToggleDisapprove ? (
                      <Button
                        variant={isDisapproved ? "destructive" : "ghost"}
                        size="icon"
                        onClick={() => onToggleDisapprove(product.variationId)}
                        title={isDisapproved ? "Quitar desaprobación" : "Desaprobar producto"}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveProduct(product.variationId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default CRequestProductTable;
