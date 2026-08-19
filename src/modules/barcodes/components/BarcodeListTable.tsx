import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { BarcodeListItem } from "../types/Barcodes.types";
import { formatDateDisplay } from "@/shared/utils/date";
import { ComponentPermission } from "@/shared/components/component-permission";

interface BarcodeListTableProps {
  items: BarcodeListItem[];
  loading: boolean;
  onReprint: (item: BarcodeListItem) => void;
}

// ID, Producto, Variación, SKU, Lista de Precio, Lote, Cantidad, Mov. Stock,
// Fecha, Acciones. Si el rol no puede reimprimir, la columna de Acciones no se
// pinta y este número queda uno largo: solo afecta a las filas de "cargando" y
// "no hay códigos", y la columna sobrante colapsa a 0px porque ninguna otra
// fila la ocupa.
const COL_SPAN = 10;

// Code de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["barcodes.print"];

const BarcodeListTable = ({ items, loading, onReprint }: BarcodeListTableProps) => {
  return (
    <div className="relative h-full border rounded-md">
      {loading && items.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Variación</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Lista de Precio</TableHead>
            <TableHead className="w-20">Lote</TableHead>
            <TableHead className="w-24">Cantidad</TableHead>
            <TableHead>Mov. Stock</TableHead>
            <TableHead>Fecha</TableHead>
            {/* Se envuelve el th entero y no su texto: una celda vacía sigue
                ocupando su ancho y deja un hueco muerto. */}
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableHead className="w-20">Acciones</TableHead>
            </ComponentPermission>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando códigos de barra...
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground py-8">
                No hay códigos de barras generados
              </TableCell>
            </TableRow>
          ) : null}
          {!loading && items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell className="font-medium">{item.productTitle}</TableCell>
              <TableCell>{item.variationTerms || "—"}</TableCell>
              <TableCell>{item.sku || "—"}</TableCell>
              <TableCell>{item.priceListName}</TableCell>
              <TableCell>{item.sequence}</TableCell>
              <TableCell>{item.quantities ?? "—"}</TableCell>
              <TableCell>{item.stockMovementId ?? "—"}</TableCell>
              <TableCell>
                {formatDateDisplay(item.createdAt)}
              </TableCell>
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReprint(item)}
                    title="Re-imprimir"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </ComponentPermission>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BarcodeListTable;
