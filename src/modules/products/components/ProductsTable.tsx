import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash, Search, Loader2, ListFilter } from "lucide-react";
import placeholderImage from "@/assets/product-placeholder.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import PageSizeSelector from "../components/PageSizeSelector";
import Pagination from "../components/Pagination";
import { Product } from "../products.types";
import ProductFilterInput from "./ProductSearchInput";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

const ProductsTable = ({
  products,
  loading,
  search,
  onSearchChange,
}: ProductsTableProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <ProductFilterInput
              value={search}
              onChange={(e) => onSearchChange(e)}
            />

            <Button className="gap-2">
              <ListFilter className="w-4 h-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
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
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
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
                      /*checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() =>
                          toggleProductSelection(product.id)
                        }*/
                      />
                    </TableCell>
                    <TableCell>
                      <img
                        src={product.image || placeholderImage}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.categories}</TableCell>
                    <TableCell>S/ {product.price}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs">
                        {"Acá va un swicth"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          //onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          //onClick={() => handleDeleteClick(product.id)}
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
        </CardContent>

        <div className="w-full flex flex-row justify-center gap-2 p-6">
          <PageSizeSelector />
          <Pagination />
        </div>
      </Card>

      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Titulo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsTable;
