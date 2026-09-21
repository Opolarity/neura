import { Trash2 } from "lucide-react";
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
import { taxLabel } from "@/shared/utils/tax";
import { QuotationServiceLine } from "../types/Quotations.types";

interface QuotationLinesTableProps {
  lines: QuotationServiceLine[];
  onRemove: (index: number) => void;
}

const fmt = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Las líneas añadidas a una cotización que todavía no existe.
 *
 * Solo lista y quita. Corregir una línea es quitarla y volver a añadirla, que
 * es lo que ya pasa al editar una cotización: allí la tabla tampoco deja
 * corregir desde la fila. Dejar que crear permitiera algo que editar no
 * permite sería volver a tener dos comportamientos para lo mismo.
 */
export const QuotationLinesTable = ({
  lines,
  onRemove,
}: QuotationLinesTableProps) => {
  if (lines.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        Todavía no has añadido ninguna línea.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead>Clase</TableHead>
            <TableHead>Vínculo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            {/* Es el TOTAL de la línea, no el unitario. */}
            <TableHead className="text-right">Precio total</TableHead>
            <TableHead>IGV</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={`${line.description}-${index}`}>
              <TableCell className="font-medium">{line.description}</TableCell>
              <TableCell>
                {line.supplierClassName ? (
                  <Badge variant="secondary">{line.supplierClassName}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {/* Material u orden, nunca los dos: una línea con material es
                    una compra, y las compras no van a una orden. */}
                {line.materialLink.linked ? (
                  <span className="text-sm">
                    {line.materialLink.materialName ?? "Material"}
                  </span>
                ) : line.productionOrderLink.linked ? (
                  <span className="text-sm">
                    {line.productionOrderLink.productionOrderName ?? "Orden"}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {/* Con orden vinculada la cantidad la pone la orden, así que
                    aquí no hay número que enseñar. */}
                {line.productionOrderLink.linked ? (
                  <span className="text-muted-foreground text-xs">
                    La pone la orden
                  </span>
                ) : (
                  fmt(line.quantity)
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(line.price)}
              </TableCell>
              <TableCell>
                {line.price === null ? (
                  <span className="text-muted-foreground text-sm">—</span>
                ) : (
                  <Badge
                    variant={
                      line.priceIncludesTax == null ? "outline" : "secondary"
                    }
                  >
                    {taxLabel(line.priceIncludesTax)}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{line.measurementUnit || "—"}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(index)}
                  aria-label={`Quitar ${line.description}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuotationLinesTable;
