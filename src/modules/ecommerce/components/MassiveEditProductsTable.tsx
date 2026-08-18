import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import placeholderImage from "@/assets/product-placeholder.png";
import { Product } from "@/modules/products/types/Products.types";

// Tabla propia de Ecommerce > Edición masiva. Antes reusaba la de Productos
// apagando columnas con hideStock/hideStatus/hideActions, pero las dos tablas
// no comparten comportamiento: allá la selección alimenta el borrado masivo y
// se oculta con products.delete; aquí es el mecanismo de la edición en lote
// (textos, imágenes, tags, canales) y tiene que estar siempre disponible para
// quien entra a la pantalla, que ya está protegida por ecommerce_bulk_edit.view.
//
// Lo que sí se comparte es la capa de datos: el hook useProducts y los tipos
// del módulo de productos.

interface MassiveEditProductsTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  selectedProducts: number[];
  onToggleProductSelection: (productId: number) => void;
  onToggleAllProductsSelection: () => void;
}

// Checkbox, ID, Imagen, Producto, Categoría, Precio.
const COL_SPAN = 6;

const MassiveEditProductsTable = ({
  products,
  loading,
  search,
  selectedProducts,
  onToggleAllProductsSelection,
  onToggleProductSelection,
}: MassiveEditProductsTableProps) => {
  return (
    <div className="relative h-full">
      {loading && products.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin" />
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando productos...
                </div>
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COL_SPAN}
                className="text-center py-8 text-muted-foreground"
              >
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
                <TableCell className="font-mono text-muted-foreground">
                  {product.id}
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MassiveEditProductsTable;
