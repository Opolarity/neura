import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateField } from "@/shared/components/date-range";
import { getTodayDate } from "@/shared/utils/date";
import { useTelaFilas } from "../../../hooks/useTelaFilas";
import { CutAttributeItem, CutOrder, RegisterCutFullPayload } from "../../../types/cutOrders.types";
import { CutFabric, CutFabricLine } from "../../../types/cutFabric.types";
import { CutFabricSection } from "./CutFabricSection";

const fmt = (value: number) => value.toLocaleString("es-PE");
const NUEVA = "nueva";
const SIN_TELA: CutFabricLine[] = [];

/** Un estilo + color de la OP con todas sus tallas. */
interface EstiloColor {
  key: string;
  label: string;
  items: CutAttributeItem[];
}

/** El estilo de la prenda: su código o, sin él, la parte del estilo de su nombre. */
const estiloDe = (item: CutAttributeItem) =>
  item.styleCode ?? (item.label.split(" - ")[0].split(" · ")[0].trim() || "Sin estilo");

/** Las prendas de la OP agrupadas por estilo (producto) y color, en su orden. */
const agrupar = (items: CutAttributeItem[]): EstiloColor[] => {
  const grupos = new Map<string, EstiloColor>();
  for (const item of items) {
    const key = `${item.productId ?? "x"}|${item.color ?? ""}`;
    let grupo = grupos.get(key);
    if (!grupo) {
      grupo = { key, label: [estiloDe(item), item.color].filter(Boolean).join(" · "), items: [] };
      grupos.set(key, grupo);
    }
    grupo.items.push(item);
  }
  return [...grupos.values()];
};

/** De entrada, el primer estilo + color al que aún le falta cortar. */
const grupoInicial = (grupos: EstiloColor[]) =>
  grupos.find((g) => g.items.some((i) => i.remaining > 0)) ?? grupos[0] ?? null;

/** Lo cortado de partida: en una O/C nueva lo que falta; al corregir, lo que tiene. */
const valoresDe = (oc: CutOrder | null, grupo: EstiloColor | null): Record<number, string> =>
  Object.fromEntries(
    oc
      ? oc.items.map((l) => [l.productionOrderItemId, String(l.cutQuantity ?? l.quantity)])
      : (grupo?.items ?? []).map((i) => [i.productionOrderItemId, String(i.remaining)])
  );

/** Una fila de la tabla de tallas. */
interface FilaTalla {
  productionOrderItemId: number;
  talla: string;
  pedido: number;
}

interface StartCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todas las prendas de la OP (atributo «Todas las prendas»). */
  items: CutAttributeItem[];
  cutOrders: CutOrder[];
  /** La tela de la OP: los almacenes y la de cada O/C, para corregirla. */
  fabric: CutFabric | null;
  nextCode: () => Promise<string>;
  saving: boolean;
  onSave: (payload: RegisterCutFullPayload) => Promise<boolean>;
  /**
   * Si el corte registra la tela (202611100005). Lo decide el backend
   * (`fabric_by_cut`): con el Corte de un proveedor, su encargo ya la
   * descuenta al recibirse. Enviar la tela al taller no sale de aquí.
   */
  fabricAllowed?: boolean;
}

/**
 * «Iniciar corte» (2026-10-30): una O/C para UN estilo + UN color con todas
 * sus tallas a la vez, y la tela que usó. También corrige una O/C de ese
 * estilo + color.
 */
