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

interface BarcodeListTableProps {
  items: BarcodeListItem[];
  loading: boolean;
  onReprint: (item: BarcodeListItem) => void;
}

const BarcodeListTable = ({ items, loading, onReprint }: BarcodeListTableProps) => {
  return (
    <div className="relative border rounded-md">
      {loading && items.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
            <TableHead className="w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando códigos de barra...
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
                {new Date(item.createdAt).toLocaleDateString("es-PE")}
              </TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BarcodeListTable;
