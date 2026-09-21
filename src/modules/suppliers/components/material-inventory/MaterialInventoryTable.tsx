import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  MaterialInventoryRow,
  MaterialInventoryWarehouse,
} from "../../types/materialInventory.types";

interface MaterialInventoryTableProps {
  rows: MaterialInventoryRow[];
  columns: MaterialInventoryWarehouse[];
  loading: boolean;
  /** Con las casillas abiertas se teclea; cerradas, solo se lee. */
  isEditing: boolean;
  getStockValue: (
    materialId: number,
    warehouseId: number,
    base: number | undefined,
  ) => string;
  handleStockChange: (
    materialId: number,
    warehouseId: number,
    value: string,
  ) => void;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Una fila por material y una columna por almacén, igual que la lista de
 * inventario de productos.
 *
 * Las columnas las manda el backend ya filtradas: pedir «mis inventarios» y
 * seguir viendo las de los talleres sería no haber filtrado nada.
 */
const MaterialInventoryTable = ({
  rows,
  columns,
  loading,
  isEditing,
  getStockValue,
  handleStockChange,
}: MaterialInventoryTableProps) => {
  // Material, Clase, U/M y Total, más una por almacén.
  const colSpan = columns.length + 4;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Material</TableHead>
          <TableHead>Clase</TableHead>
          <TableHead>U/M</TableHead>
          {columns.map((warehouse) => (
            <TableHead key={warehouse.id} className="text-center">
              <div>{warehouse.name}</div>
              {/* De quién es. Sin esto, dos talleres con el almacén llamado
                  «ALMACÉN PRINCIPAL» dan dos columnas indistinguibles. */}
              <div className="text-muted-foreground text-xs font-normal">
                {warehouse.owner === "supplier"
                  ? (warehouse.supplierName ?? "Proveedor")
                  : "Propio"}
              </div>
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando inventario...
              </div>
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={colSpan}
              className="text-center text-muted-foreground py-8"
            >
              No se encontraron materiales en el inventario
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            // El total se suma AQUÍ y no se lee del backend: mientras se
            // edita tiene que seguir a lo tecleado, o diría una cosa y las
            // celdas otra. Sobre las columnas visibles, que son las que el
            // filtro dejó -- el total del SP está filtrado igual.
            const total = columns.reduce((suma, warehouse) => {
              const valor = Number(
                getStockValue(
                  row.materialId,
                  warehouse.id,
                  row.stockByWarehouse[warehouse.id],
                ),
              );
              return suma + (Number.isFinite(valor) ? valor : 0);
            }, 0);

            return (
            <TableRow key={row.materialId}>
              <TableCell className="font-medium">{row.materialName}</TableCell>
              <TableCell>
                {row.materialClassName ? (
                  <Badge variant="secondary">{row.materialClassName}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.measurementUnit || "—"}
              </TableCell>

              {columns.map((warehouse) => {
                const stock = row.stockByWarehouse[warehouse.id];
                return (
                  <TableCell key={warehouse.id} className="p-2">
                    {/* Una casilla por almacén, igual que el inventario de
                        productos. Sin fila en material_stock el saldo es CERO
                        y así se dice: el guion que había dejaba la duda de si
                        era cero o «no se sabe», y aquí siempre se sabe.

                        Se teclea el saldo que DEBE QUEDAR, no la diferencia:
                        el backend apunta el ajuste. */}
                    <Input
                      type="number"
                      step="0.001"
                      className="h-8 text-right tabular-nums"
                      value={getStockValue(row.materialId, warehouse.id, stock)}
                      onChange={(event) =>
                        handleStockChange(
                          row.materialId,
                          warehouse.id,
                          event.target.value,
                        )
                      }
                      onWheel={(event) => event.currentTarget.blur()}
                      disabled={!isEditing}
                      aria-label={`Stock de ${row.materialName} en ${warehouse.name}`}
                    />
                  </TableCell>
                );
              })}

              <TableCell className="text-right font-semibold tabular-nums">
                <span className={total < 0 ? "text-destructive" : undefined}>
                  {fmt(total)}
                </span>
              </TableCell>
            </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default MaterialInventoryTable;
