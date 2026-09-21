import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
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
import { Loader2 } from "lucide-react";
import { MaterialPriceHistoryRow } from "../../types/materials.types";

interface MaterialPriceHistoryProps {
  rows: MaterialPriceHistoryRow[];
  loading: boolean;
}

const money = (value: number | null) =>
  value === null ? "—" : value.toFixed(2);

/**
 * Qué se ha pagado por el material y a quién.
 *
 * No hay tabla de historial: son los servicios de proveedor del material. Y la
 * fila marcada «En uso» no la elige esta pantalla — la señala el backend con
 * `materials.last_service_reference`, que es lo mismo que decide el precio y
 * el proveedor de la ficha.
 */
export const MaterialPriceHistory = ({
  rows,
  loading,
}: MaterialPriceHistoryProps) => {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cotización</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Situación</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Costo unit.</TableHead>
          <TableHead>Fecha</TableHead>
          {/* La ultima, como en todo listado del ERP. */}
          <TableHead className="w-[1%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando historial...
              </div>
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-muted-foreground py-8 text-center"
            >
              Sin órdenes de compra
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.serviceId}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {row.quotationCode ?? `#${row.quotationId}`}
                  </span>
                  {row.serviceDescription && (
                    <span className="text-muted-foreground text-xs">
                      {row.serviceDescription}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {row.supplierName || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {row.situationName || "—"}
              </TableCell>
              <TableCell className="text-right text-sm">
                {row.quantity === null ? "—" : row.quantity}
                {row.measurementUnit && (
                  <span className="text-muted-foreground"> {row.measurementUnit}</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm">
                {money(row.price)}
              </TableCell>
              <TableCell className="text-right">
                {/* El que hoy manda va marcado: sin esto, con tres
                    cotizaciones delante no se sabe cuál es el precio vigente. */}
                {row.isCurrent ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="font-medium">{money(row.unitCost)}</span>
                    <Badge variant="success">En uso</Badge>
                  </span>
                ) : (
                  money(row.unitCost)
                )}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                {row.createdAt ? formatDateDisplay(row.createdAt) : "—"}
              </TableCell>
              <TableCell>
                {/* Lleva a la orden de compra de la que sale esta fila. En
                    modo lectura: desde la ficha del material se viene a mirar
                    de dónde sale el precio, no a editar la compra. */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/quotations/view/${row.quotationId}`)
                  }
                  title={
                    row.quotationCode
                      ? `Ver la orden de compra ${row.quotationCode}`
                      : "Ver la orden de compra"
                  }
                  aria-label="Ver la orden de compra"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default MaterialPriceHistory;
