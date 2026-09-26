import { Loader2, SquarePen } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Material } from "../../types/materials.types";
import placeholderImage from "@/assets/product-placeholder.png";

interface MaterialsTableProps {
  materials: Material[];
  loading: boolean;
  onEdit: (material: Material) => void;
}

const formatCost = (value: number | null) =>
  value === null ? "—" : value.toFixed(2);

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString() : "—";

export const MaterialsTable = ({
  materials,
  loading,
  onEdit,
}: MaterialsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead className="w-20">Imagen</TableHead>
          <TableHead>Nombre</TableHead>
          {/* La raíz --TELA o AVIOS-- y la hoja, que con el árbol es el
              color. La hoja sola dice «DENIM» y no distingue una tela de un
              avío; la raíz sola no distingue un jersey denim de otro. */}
          <TableHead>Clase</TableHead>
          <TableHead>Subclase</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead>Unidad</TableHead>
          <TableHead className="text-right">Costo unit.</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && materials.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando materiales...
              </div>
            </TableCell>
          </TableRow>
        ) : materials.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center text-muted-foreground p-10">
              No se encontraron materiales
            </TableCell>
          </TableRow>
        ) : (
          materials.map((material) => (
            <TableRow key={material.id}>
              <TableCell className="font-medium">{material.id}</TableCell>
              <TableCell>
                {/* La primera foto, como en productos; sin fotos, el mismo
                    placeholder para que la columna no quede a saltos. */}
                <img
                  src={material.images[0] || placeholderImage}
                  alt={material.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </TableCell>
              <TableCell>
                <div>{material.name}</div>
                {/* Cuántas variaciones tiene: con una sola es un material
                    simple y no hace falta decirlo. */}
                {material.variationsCount > 1 && (
                  <div className="text-muted-foreground text-xs">
                    {material.variationsCount} variaciones
                  </div>
                )}
              </TableCell>
              <TableCell>
                {material.materialRootClassName ? (
                  <Badge variant="secondary">
                    {material.materialRootClassName}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {/* Vacía cuando la hoja ES la raíz: un material colgado directo
                    de TELA no tiene subclase, y repetir «TELA» en las dos
                    columnas se leería como si tuviera dos. */}
                {material.materialClassName &&
                material.materialClassId !== material.materialRootClassId ? (
                  <Badge variant="outline">{material.materialClassName}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {material.suppliersCount > 1
                  ? `${material.suppliersCount} proveedores`
                  : material.supplierName || "—"}
              </TableCell>
              <TableCell className="text-right">
                {/* El stock ya no es una columna de materials: sale de sumar
                    material_stock. Se enlaza a sus movimientos porque desde
                    aqui la pregunta siguiente siempre es "y por que". */}
                <Link
                  to={`/suppliers/material-movements?material_id=${material.id}`}
                  className="font-medium hover:underline"
                  title={`Ver movimientos de ${material.name}`}
                >
                  {material.quantity}
                </Link>
              </TableCell>
              <TableCell>{material.measurementUnit || "—"}</TableCell>
              <TableCell className="text-right">
                {/* Con variaciones de precio distinto, el rango. */}
                {material.unitCostMax !== null &&
                material.unitCost !== null &&
                material.unitCostMax !== material.unitCost
                  ? `${formatCost(material.unitCost)} – ${formatCost(material.unitCostMax)}`
                  : formatCost(material.unitCost)}
              </TableCell>
              <TableCell>{formatDate(material.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(material)}
                  aria-label={`Editar ${material.name}`}
                >
                  <SquarePen className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
