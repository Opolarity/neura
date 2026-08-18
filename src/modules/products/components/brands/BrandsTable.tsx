import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Loader2, Trash } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";
import type { Brand, EditBrandPayload } from "@/modules/products/types/Brands.types";

// Codes de la columna Acciones. En una constante para que la cabecera y las
// celdas no puedan quedar con listas distintas y aparezca un th sin td.
const ACTION_CODES = ["product_brands.edit", "product_brands.delete"];

interface BrandsTableProps {
  brands: Brand[];
  isLoading: boolean;
  error: boolean;
  onEdit: (payload: EditBrandPayload) => void;
  onDelete: (brand: Brand) => void;
}

export default function BrandsTable({ brands, isLoading, error, onEdit, onDelete }: BrandsTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando marcas...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-destructive">
            No se pudieron cargar los datos.
          </TableCell>
        </TableRow>
      );
    }

    if (brands.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
            No hay marcas registradas.
          </TableCell>
        </TableRow>
      );
    }

    return brands.map((brand) => (
      <TableRow key={brand.id}>
        <TableCell className="font-mono text-muted-foreground">{brand.id}</TableCell>
        <TableCell>{brand.name}</TableCell>
        <TableCell>{brand.code}</TableCell>
        <TableCell>{brand.products_count}</TableCell>
        <ComponentPermission codeIn={ACTION_CODES}>
          <TableCell>
            <div className="flex gap-2">
              <ComponentPermission codeIn={["product_brands.edit"]}>
                <Button variant="outline" size="sm" onClick={() => onEdit({ id: brand.id, name: brand.name, code: brand.code })}>
                  <Edit className="w-4 h-4" />
                </Button>
              </ComponentPermission>
              <ComponentPermission codeIn={["product_brands.delete"]}>
                <Button variant="destructive" size="sm" onClick={() => onDelete(brand)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </ComponentPermission>
            </div>
          </TableCell>
        </ComponentPermission>
      </TableRow>
    ));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Productos</TableHead>
          {/* Se envuelve la celda entera, no su contenido: un th/td vacío
              sigue ocupando ancho. Basta con tener UNA de las dos acciones
              para que la columna tenga sentido. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead>Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  );
}
