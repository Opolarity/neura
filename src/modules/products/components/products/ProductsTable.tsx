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
import { ComponentPermission } from "@/shared/components/component-permission";
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

// Checkbox, ID, Imagen, Producto, Categoría, Precio, Stock, Estado, Acciones.
// Si el rol no puede borrar, la columna de selección no se pinta y este número
// queda uno largo: solo afecta a la fila de "no hay productos", y la columna
// sobrante colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 9;

// Codes de la columna Acciones. En una constante para que la cabecera y las
// celdas no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["products.view", "products.edit", "products.delete"];

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
    <div className="relative h-full">
      {loading && products.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {/* Se envuelve la celda entera y no solo el Checkbox: un th/td
                vacío sigue ocupando su ancho y deja un hueco muerto. La
                selección solo alimenta el borrado masivo, de ahí el code. */}
            <ComponentPermission codeIn={["products.delete"]}>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedProducts.length === products.length &&
                    products.length > 0
                  }
                  onCheckedChange={() => onToggleAllProductsSelection()}
                />
              </TableHead>
            </ComponentPermission>
            <TableHead className="w-16">ID</TableHead>
            <TableHead className="w-20">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Estado</TableHead>
            {/* Basta con tener UNA de las tres acciones para que la columna
                tenga sentido; cada botón de dentro lleva su propio code. Sin
                ninguna, se omite la celda entera para no dejar el hueco. */}
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableHead>Acciones</TableHead>
            </ComponentPermission>
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
                <ComponentPermission codeIn={["products.delete"]}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() =>
                        onToggleProductSelection(product.id)
                      }
                    />
                  </TableCell>
                </ComponentPermission>
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
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {product.estatus === true && (
                      <Badge variant="success">
                        Activo
                      </Badge>
                    )}
                    {product.estatus === false && (
                      <Badge variant="destructive">
                        Inactivo
                      </Badge>
                    )}
                    {product.web === true && (
                      <Badge variant="success">
                        Web
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <ComponentPermission codeIn={ACTION_CODES}>
                  <TableCell>
                    <div className="flex gap-2">
                      <ComponentPermission codeIn={["products.view"]}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProduct(product.id)}
                          title="Ver producto"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </ComponentPermission>
                      <ComponentPermission codeIn={["products.edit"]}>
                        <a
                          href={`/products/edit/${product.id}`}
                          title="Editar producto"
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </a>
                      </ComponentPermission>
                      <ComponentPermission codeIn={["products.delete"]}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteClick(product)}
                          title="Eliminar producto"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </ComponentPermission>
                    </div>
                  </TableCell>
                </ComponentPermission>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
