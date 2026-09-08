import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  FranchiseStockRow,
  FranchiseWarehouse,
} from "../../types/FranchiseStock.types";

interface FranchiseStockTableProps {
  rows: FranchiseStockRow[];
  warehouses: FranchiseWarehouse[];
  loading: boolean;
  /** Sin franquiciado elegido la tabla no pide datos: muestra la invitación. */
  hasFranchisee: boolean;
}

const FranchiseStockTable = ({
  rows,
  warehouses,
  loading,
  hasFranchisee,
}: FranchiseStockTableProps) => {
  // SKU + Producto + Variación + Total
  const colSpan = warehouses.length + 4;

  const renderMessage = (message: string, withSpinner = false) => (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center text-muted-foreground py-8"
      >
        {withSpinner ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {message}
          </div>
        ) : (
          message
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Variación</TableHead>
          {warehouses.map((warehouse) => (
            <TableHead
              key={warehouse.id}
              className="text-center whitespace-nowrap"
            >
              {warehouse.name}
            </TableHead>
          ))}
          <TableHead className="text-center">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!hasFranchisee
          ? renderMessage("Selecciona un franquiciado para ver su stock")
          : loading
            ? renderMessage("Cargando stock...", true)
            : rows.length === 0
              ? renderMessage(
                  "Este franquiciado no tiene productos de Overtake registrados",
                )
              : rows.map((row) => (
                  <TableRow key={row.variationId}>
                    <TableCell className="font-mono text-sm">
                      {row.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.productName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.variationName}
                    </TableCell>
                    {warehouses.map((warehouse) => {
                      const cell = row.stockByWarehouse.find(
                        (s) => s.id === warehouse.id,
                      );
                      const stock = cell?.stock ?? 0;
                      const virtual = cell?.stockVirtual ?? 0;

                      return (
                        <TableCell
                          key={warehouse.id}
                          className="text-center tabular-nums"
                        >
                          <span
                            className={
                              stock === 0 ? "text-muted-foreground" : undefined
                            }
                          >
                            {stock}
                          </span>
                          {/* El virtual solo se muestra cuando difiere del
                              físico: si son iguales (el caso normal) repetir el
                              número en cada celda es ruido. Distinto significa
                              que hay salidas pendientes de completar. */}
                          {virtual !== stock && (
                            <span
                              className="ml-1 text-xs text-muted-foreground"
                              title={`Disponible ${virtual}: hay salidas pendientes de completar`}
                            >
                              ({virtual})
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold tabular-nums">
                      {row.stockTotal}
                    </TableCell>
                  </TableRow>
                ))}
      </TableBody>
    </Table>
  );
};

export default FranchiseStockTable;
