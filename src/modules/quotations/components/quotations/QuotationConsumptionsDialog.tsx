import { Loader2, Package } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuotationConsumptions } from "../../hooks/useQuotationConsumptions";

interface QuotationConsumptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: number | null;
  /** Para el título: «Corte», «Lavado». El proceso que cubre este encargo. */
  quotationLabel?: string | null;
  onSaved?: () => void;
}

const cantidad = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Qué material consume este paso, y de qué almacén sale.
 *
 * La lista son los materiales de la receta de las prendas que el paso
 * atraviesa, no un buscador: no se puede consumir algo que la prenda no lleva.
 * Y se marcan solo los que entran AQUÍ — la tela en corte, la etiqueta en
 * costura —, porque sin esa distinción el primer avance se llevaría la receta
 * entera.
 */
export const QuotationConsumptionsDialog = ({
  open,
  onOpenChange,
  quotationId,
  quotationLabel,
  onSaved,
}: QuotationConsumptionsDialogProps) => {
  const {
    materials,
    warehouses,
    selected,
    warehouseId,
    setWarehouseId,
    toggle,
    supplierName,
    sinAlmacenes,
    loading,
    saving,
    hasChanges,
    faltaAlmacen,
    guardar,
  } = useQuotationConsumptions({ quotationId, open, onSaved });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Consumo de material
            {quotationLabel && (
              <span className="text-muted-foreground font-normal">
                · {quotationLabel}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Marca qué materiales se consumen en este paso. El cuánto lo dice la
            receta; aquí solo se elige cuáles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="consumo-almacen">Almacén donde trabaja el taller *</Label>
          <Select
            value={warehouseId === null ? "" : String(warehouseId)}
            onValueChange={(value) => setWarehouseId(value === "" ? null : Number(value))}
            disabled={sinAlmacenes}
          >
            <SelectTrigger id="consumo-almacen">
              <SelectValue
                placeholder={
                  sinAlmacenes ? "Sin almacenes" : "Selecciona un almacén"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {/* Solo los del proveedor de esta cotización: los filtra el SP.
                  El material se consume donde el taller trabaja. */}
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Un desplegable vacío parece un fallo. Se dice el motivo y qué
              hacer, que es crearle el almacén al proveedor. */}
          {sinAlmacenes ? (
            <p className="text-destructive text-xs">
              {supplierName ?? "Este proveedor"} no tiene ningún almacén. Créale
              uno para poder declarar qué consume en este paso.
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              De aquí sale el material al consumirlo.
            </p>
          )}
        </div>

        {/* Un div con overflow-y-auto, no un ScrollArea: el Viewport de Radix
            es h-full y dentro de un item flex no resuelve su alto, así que
            recorta en silencio en vez de desplazar. */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando la receta de este paso…
            </div>
          ) : materials.length === 0 ? (
            <div className="text-muted-foreground p-10 text-center text-sm">
              Las prendas de este paso no tienen receta asignada, así que no hay
              material que consumir.
            </div>
          ) : (
            <ul className="divide-y">
              {materials.map((m) => {
                const marcado = selected.has(m.materialId);
                return (
                  <li
                    key={m.materialId}
                    className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
                  >
                    <Checkbox
                      id={`mat-${m.materialId}`}
                      checked={marcado}
                      onCheckedChange={() => toggle(m.materialId)}
                    />
                    <label
                      htmlFor={`mat-${m.materialId}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="block truncate text-sm font-medium">
                        {m.name}
                      </span>
                    </label>
                    <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                      {cantidad(m.required)}
                      {m.measurementUnit ? ` ${m.measurementUnit}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {faltaAlmacen && (
          <p className="text-destructive text-xs">
            Elige el almacén: sin él no se sabría de dónde descontar.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving || loading || !hasChanges}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
