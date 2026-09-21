import { useCallback, useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";
import type { Warehouse } from "@/types/warehouse";
import {
  allQuotationServicesApi,
  fetchSituationsByModuleId,
  forwardSituations,
  updateServiceSituation,
  type SituationOption,
} from "@/modules/quotations/services/Quotations.service";
import type { QuotationServiceApi } from "@/modules/quotations/types/Quotations.types";

interface PurchaseSituationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La cotización de compra: una fila de «Compras de esta orden». */
  quotationId: number | null;
  quotationLabel: string | null;
  supplierName: string | null;
  onSaved?: () => void;
}

/**
 * Cambiar la situación de una compra sin salir de la orden.
 *
 * Hasta ahora había que ir a Cotizaciones, buscar la cotización y abrirla. La
 * compra vive en la orden, así que se edita desde la orden.
 *
 * Es UNA LÍNEA a la vez, no la cotización entera: cada material tiene su propia
 * situación y puede llegar en días distintos — el cierre viene por proveedor,
 * pero la recepción es por material.
 *
 * No repite el modal del detalle de cotización, que además lleva IGV, merma,
 * mensaje e historial. Aquí solo está lo que una compra necesita para avanzar:
 * a qué situación pasa, cuánto llegó, y a qué almacén entra.
 */
export const PurchaseSituationDialog = ({
  open,
  onOpenChange,
  quotationId,
  quotationLabel,
  supplierName,
  onSaved,
}: PurchaseSituationDialogProps) => {
  const [lines, setLines] = useState<QuotationServiceApi[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /** La línea que se está editando. Null = la lista. */
  const [editing, setEditing] = useState<QuotationServiceApi | null>(null);
  const [situations, setSituations] = useState<SituationOption[]>([]);
  const [situationId, setSituationId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");

  const cargar = useCallback(async () => {
    if (quotationId === null) return;
    setLoading(true);
    try {
      const [servicios, almacenes] = await Promise.all([
        // Solo MATERIAL: una compra son sus líneas de material. Las de
        // servicio, si las hubiera, se avanzan desde el Plan Maestro.
        allQuotationServicesApi(quotationId, "MATERIAL"),
        getWarehousesIsActiveTrue(),
      ]);
      setLines(servicios);
      setWarehouses(almacenes);
    } catch (error) {
      toastError(error, "No se pudieron cargar las líneas de la compra");
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (open) void cargar();
    else setEditing(null);
  }, [open, cargar]);

  /** Abrir una línea: se siembra con lo que ya tiene. */
  const abrir = async (line: QuotationServiceApi) => {
    setEditing(line);
    setSituationId("");
    setQuantity(
      line.last_situation?.quantity !== null &&
        line.last_situation?.quantity !== undefined
        ? String(line.last_situation.quantity)
        : "",
    );
    setWarehouseId("");

    try {
      const todas = await fetchSituationsByModuleId(line.module_id);
      // Solo hacia delante: una compra no retrocede de recibida a cotizada.
      setSituations(forwardSituations(todas, line.last_situation?.situation_id ?? null));
    } catch (error) {
      toastError(error, "No se pudieron cargar las situaciones");
      setEditing(null);
    }
  };

  const elegida = situations.find((s) => s.id === Number(situationId));
  // El almacén solo pinta al recibir: es cuando el material entra a stock.
  const esRecepcion = elegida?.code?.endsWith("-PHY") ?? false;
  const faltaAlmacen = esRecepcion && warehouseId === "";

  const guardar = async () => {
    if (!editing || !editing.last_situation || situationId === "") return;

    if (faltaAlmacen) {
      toast({
        title: "Elige el almacén al que entra el material",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateServiceSituation({
        supplierServiceSituationId: editing.last_situation.id,
        supplierServiceId: editing.id,
        moduleId: editing.module_id,
        situationId: Number(situationId),
        statusId: elegida?.status_id ?? editing.last_situation.status_id,
        quantity: quantity === "" ? null : Number(quantity),
        badQuantity: null,
        message: null,
        measurementUnit: editing.last_situation.measurement_unit,
        price: editing.last_situation.price,
        warehouseId: warehouseId === "" ? null : Number(warehouseId),
      });

      toast({ title: "Situación actualizada", variant: "success" });
      setEditing(null);
      onSaved?.();
      await cargar();
    } catch (error) {
      toastError(error, "No se pudo cambiar la situación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {editing ? "Cambiar situación" : "Compra"}
            {quotationLabel && (
              <span className="text-muted-foreground font-normal">
                · {quotationLabel}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? editing.description
              : `Líneas de ${supplierName ?? "este proveedor"}. Elige una para cambiar su situación.`}
          </DialogDescription>
        </DialogHeader>

        {/* Un div con overflow-y-auto, no un ScrollArea: el Viewport de Radix
            es h-full y dentro de un item flex recorta en silencio. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : editing ? (
            <div className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="compra-situacion">Nueva situación *</Label>
                <Select value={situationId} onValueChange={setSituationId}>
                  <SelectTrigger id="compra-situacion">
                    <SelectValue placeholder="Selecciona una situación" />
                  </SelectTrigger>
                  <SelectContent>
                    {situations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compra-cantidad">Cantidad</Label>
                <Input
                  id="compra-cantidad"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Lo que llegó de verdad. El stock se ajusta por la diferencia
                  con lo anterior, no por el total.
                </p>
              </div>

              {/* Solo al recibir: es cuando el material entra a stock, y sin
                  almacén el ingreso no se registra en ninguna parte. */}
              {esRecepcion && (
                <div className="space-y-2">
                  <Label htmlFor="compra-almacen">Almacén de ingreso *</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger id="compra-almacen">
                      <SelectValue placeholder="Selecciona un almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                          {w.supplier_id ? " · taller" : " · propio"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {faltaAlmacen && (
                    <p className="text-destructive text-xs">
                      Sin almacén el material no entraría a ningún stock.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : lines.length === 0 ? (
            <div className="text-muted-foreground p-10 text-center text-sm">
              Esta compra no tiene líneas de material.
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {line.description}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {line.last_situation?.situation_name ?? "—"}
                      {line.last_situation?.quantity !== null &&
                        line.last_situation?.quantity !== undefined &&
                        ` · ${line.last_situation.quantity} ${line.last_situation.measurement_unit ?? ""}`}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void abrir(line)}
                    disabled={!line.last_situation}
                  >
                    Cambiar situación
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => (editing ? setEditing(null) : onOpenChange(false))}
          >
            {editing ? "Volver" : "Cerrar"}
          </Button>
          {editing && (
            <Button onClick={guardar} disabled={saving || situationId === ""}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
