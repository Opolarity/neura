import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash, Loader2 } from "lucide-react";
import placeholderImage from "@/assets/product-placeholder.png";
import { Product } from "../types/Products.types";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  selectedProducts: number[];
  onToggleProductSelection: (productId: number) => void;
  onToggleAllProductsSelection: () => void;
  onGoToProductDetail: (id: number) => void;
  onDeleteSelectedProduct: (id: number) => void;
}

const ProductsTable = ({
  products,
  loading,
  search,
  selectedProducts,
  onToggleAllProductsSelection,
  onToggleProductSelection,
  onGoToProductDetail,
  onDeleteSelectedProduct,
}: ProductsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={
                selectedProducts.length === products.length &&
                products.length > 0
              }
              onCheckedChange={() => onToggleAllProductsSelection()}
            />
          </TableHead>
          <TableHead className="w-20">Imagen</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando productos...
              </div>
            </TableCell>
          </TableRow>
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              {search
                ? "No se encontraron productos"
                : "No hay productos registrados"}
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onToggleProductSelection(product.id)}
                />
              </TableCell>
              <TableCell>
                <img
                  src={product.image || placeholderImage}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.categories}</TableCell>
              <TableCell>S/ {product.price}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {product.estatus === true && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Activo
                    </Badge>
                  )}
                  {product.estatus === false && (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      Inactivo
                    </Badge>
                  )}
                  {product.web === true && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Web
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToProductDetail(product.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSelectedProduct(product.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ProductsTable;
