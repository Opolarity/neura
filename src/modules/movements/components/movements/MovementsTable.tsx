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
import { Movement } from "../../types/Movements.types";

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
  return (
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
          {/* <TableHead className="w-16">Acciones</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && movements.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando movimientos...
              </div>
            </TableCell>
          </TableRow>
        ) : movements.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                  variant={
                    movement.type === "Ingreso" ? "default" : "destructive"
                  }
                  className={movement.type === "Ingreso" ? "bg-green-500" : "bg-red-500"}
                >
                  {movement.type === "Egreso" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
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
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {movement.type === "Ingreso" ? "+" : "-"}
                {movement.formattedAmount}
              </TableCell>

              {/* <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoToMovementDetail(movement.id)}
                  title="Ver detalle"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell> */}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default MovementsTable;
