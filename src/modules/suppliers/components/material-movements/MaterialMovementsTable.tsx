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
import { formatDateDisplay } from "@/shared/utils/date";
import { Eye, Loader2, LockOpen } from "lucide-react";
import { MaterialMovement } from "../../types/materialMovements.types";

interface MaterialMovementsTableProps {
  movements: MaterialMovement[];
  loading: boolean;
  onViewDetail: (id: number) => void;
}

const MaterialMovementsTable = ({
  movements,
  loading,
  onViewDetail,
}: MaterialMovementsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Material</TableHead>
          <TableHead>Clase</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          {/* Sin columna de origen: cabe en el detalle, y ahi ademas lleva al
              origen. Aqui ocupaba dos lineas por fila para repetir un dato que
              no se puede pulsar. */}
          <TableHead className="w-6 px-0" />
          <TableHead>Tipo movimiento</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead className="w-16">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && movements.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando movimientos...
              </div>
            </TableCell>
          </TableRow>
        ) : movements.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="text-center py-8 text-muted-foreground"
            >
              No se encontraron movimientos
            </TableCell>
          </TableRow>
        ) : (
          movements.map((movement) => (
            <TableRow key={movement.movementId}>
              {/* Solo el nombre. La unidad se pegaba detras y esta en el
                  detalle, junto al resto de datos del material. */}
              <TableCell className="font-medium text-sm">
                {movement.materialName}
              </TableCell>

              <TableCell>
                {movement.materialClassName ? (
                  <Badge variant="secondary">{movement.materialClassName}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>

              <TableCell className="text-right">
                {/* El signo es la dirección: entra o sale. */}
                <Badge
                  variant={movement.quantity > 0 ? "success" : "destructive-soft"}
                >
                  {movement.quantity > 0 ? "+" : ""}
                  {movement.quantity}
                </Badge>
              </TableCell>

              {/* Pendiente, como en los movimientos de producto: un icono en
                  su propia columna estrecha, no una etiqueta de estado. */}
              <TableCell className="w-6 px-0">
                {!movement.completed && (
                  <span
                    title="Movimiento pendiente"
                    aria-label="Movimiento pendiente"
                    className="text-warning inline-flex"
                  >
                    <LockOpen className="h-4 w-4" />
                  </span>
                )}
              </TableCell>

              <TableCell className="text-sm">{movement.movementType}</TableCell>
              <TableCell className="text-sm">{movement.warehouse}</TableCell>

              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDateDisplay(movement.date)}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {movement.user}
              </TableCell>

              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(movement.movementId)}
                  title="Ver detalle"
                >
                  <Eye className="w-4 h-4" />
                  <span className="sr-only">Ver detalle</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default MaterialMovementsTable;