export const StartCutDialog = ({
  open,
  onOpenChange,
  items,
  cutOrders,
  fabric,
  nextCode,
  saving,
  onSave,
  fabricAllowed = true,
}: StartCutDialogProps) => {
  const grupos = useMemo(() => agrupar(items), [items]);
  const [grupoKey, setGrupoKey] = useState(() => grupoInicial(grupos)?.key ?? "");
  const [destino, setDestino] = useState<string>(NUEVA);
  const [code, setCode] = useState("");
  const [cutOn, setCutOn] = useState<string | null>(() => getTodayDate());
  const [valores, setValores] = useState<Record<number, string>>(() => valoresDe(null, grupoInicial(grupos)));

  const grupo = grupos.find((g) => g.key === grupoKey) ?? null;
  const idsDelGrupo = useMemo(() => new Set((grupo?.items ?? []).map((i) => i.productionOrderItemId)), [grupo]);
  // Las O/C de este estilo + color: las que se pueden corregir.
  const corregibles = cutOrders.filter((c) => c.items.some((l) => idsDelGrupo.has(l.productionOrderItemId)));
  const oc = destino === NUEVA ? null : (cutOrders.find((c) => String(c.id) === destino) ?? null);

  const warehouses = fabric?.warehouses ?? [];
  const telaDeOc = useMemo(
    () => (oc ? (fabric?.cutOrders.find((c) => c.cutOrderId === oc.id)?.fabrics ?? SIN_TELA) : SIN_TELA),
    [oc, fabric]
  );
  const telaEstado = useTelaFilas(open, telaDeOc, warehouses);

  const filas: FilaTalla[] = oc
    ? oc.items.map((l) => ({
        productionOrderItemId: l.productionOrderItemId,
        talla: (idsDelGrupo.has(l.productionOrderItemId) && l.sizeName) || l.label,
        pedido: l.ordered,
      }))
    : (grupo?.items ?? []).map((i) => ({
        productionOrderItemId: i.productionOrderItemId,
        talla: i.sizeName ?? i.label,
        pedido: i.ordered,
      }));

  useEffect(() => {
    if (!open) return;
    const inicial = grupoInicial(grupos);
    setGrupoKey(inicial?.key ?? "");
    setDestino(NUEVA);
    setValores(valoresDe(null, inicial));
    setCutOn(getTodayDate());
    let vigente = true;
    setCode("");
    nextCode()
      .then((sugerido) => vigente && setCode((actual) => actual || sugerido))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
    // Solo al abrir: lo que se recargue después no pisa lo que se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cambiarGrupo = (key: string) => {
    setGrupoKey(key);
    setDestino(NUEVA);
    setValores(valoresDe(null, grupos.find((g) => g.key === key) ?? null));
  };

  const cambiarDestino = (nuevo: string) => {
    setDestino(nuevo);
    const elegida = nuevo === NUEVA ? null : (cutOrders.find((c) => String(c.id) === nuevo) ?? null);
    setValores(valoresDe(elegida, grupo));
    setCutOn(elegida?.cutOn ?? getTodayDate());
  };

  const textoDe = (id: number) => valores[id] ?? "";
  const filaValida = (fila: FilaTalla) => /^\d+$/.test(textoDe(fila.productionOrderItemId).trim());
  const cantidadesValidas = filas.every(filaValida);
  const numeroDe = (fila: FilaTalla) => (filaValida(fila) ? Number(textoDe(fila.productionOrderItemId)) : 0);
  const totalPedido = filas.reduce((sum, fila) => sum + fila.pedido, 0);
  const totalCorte = filas.reduce((sum, fila) => sum + numeroDe(fila), 0);

  const puedeGuardar =
    !saving &&
    grupo !== null &&
    filas.length > 0 &&
    cutOn !== null &&
    cantidadesValidas &&
    totalCorte > 0 &&
    (!fabricAllowed || (!telaEstado.telaInvalida && !telaEstado.telaRepetida));

  const handleSave = async () => {
    const ok = await onSave({
      cutOrderId: oc?.id ?? null,
      code: oc ? null : code,
      cutOn,
      items: filas.map((fila) => ({ productionOrderItemId: fila.productionOrderItemId, cutQuantity: numeroDe(fila) })),
      // Sin tela en el corte, null: el backend no la toca (sp_register_cut_full).
      fabrics: fabricAllowed ? telaEstado.aGuardar() : null,
      correct: oc !== null,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Iniciar corte</DialogTitle>
          <DialogDescription>
            {fabricAllowed
              ? "Anota lo cortado de cada talla y la tela que se usó. Desde aquí manda el corte real."
              : "Anota lo cortado de cada talla. Desde aquí manda el corte real."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cut-estilo" required>
                Estilo · color
              </Label>
              <Select value={grupoKey || undefined} onValueChange={cambiarGrupo}>
                <SelectTrigger id="cut-estilo" className="h-10">
                  <SelectValue placeholder="Elige el estilo y color" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.key} value={g.key}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {corregibles.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cut-destino">O/C</Label>
                <Select value={destino} onValueChange={cambiarDestino} disabled={grupo === null}>
                  <SelectTrigger id="cut-destino" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NUEVA}>Nueva O/C</SelectItem>
                    {corregibles.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        Corregir {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {destino === NUEVA && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cut-code">Código de la O/C</Label>
                <Input
                  id="cut-code"
                  className="h-10"
                  placeholder="OCT-…"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="cut-on" required>
                Fecha de corte
              </Label>
              <DateField id="cut-on" value={cutOn} onChange={setCutOn} />
            </div>
          </div>

          {grupo === null ? (
            <p className="text-muted-foreground text-sm">La OP aún no tiene prendas que cortar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talla</TableHead>
                  <TableHead className="text-right">Pedido</TableHead>
                  <TableHead className="w-36 text-right">Corte real</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.productionOrderItemId}>
                    <TableCell className="py-2">{fila.talla}</TableCell>
                    <TableCell className="py-2 text-right tabular-nums">{fmt(fila.pedido)}</TableCell>
                    <TableCell className="py-2">
                      <Input
                        aria-label={`Corte real de ${fila.talla}`}
                        inputMode="numeric"
                        className="h-9 text-right tabular-nums"
                        value={textoDe(fila.productionOrderItemId)}
                        aria-invalid={!filaValida(fila)}
                        onChange={(event) =>
                          setValores((prev) => ({ ...prev, [fila.productionOrderItemId]: event.target.value }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="py-2">Total</TableCell>
                  <TableCell className="py-2 text-right tabular-nums">{fmt(totalPedido)}</TableCell>
                  <TableCell className="py-2 pr-7 text-right tabular-nums">{fmt(totalCorte)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}

          {grupo !== null && (!cantidadesValidas || totalCorte === 0) && (
            <p className="text-destructive text-sm">
              {!cantidadesValidas
                ? "El corte real de cada talla es un número entero."
                : "Corta al menos una prenda."}
            </p>
          )}

          {fabricAllowed ? (
            <CutFabricSection
              estado={telaEstado}
              warehouses={warehouses}
              total={totalCorte}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              La tela la descuenta el encargo del proveedor al recibirse.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!puedeGuardar}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
