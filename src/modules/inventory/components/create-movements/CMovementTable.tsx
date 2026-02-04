import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SelectedProduct } from "../../types/Movements.types";
import { Types } from "@/shared/types/type";

interface CMovementTableProps {
  movementType: Types;
  productStatusTypes: Types[];
  products: SelectedProduct[];
  onQuantityChange: (productId: number,
    originTypeId: number,
    value: string,) => void;
  onSelectedProductStock: (productId: number,
    originTypeId: number,
    typeId: string | null) => void;
}

const CMovementTable = ({
  movementType,
  productStatusTypes,
  products,
  onQuantityChange,
  onSelectedProductStock
}: CMovementTableProps) => {



  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className=" text-center">Producto</TableHead>
          <TableHead className=" text-center">Cantidad Actual</TableHead>
          <TableHead className=" text-center">Cantidad Ingresar</TableHead>
          {movementType?.code === "TRS" && (
            <>
              <TableHead>Tipo de Inventario</TableHead>
              <TableHead>Nuevo Stock</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={`${product.variationId}-${product.originType.id}`}>
            <TableCell>
              <div className="flex flex-col gap-2">
                <span className="font-medium">{product.productTitle}</span>
                <span className="text-xs text-muted-foreground">
                  {product.originType.name}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <Input placeholder={product.stock.toString()} className="bg-muted" disabled />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <Input
                  value={
                    product.quantity === null
                      ? ""
                      : String(product.quantity)
                  }
                  onChange={(e) => onQuantityChange(product.variationId, product.originType.id, e.target.value)}
                  placeholder="0"
                />
              </div>
            </TableCell>

            {movementType?.code === "TRS" && (
              <>
                <TableCell>
                  <div className="flex flex-col">
                    <Select
                      value={
                        product.destinationType?.id.toString() || "none"
                      }
                      onValueChange={(v) =>
                        onSelectedProductStock(
                          product.variationId,
                          product.originType.id,
                          v,
                        )
                      }
                    >
                      <SelectTrigger id="stock-type" aria-labelledby="stock-type">
                        <SelectValue placeholder="Seleccione un tipo"></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Seleccione un tipo
                        </SelectItem>
                        {productStatusTypes
                          .filter(
                            (typeMS) => typeMS.id !== product.originType.id,
                          )
                          .map((typeMS) => (
                            <SelectItem
                              key={typeMS.id}
                              value={typeMS.id.toString()}
                            >
                              {typeMS.name}
                            </SelectItem>
                          ))}

                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>

                <TableCell>{product.destinationTypeStock || "0"}</TableCell>
              </>
            )}

          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CMovementTable;
