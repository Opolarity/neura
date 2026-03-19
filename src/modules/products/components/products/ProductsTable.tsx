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
import { Eye, Edit, Trash, Loader2 } from "lucide-react";
import placeholderImage from "@/assets/product-placeholder.png";
import { Product } from "../../types/Products.types";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  selectedProducts: number[];
  onToggleProductSelection: (productId: number) => void;
  onToggleAllProductsSelection: () => void;
  onViewProduct: (id: number) => void;
  onDeleteClick: (product: Product) => void;
}

const ProductsTable = ({
  products,
  loading,
  search,
  selectedProducts,
  onToggleAllProductsSelection,
  onToggleProductSelection,
  onViewProduct,
  onDeleteClick,
}: ProductsTableProps) => {
  return (
    <div className="relative">
      {loading && products.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
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
            <TableHead className="w-16">ID</TableHead>
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
          {loading && products.length === 0 ? (
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
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                <TableCell className="font-mono text-muted-foreground">{product.id}</TableCell>
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
                      <Badge className="bg-green-400 hover:bg-green-400">
                        Activo
                      </Badge>
                    )}
                    {product.estatus === false && (
                      <Badge className="bg-red-400 hover:bg-red-400">
                        Inactivo
                      </Badge>
                    )}
                    {product.web === true && (
                      <Badge className="bg-green-400 hover:bg-green-400">
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
                      onClick={() => onViewProduct(product.id)}
                      title="Ver producto"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <a
                      href={`/products/edit/${product.id}`}
                      title="Editar producto"
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </a>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteClick(product)}
                      title="Eliminar producto"
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
    </div>
  );
};

export default ProductsTable;
