import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ComponentPermission } from "@/shared/components/component-permission";
import { Loader2 } from "lucide-react";
import type { VariationMinStock } from "../types/MinimumStock.types";

// Tabla de la pestaña "Variaciones" de Edición masiva (T-596). A diferencia de
// MassiveEditProductsTable, el registro es la VARIACIÓN: el stock mínimo se
// guarda por variation_id, así que la selección tiene que ser por SKU.

interface MassiveEditVariationsTableProps {
  variations: VariationMinStock[];
  loading: boolean;
  search: string;
  /** Mínimo que rige cuando la variación no tiene valor propio. */
  defaultMinStock: number | null;
  selectedVariations: number[];
  onToggleVariationSelection: (variationId: number) => void;
  onToggleAllVariationsSelection: () => void;
}

// Checkbox, SKU, Producto, Atributo, Stock, Mínimo.
const COL_SPAN = 6;

// Mismo criterio que la pestaña de productos: la selección solo alimenta la
// edición masiva, que escribe configuración del producto.
const SELECTION_CODES = ["products.edit"];

const MassiveEditVariationsTable = ({
  variations,
  loading,
  search,
  defaultMinStock,
  selectedVariations,
  onToggleAllVariationsSelection,
  onToggleVariationSelection,
}: MassiveEditVariationsTableProps) => {
  return (
    <div className="relative h-full">
      {loading && variations.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <ComponentPermission codeIn={SELECTION_CODES}>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedVariations.length === variations.length &&
                    variations.length > 0
                  }
                  onCheckedChange={() => onToggleAllVariationsSelection()}
                />
              </TableHead>
            </ComponentPermission>
            <TableHead className="w-40">SKU</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Atributo</TableHead>
            <TableHead className="w-24">Stock</TableHead>
            <TableHead className="w-32">Stock mínimo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && variations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando variaciones...
                </div>
              </TableCell>
            </TableRow>
          ) : variations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COL_SPAN}
                className="text-center py-8 text-muted-foreground"
              >
                {search
                  ? "No se encontraron variaciones"
                  : "No hay variaciones registradas"}
              </TableCell>
            </TableRow>
          ) : (
            variations.map((variation) => (
              <TableRow key={variation.variationId}>
                <ComponentPermission codeIn={SELECTION_CODES}>
                  <TableCell>
                    <Checkbox
                      checked={selectedVariations.includes(variation.variationId)}
                      onCheckedChange={() =>
                        onToggleVariationSelection(variation.variationId)
                      }
                    />
                  </TableCell>
                </ComponentPermission>
                <TableCell className="font-mono text-muted-foreground">
                  {variation.sku || "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {variation.productName}
                </TableCell>
                <TableCell>{variation.terms || "Sin atributo"}</TableCell>
                <TableCell>{variation.stock}</TableCell>
                <TableCell>
                  {/* Sin valor propio se muestra el default, atenuado: así se
                      distingue de un mínimo configurado a mano con ese número. */}
                  {variation.minStock !== null ? (
                    <span className="font-medium">{variation.minStock}</span>
                  ) : defaultMinStock !== null ? (
                    <span className="text-muted-foreground">
                      Por defecto ({defaultMinStock})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin protección</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MassiveEditVariationsTable;
