import { Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox } from "../EntityCombobox";
import { useAssignRecipe } from "../../hooks/useAssignRecipe";
import { AssignRecipeResult } from "../../types/explosions.types";

interface AssignRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: (result: AssignRecipeResult) => void;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Asignación masiva de receta (2026-10-28). Se elige el código de modelo y los
 * productos sin receta que lo reciben; cada uno queda con su propia copia de
 * materiales y operaciones, con el mismo código. Las cantidades por talla no
 * se copian: son tallas del otro producto.
 */
export const AssignRecipeDialog = ({ open, onOpenChange, onAssigned }: AssignRecipeDialogProps) => {
  const {
    sourceSearch,
    setSourceSearch,
    sourceOptions,
    source,
    loadingSource,
    chooseSource,
    productSearch,
    setProductSearch,
    products,
    productsTotal,
    loadingProducts,
    selected,
    isSelected,
    visibleSelected,
    toggleProduct,
    toggleVisible,
    removeProduct,
    submitting,
    submit,
  } = useAssignRecipe(onAssigned);

  const allVisible = products.length > 0 && visibleSelected === products.length;
  const someVisible = visibleSelected > 0 && !allVisible;

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && onOpenChange(value)}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Asignar receta a varios productos</DialogTitle>
          <DialogDescription>
            Cada producto recibe su propia copia de los materiales y las operaciones, con el mismo
            código de modelo. Las cantidades por talla no se copian.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label required>Código de modelo</Label>
          <EntityCombobox
            options={sourceOptions}
            value={source?.id ?? null}
            onSelect={(option) => void chooseSource(option)}
            search={sourceSearch}
            onSearchChange={setSourceSearch}
            placeholder="Elegir código de modelo"
            searchPlaceholder="Buscar por código o producto..."
            fallbackLabel={source ? `${source.modelCode} · ${source.productTitle ?? `Receta #${source.id}`}` : null}
            disabled={submitting}
          />
          {loadingSource ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando receta...
            </p>
          ) : (
            source && (
              <p className="text-sm text-muted-foreground">
                {plural(source.materialsCount, "material", "materiales")} ·{" "}
                {plural(source.processesCount, "etapa", "etapas")} ·{" "}
                {plural(source.operationsCount, "operación", "operaciones")}
                {source.productTitle ? ` · de ${source.productTitle}` : ""}
              </p>
            )
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assign-recipe-search" required>
            Productos sin receta
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="assign-recipe-search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar por nombre, código o SKU..."
              className="pl-9"
            />
          </div>

          <div className="h-[300px] overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allVisible ? true : someVisible ? "indeterminate" : false}
                      onCheckedChange={(value) => toggleVisible(value === true)}
                      disabled={loadingProducts || products.length === 0}
                      aria-label="Seleccionar todos los visibles"
                    />
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Variaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No hay productos sin receta{productSearch ? " con esa búsqueda" : ""}.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const checked = isSelected(product.productId);
                    return (
                      <TableRow
                        key={product.productId}
                        data-state={checked ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => toggleProduct(product, !checked)}
                      >
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => toggleProduct(product, value === true)}
                            aria-label={`Seleccionar ${product.productTitle}`}
                          />
                        </TableCell>
                        <TableCell className="py-2 font-medium">{product.productTitle}</TableCell>
                        <TableCell className="py-2">{product.productCode ?? "—"}</TableCell>
                        <TableCell className="py-2 text-right tabular-nums">{product.variationsCount}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {productsTotal > products.length && (
            <p className="text-xs text-muted-foreground">
              Se muestran {products.length} de {productsTotal}. Busca para encontrar los demás; lo marcado se
              conserva.
            </p>
          )}
        </div>

        {selected.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{plural(selected.length, "producto elegido", "productos elegidos")}</p>
            <div className="flex max-h-[84px] flex-wrap gap-1.5 overflow-y-auto">
              {selected.map((product) => (
                <Badge key={product.id} variant="secondary" className="gap-1 pr-1 font-normal">
                  <span className="max-w-[220px] truncate" title={product.title}>
                    {product.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Quitar ${product.title}`}
                    disabled={submitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={!source || selected.length === 0 || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selected.length > 0
              ? `Asignar a ${plural(selected.length, "producto", "productos")}`
              : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
