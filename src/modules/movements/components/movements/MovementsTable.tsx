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
import { Eye, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import MovementDetailDialog from "./MovementDetailDialog";
import { useState } from "react";
import { Movement } from "../../types/Movements.types";
import { ComponentPermission } from "@/shared/components/component-permission";

// Checkbox, Fecha, Tipo, Categoria, Metodo de Pago, Cuenta, Sucursal, Usuario,
// Monto, Acciones. Si el rol no puede ver el detalle, la columna de Acciones no
// se pinta y este número queda uno largo: solo afecta a las filas de "cargando"
// y "no hay movimientos", y la columna sobrante colapsa a 0px porque ninguna
// otra fila la ocupa.
const COL_SPAN = 10;

// Code de la columna Acciones, en una constante para que la cabecera y la celda
// no puedan quedar con listas distintas y aparezca un th sin td o al revés.
const ACTION_CODES = ["movements.view"];

interface MovementsTableProps {
  movements: Movement[];
  loading: boolean;
  search: string;
  selectedMovements: number[];
  onToggleMovementSelection: (movementId: number) => void;
  onToggleAllMovementsSelection: () => void;
  onGoToMovementDetail: (id: number) => void;
}

const MovementsTable = ({
  movements,
  loading,
  search,
  selectedMovements,
  onToggleAllMovementsSelection,
  onToggleMovementSelection,
  onGoToMovementDetail,
}: MovementsTableProps) => {
  const [previewId, setPreviewId] = useState<number | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedMovements.length === movements.length &&
                  movements.length > 0
                }
                onCheckedChange={() => onToggleAllMovementsSelection()}
              />
            </TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Metodo de Pago</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            {/* Se envuelve el th entero y no su texto: una celda vacía sigue
                ocupando su ancho y deja un hueco muerto. */}
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableHead className="w-16">Acciones</TableHead>
            </ComponentPermission>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando movimientos...
                </div>
              </TableCell>
            </TableRow>
          ) : movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8 text-gray-500">
                {search
                  ? "No se encontraron movimientos con los filtros aplicados"
                  : "No hay movimientos registrados"}
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMovements.includes(movement.id)}
                    onCheckedChange={() => onToggleMovementSelection(movement.id)}
                  />
                </TableCell>

                <TableCell className="font-medium whitespace-nowrap">
                  {movement.date}
                </TableCell>

                <TableCell>
                  <Badge
                    className={
                      movement.type === "Ingreso"
                        ? "bg-success text-success-foreground hover:bg-success/80"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                    }
                  >
                    {movement.type === "Egreso" ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {movement.type}
                  </Badge>
                </TableCell>

                <TableCell>{movement.category}</TableCell>

                <TableCell>{movement.paymentMethod}</TableCell>

                <TableCell>{movement.businessAccount}</TableCell>

                <TableCell>{movement.branch}</TableCell>

                <TableCell>{movement.user}</TableCell>

                <TableCell
                  className={`text-right font-semibold whitespace-nowrap ${movement.type === "Ingreso"
                    ? "text-success"
                    : "text-destructive"
                    }`}
                >
                  {movement.type === "Ingreso" ? "+" : ""}
                  {movement.formattedAmount}
                </TableCell>

                <ComponentPermission codeIn={ACTION_CODES}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewId(movement.id)}
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </ComponentPermission>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <MovementDetailDialog
        movementId={previewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
};

export default MovementsTable;
