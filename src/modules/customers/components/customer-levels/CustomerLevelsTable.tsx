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
import type { CustomerLevel } from "@/modules/customers/types/customerLevels.types";

// Codes de la columna Acciones. En una constante para que la cabecera y las
// celdas no puedan quedar con listas distintas y aparezca un th sin td.
const ACTION_CODES = ["customer_levels.edit", "customer_levels.delete"];

interface CustomerLevelsTableProps {
  levels: CustomerLevel[];
  isLoading: boolean;
  error: boolean;
  onEdit: (level: CustomerLevel) => void;
  onDelete: (level: CustomerLevel) => void;
}

// El rango se muestra inclusivo (0 – 149), aunque en la BD el tope se guarda
// exclusivo ([min, max)): de ahi el max_points - 1. Sin tope => infinito.
const formatRange = (level: CustomerLevel): string => {
  const to = level.maxPoints === null ? "∞" : String(level.maxPoints - 1);
  return `${level.minPoints} – ${to}`;
};

export default function CustomerLevelsTable({ levels, isLoading, error, onEdit, onDelete }: CustomerLevelsTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando niveles...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8 text-destructive">
            No se pudieron cargar los niveles.
          </TableCell>
        </TableRow>
      );
    }

    if (levels.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
            No hay niveles registrados.
          </TableCell>
        </TableRow>
      );
    }

    return levels.map((level) => (
      <TableRow key={level.id} className={level.active ? undefined : "opacity-60"}>
        <TableCell className="font-mono text-muted-foreground">{level.sortOrder}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded-full border"
              style={{ backgroundColor: level.color ?? "transparent" }}
            />
            {level.name}
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">{formatRange(level)}</TableCell>
        <TableCell>{level.discountPct}%</TableCell>
        <TableCell>{level.active ? "Activo" : "Inactivo"}</TableCell>
        {/* Se envuelve la celda entera, no su contenido: un th/td vacío sigue
            ocupando ancho. Basta una de las dos acciones para que la columna
            tenga sentido. */}
        <ComponentPermission codeIn={ACTION_CODES}>
          <TableCell>
            <div className="flex gap-2">
              <ComponentPermission codeIn={["customer_levels.edit"]}>
                <Button variant="outline" size="sm" onClick={() => onEdit(level)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </ComponentPermission>
              <ComponentPermission codeIn={["customer_levels.delete"]}>
                <Button variant="destructive" size="sm" disabled={!level.active} onClick={() => onDelete(level)}>
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
          <TableHead className="w-16">Orden</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Rango de puntos</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Estado</TableHead>
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead>Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  );
}
