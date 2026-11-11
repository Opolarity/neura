import { useEffect, useState } from "react";
import { Loader2, Trash } from "lucide-react";
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
import { useCutWaste } from "../../../hooks/useCutFabric";
import { aNumero, esDecimal } from "../../../hooks/useTelaFilas";
import {
  CUT_WASTE_UNIT_LABELS,
  CutFabricWarehouse,
  CutOrderFabric,
  CutWasteUnit,
} from "../../../types/cutFabric.types";

const UNIDADES = Object.entries(CUT_WASTE_UNIT_LABELS) as Array<[CutWasteUnit, string]>;
const fmt = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 4 });

/**
 * «Ingresar merma» de una O/C (202611060010): por cada tela, cuánto y en kilos
 * o metros, sea cual sea la unidad de la tela. Entra al inventario Merma y no
 * descuenta nada: la tela ya salió como consumo y el consumo real no cambia.
 */
export const IngresarMermaDialog = ({
  open,
  onOpenChange,
  corte,
  warehouses,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corte: CutOrderFabric;
  warehouses: CutFabricWarehouse[];
  onChanged: () => void | Promise<void>;
}) => {
  const { saving, add, anular } = useCutWaste(onChanged);
  const [materialId, setMaterialId] = useState<number | null>(corte.fabrics[0]?.materialVariationId ?? null);
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState<CutWasteUnit>(corte.fabrics[0]?.unit === "KG" ? "KG" : "MTR");
  const [almacenId, setAlmacenId] = useState<number | null>(null);

  const tela = corte.fabrics.find((f) => f.materialVariationId === materialId) ?? null;
  // De entrada, a donde salió la tela; si no se sabe y hay uno solo, ese.
  useEffect(() => {
    setAlmacenId(tela?.warehouseId ?? (warehouses.length === 1 ? warehouses[0].warehouseId : null));
  }, [tela?.warehouseId, warehouses]);

  const opcionesAlmacen =
    tela?.warehouseId && !warehouses.some((w) => w.warehouseId === tela.warehouseId)
      ? [...warehouses, { warehouseId: tela.warehouseId, name: tela.warehouseName ?? "Almacén" }]
      : warehouses;

  const valida = esDecimal(cantidad) && aNumero(cantidad) > 0;
  const puedeGuardar = materialId !== null && almacenId !== null && valida && !saving;

  const guardar = async () => {
    if (materialId === null || almacenId === null) return;
    const ok = await add({
      cutOrderId: corte.cutOrderId,
      materialVariationId: materialId,
      warehouseId: almacenId,
      quantity: aNumero(cantidad),
      unit: unidad,
    });
    if (ok) setCantidad("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ingresar merma · {corte.code}</DialogTitle>
          <DialogDescription>
            Entra al inventario Merma. No descuenta stock ni cambia el consumo real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {corte.fabrics.length > 1 && (
            <div className="flex flex-col gap-1">
              <Label>Tela</Label>
              <Select
                value={materialId === null ? undefined : String(materialId)}
                onValueChange={(value) => setMaterialId(Number(value))}
              >
                <SelectTrigger aria-label="Tela">
                  <SelectValue placeholder="Elige la tela" />
                </SelectTrigger>
                <SelectContent>
                  {corte.fabrics.map((f) => (
                    <SelectItem key={f.materialVariationId} value={String(f.materialVariationId)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {corte.fabrics.length === 1 && <p className="text-sm font-medium">{corte.fabrics[0].label}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merma-cantidad" required>
                Cantidad
              </Label>
              <Input
                id="merma-cantidad"
                inputMode="decimal"
                className="text-right tabular-nums"
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label required>Unidad</Label>
              <Select value={unidad} onValueChange={(value) => setUnidad(value as CutWasteUnit)}>
                <SelectTrigger aria-label="Unidad de la merma">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(([valor, etiqueta]) => (
                    <SelectItem key={valor} value={valor}>
                      {etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {opcionesAlmacen.length > 1 && (
            <div className="flex flex-col gap-1">
              <Label required>Almacén</Label>
              <Select
                value={almacenId === null ? undefined : String(almacenId)}
                onValueChange={(value) => setAlmacenId(Number(value))}
              >
                <SelectTrigger aria-label="Almacén de la merma">
                  <SelectValue placeholder="Elige el almacén" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesAlmacen.map((w) => (
                    <SelectItem key={w.warehouseId} value={String(w.warehouseId)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {corte.waste.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Ingresada</Label>
              <ul className="flex flex-col gap-2">
                {corte.waste.map((entrada) => (
                  <li key={entrada.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{entrada.label}</div>
                      <div className="text-muted-foreground text-xs">{entrada.warehouseName ?? "—"}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {fmt(entrada.quantity)} {entrada.unit}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        title="Anular esta merma"
                        aria-label="Anular esta merma"
                        disabled={saving}
                        onClick={() => void anular(entrada.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cerrar
          </Button>
          <Button onClick={() => void guardar()} disabled={!puedeGuardar}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ingresar merma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
