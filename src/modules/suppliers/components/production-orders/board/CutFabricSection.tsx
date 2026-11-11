import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import {
  errorDeFila,
  faltaDeFila,
  limiteDeFila,
  netoDeFila,
  TelaFilasState,
} from "../../../hooks/useTelaFilas";
import { CUT_FABRIC_USAGE_LABELS, CutFabricUsage, CutFabricWarehouse } from "../../../types/cutFabric.types";
import { EntityCombobox } from "../../EntityCombobox";

const fmt = (value: number) => value.toLocaleString("es-PE");
const fmtTela = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 4 });
const USOS = Object.entries(CUT_FABRIC_USAGE_LABELS) as Array<[CutFabricUsage, string]>;

/**
 * La sección «Tela utilizada» (202611040003): cada tela con su uso, el total
 * utilizado y el sobrante, y su consumo real sobre lo cortado. El almacén solo
 * se pregunta si hay más de uno. Una fila que pide más de lo que hay en su
 * almacén va en rojo.
 */
export const CutFabricSection = ({
  estado,
  warehouses,
  total,
}: {
  estado: TelaFilasState;
  warehouses: CutFabricWarehouse[];
  /** Las prendas cortadas, para el consumo real. */
  total: number;
}) => {
  const {
    tela,
    setTela,
    buscador,
    agregarTela,
    cambiarTela,
    elegirTela,
    telaInvalida,
    telaRepetida,
  } = estado;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Tela utilizada</Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={agregarTela}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar tela
          </Button>
        </div>
      </div>

      {tela.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sin tela registrada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tela.map((fila) => {
            const stockEn = (id: number) =>
              id === fila.availableWarehouseId && fila.available !== null
                ? fila.available
                : fila.stock.find((s) => s.warehouseId === id)?.stock;
            const unidad = fila.unit ? ` (${fila.unit})` : "";
            const limite = limiteDeFila(fila);
            const error = errorDeFila(fila);
            const falta = error ? null : faltaDeFila(fila);
            const neto = netoDeFila(fila);
            // Lo guardado sin almacén también lo pide, aunque solo haya uno.
            const pideAlmacen = warehouses.length > 1 || fila.warehouseId === null;
            return (
              <li
                key={fila.key}
                className={cn("flex flex-col gap-2 rounded-md border p-3", error && "border-destructive")}
              >
                <div className="flex min-w-0 gap-2">
                  <EntityCombobox
                    className="h-9 min-w-0 flex-1"
                    options={buscador.options.map((o) => ({
                      id: o.materialVariationId,
                      label: o.unit ? `${o.label} (${o.unit})` : o.label,
                      title: `${o.code} · ${o.label}`,
                      // Sin stock en los almacenes propios no se puede cortar de ella.
                      disabled: o.totalStock <= 0,
                      hint: o.totalStock <= 0 ? "sin stock" : undefined,
                    }))}
                    value={fila.materialVariationId}
                    onSelect={(option) => elegirTela(fila, option.id)}
                    search={buscador.search}
                    onSearchChange={buscador.setSearch}
                    placeholder="Elige la tela"
                    searchPlaceholder="Buscar tela..."
                    fallbackLabel={fila.label ? `${fila.label}${unidad}` : null}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Quitar esta tela"
                    aria-label="Quitar esta tela"
                    onClick={() => setTela((prev) => prev.filter((f) => f.key !== fila.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">Uso</span>
                    <Select
                      value={fila.usage ?? undefined}
                      onValueChange={(value) => cambiarTela(fila.key, { usage: value as CutFabricUsage })}
                    >
                      <SelectTrigger className="h-9" aria-label="Uso de la tela">
                        <SelectValue placeholder="Uso" />
                      </SelectTrigger>
                      <SelectContent>
                        {USOS.map(([valor, etiqueta]) => (
                          <SelectItem key={valor} value={valor}>
                            {etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">Total utilizado{unidad}</span>
                    <Input
                      aria-label={`Total utilizado${fila.unit ? ` en ${fila.unit}` : ""}`}
                      inputMode="decimal"
                      className="h-9 text-right tabular-nums"
                      value={fila.used}
                      onChange={(event) => cambiarTela(fila.key, { used: event.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">Sobrante{unidad}</span>
                    <Input
                      aria-label={`Sobrante${fila.unit ? ` en ${fila.unit}` : ""}`}
                      inputMode="decimal"
                      placeholder="0"
                      className="h-9 text-right tabular-nums"
                      value={fila.leftover}
                      onChange={(event) => cambiarTela(fila.key, { leftover: event.target.value })}
                    />
                  </div>
                </div>
                {pideAlmacen && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-muted-foreground text-xs">Sale de</span>
                    <Select
                      value={fila.warehouseId === null ? undefined : String(fila.warehouseId)}
                      onValueChange={(value) => cambiarTela(fila.key, { warehouseId: Number(value) })}
                    >
                      <SelectTrigger className="h-9" aria-label="Almacén del que sale la tela">
                        <SelectValue placeholder="Almacén" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => {
                          const stock = stockEn(w.warehouseId);
                          return (
                            <SelectItem key={w.warehouseId} value={String(w.warehouseId)}>
                              {w.name}
                              {stock !== undefined ? ` · ${fmtTela(stock)}${fila.unit ? ` ${fila.unit}` : ""}` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!error && neto !== null && total > 0 && (
                  <p className="text-muted-foreground text-sm">
                    Consumo real:{" "}
                    <span className="text-foreground font-semibold tabular-nums">{fmtTela(neto / total)}</span>
                    {fila.unit ? ` ${fila.unit}` : ""} por prenda ({fmtTela(neto)} / {fmt(total)}).
                  </p>
                )}
                {(error || falta || limite !== null) && (
                  <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
                    {error ??
                      falta ??
                      `Disponible en el almacén: ${fmtTela(limite as number)}${fila.unit ? ` ${fila.unit}` : ""}.`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tela.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {telaRepetida
            ? "Cada tela va una sola vez."
            : telaInvalida
              ? "Completa cada tela: su uso, el total utilizado y el almacén, sin pasar del stock."
              : "Al guardar sale del almacén todo lo utilizado, vinculado a esta OP, y el sobrante vuelve al inventario Producción como «Sobrante de corte»."}
        </p>
      )}
    </div>
  );
};
