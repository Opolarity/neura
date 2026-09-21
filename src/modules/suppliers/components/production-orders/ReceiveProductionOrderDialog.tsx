import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Lock, PackageCheck, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserProfile } from "@/modules/auth";
import { toast } from "@/shared/hooks/use-toast";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";
import { Warehouse } from "@/types/warehouse";
import { getStockTypesApi } from "@/modules/settings/services/StockType.services";
import { StockType } from "@/modules/settings/types/StockType.types";
import {
  closeProductionOrderItemIntakeApi,
  receiveProductionOrderApi,
} from "../../services/productionOrders.service";
import {
  IntakeGuideLine,
  openProductionIntakeGuide,
} from "../../utils/productionIntakeGuide";
import { ProductionOrderItem } from "../../types/productionOrders.types";

interface ReceiveProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number;
  /** Cómo se llama la orden en la guía de ingreso: OP-0001, o su nombre. */
  productionOrderLabel?: string | null;
  items: ProductionOrderItem[];
  /**
   * La prenda por la que se entro, si fue por una. Solo esa arranca marcada;
   * las demas quedan a un clic, o todas de golpe. Sin ella --desde la orden--
   * arrancan marcadas todas las que tengan algo por ingresar.
   */
  focusItemId?: number | null;
  onReceived?: () => void;
}

/** Cuánto entra de una prenda, bueno y malo, tal como se teclea. */
interface RowInput {
  good: string;
  bad: string;
}

/** Lo bastante grande para traerlos todos: son un puñado por tenant. */
const STOCK_TYPES_PAGE_SIZE = 100;

/**
 * Los campos de cantidad, sin las flechitas del navegador.
 *
 * Un `input[type=number]` dibuja su spinner PEGADO al borde derecho, que es
 * justo donde `text-right` pone los dígitos: en una columna estrecha la cifra
 * quedaba tapada a medias. Se ocultan --el teclado y las flechas del teclado
 * siguen funcionando-- y se pide `tabular-nums`, para que las columnas de
 * números cuadren entre filas.
 */
const CAMPO_NUMERO =
  "w-full text-right tabular-nums [appearance:textfield] " +
  "[&::-webkit-outer-spin-button]:appearance-none " +
  "[&::-webkit-inner-spin-button]:appearance-none";

/**
 * Recibir a stock lo que salió de la orden.
 *
 * Es la vía de la producción propia, y se distingue del ingreso por servicio de
 * la cotización en lo esencial: **aquí no se busca la variación**. Cada ítem ya
 * dice qué producto es, así que se recibe por prenda y el backend resuelve el
 * resto. Buscarla a mano teniendo el dato sería invitar a meter una distinta.
 *
 * El ítem sin producto asignado no se puede recibir -- el SP lo rechaza con su
 * propio mensaje -- así que aquí se muestra deshabilitado en vez de dejar que
 * falle al guardar.
 *
 * Lo bueno y lo malo entran POR SEPARADO, cada uno a su almacén y con su tipo
 * de stock. Es una decisión que se toma mirando la mercadería: unas prendas que
 * llegaron con falla pero sirven pueden entrar como Producción en otro almacén,
 * y lo que decide si cuentan para cerrar la orden es justamente ese tipo.
 */
export const ReceiveProductionOrderDialog = ({
  open,
  onOpenChange,
  productionOrderId,
  items,
  focusItemId = null,
  productionOrderLabel,
  onReceived,
}: ReceiveProductionOrderDialogProps) => {
  const { ensureProfile } = useUserProfile();

  /** Lo bueno y lo malo por ítem, tecleado. Clave: id del ítem. */
  const [inputs, setInputs] = useState<Record<number, RowInput>>({});
  /** Que prendas entran en este ingreso. Las demas se quedan como estan. */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockTypes, setStockTypes] = useState<StockType[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [saving, setSaving] = useState(false);
  /**
   * Lo que se acaba de recibir, o null si todavía no se guardó.
   *
   * Con esto puesto el diálogo no se cierra: enseña el botón de imprimir la
   * guía de ingreso, que tiene que ser un click de verdad -- abrir el PDF
   * dentro del `await` del guardado lo bloquearía el navegador.
   */
  const [sent, setSent] = useState<{
    stockEntryId: number | null;
    warehouseName: string;
    warehouseAddress: string | null;
    lines: IntakeGuideLine[];
  } | null>(null);

  /**
   * Prendas cerradas en ESTA sesión del diálogo, además de las que ya vinieron
   * cerradas en `items`: así la fila se bloquea al instante sin esperar a que
   * el padre recargue.
   */
  const [closedLocal, setClosedLocal] = useState<Set<number>>(new Set());
  /** La prenda a la que se le está pidiendo confirmar el cierre, o null. */
  const [closing, setClosing] = useState<ProductionOrderItem | null>(null);
  const [closingSaving, setClosingSaving] = useState(false);

  /** A dónde entra lo bueno. Arranca en el almacén del usuario. */
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [stockTypeId, setStockTypeId] = useState<string>("");
  /** A dónde entra la merma. Arranca igual que lo bueno. */
  const [badWarehouseId, setBadWarehouseId] = useState<string>("");
  const [badStockTypeId, setBadStockTypeId] = useState<string>("");

  /** Solo entran a stock los que tienen producto: el resto no tiene a qué subir. */
  const receivable = useMemo(
    () => items.filter((item) => item.variationId !== null && item.id !== undefined),
    [items]
  );

  // Se siembra con lo que SALIÓ de la ruta menos lo que ya entró, no con lo
  // pedido: si se pidieron 15 y el taller entregó 25, lo que hay para ingresar
  // son 25, y proponer 15 obliga a corregirlo a mano cada vez.
  //
  // `routeOutput` es null cuando no se puede saber --un servicio que cubre
  // varias prendas no dice cuántas salieron de cada una-- o cuando la orden no
  // tiene ruta. Ahí se cae a lo pedido, que es lo que había.
  //
  // Restar lo ya recibido evita que una orden que entró en tandas vuelva a
  // proponer el total y meta el doble. Una prenda ya completa entra en 0 y no
  // estorba. La merma arranca vacía: es un dato que se mira y se teclea, no
  // algo que se pueda suponer.
  /**
   * Lo que sale del último proceso de la ruta de esa prenda.
   *
   * Null cuando no se puede saber --un servicio que cubre varias prendas no
   * dice cuántas salieron de cada una-- o cuando la orden no tiene ruta: ahí se
   * cae a lo pedido, que es lo que había.
   */
  const disponibleDe = (item: ProductionOrderItem) =>
    item.routeOutput ?? item.quantity ?? 0;

  /**
   * Cuánto queda por ingresar de esa prenda, contra lo que SALIÓ del último
   * proceso. Es la PROPUESTA de la fila, no un tope: se puede ingresar más
   * --el taller entregó de más-- y el diálogo solo lo avisa.
   */
  const restanteDe = (item: ProductionOrderItem) =>
    Math.max(disponibleDe(item) - (item.received ?? 0), 0);

  /**
   * Si la prenda ya cerró su ingreso: «ya no entra más».
   *
   * Es una marca MANUAL y definitiva, no el conteo. Antes la fila se cerraba
   * sola al alcanzar lo que salió, y eso no sabía cerrar una prenda con
   * faltantes que ya no vendrán, ni dejar entrar de más. El SP rechaza las
   * cerradas, así que aquí se bloquean en vez de dejar que falle al guardar.
   */
  const estaCerrada = (item: ProductionOrderItem) =>
    item.intakeClosed || closedLocal.has(item.id as number);

  useEffect(() => {
    if (!open) return;
    setInputs(
      Object.fromEntries(
        receivable.map((item) => [
          item.id as number,
          { good: String(restanteDe(item)), bad: "" },
        ])
      )
    );
    // Por una prenda: solo esa. Por la orden: todas las que tengan algo
    // que ingresar; una ya completa no aporta nada y estorba marcada. Las
    // cerradas nunca: el SP las rechaza.
    setSelected(
      new Set(
        receivable
          .filter((item) => !estaCerrada(item))
          .filter((item) =>
            focusItemId !== null
              ? item.id === focusItemId
              : restanteDe(item) > 0
          )
          .map((item) => item.id as number)
      )
    );
    // `restanteDe` es una función pura sobre `receivable`: entra ese.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, receivable, focusItemId]);

  // Los catálogos y el almacén del usuario, que es solo el valor de partida:
  // desde 202610010077 el destino se elige, así que ya no bloquea el diálogo
  // que el usuario no tenga almacén asignado.
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoadingCatalogs(true);
        const [profile, warehouseList, stockTypeResponse] = await Promise.all([
          ensureProfile().catch(() => null),
          getWarehousesIsActiveTrue(),
          getStockTypesApi({ page: 1, size: STOCK_TYPES_PAGE_SIZE }),
        ]);

        setWarehouses(warehouseList);
        const tipos = stockTypeResponse?.data ?? [];
        setStockTypes(tipos);

        // El almacén del perfil si lo tiene y sigue activo; si no, el primero.
        const propio = warehouseList.find((w) => w.id === profile?.warehouse_id);
        const inicial = String((propio ?? warehouseList[0])?.id ?? "");
        setWarehouseId(inicial);
        setBadWarehouseId(inicial);

        // Sin tipo elegido el backend usa Producción, pero se enseña puesto
        // para que se vea a qué entra antes de darle a recibir.
        const primero = String(tipos[0]?.id ?? "");
        setStockTypeId(primero);
        setBadStockTypeId(primero);
      } catch {
        setWarehouses([]);
        setStockTypes([]);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    load();
  }, [open, ensureProfile]);

  /** Las que se pueden marcar: las que no cerraron su ingreso. */
  const marcables = receivable.filter((item) => !estaCerrada(item));
  const todas =
    marcables.length > 0 && marcables.every((item) => selected.has(item.id as number));

  const toggleItem = (itemId: number, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });

  const toggleTodas = (checked: boolean) =>
    setSelected(checked ? new Set(marcables.map((item) => item.id as number)) : new Set());

  // Solo las marcadas cuentan: en los totales, en el aviso de exceso y en lo
  // que se manda. Las demas se quedan como estan.
  const rows = receivable
    .filter((item) => selected.has(item.id as number))
    .map((item) => {
      const entrada = inputs[item.id as number];
      return {
        item,
        good: Number(entrada?.good ?? 0),
        bad: Number(entrada?.bad ?? 0),
      };
    });

  const num = (value: number) => (Number.isFinite(value) ? value : 0);
  const totalGood = rows.reduce((sum, row) => sum + num(row.good), 0);
  const totalBad = rows.reduce((sum, row) => sum + num(row.bad), 0);
  const total = totalGood + totalBad;

  const setField = (itemId: number, field: keyof RowInput, value: string) =>
    setInputs((prev) => ({
      ...prev,
      [itemId]: { good: "", bad: "", ...prev[itemId], [field]: value },
    }));

  /**
   * Las prendas de las que se está declarando más de lo que salió del último
   * proceso (o de lo pedido, cuando no se sabe cuánto salió). Lo bueno y lo
   * malo cuentan los dos, porque los dos llegaron.
   *
   * Se AVISA, no se impide: el número lo tecleó alguien mirando la mercadería
   * y el taller puede haber entregado de más. El cierre de la prenda lo
   * decide la marca manual, no este conteo.
   */
  const excedidas = rows.filter(
    (row) => num(row.good) + num(row.bad) > restanteDe(row.item),
  );

  /**
   * Cierra el ingreso de la prenda pendiente de confirmar. Definitivo: no hay
   * vuelta atrás desde la UI, por eso pasa por el AlertDialog.
   */
  const handleCloseIntake = async () => {
    if (!closing) return;
    const itemId = closing.id as number;
    try {
      setClosingSaving(true);
      await closeProductionOrderItemIntakeApi(itemId);
      setClosedLocal((prev) => new Set(prev).add(itemId));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      toast({
        title: `Ingreso cerrado: ${closing.variationLabel ?? closing.name}`,
        variant: "success",
      });
      // El plan pinta el boton en verde con esto: hay que recargarlo.
      onReceived?.();
      setClosing(null);
    } catch (error) {
      toast({
        title:
          error instanceof Error ? error.message : "No se pudo cerrar el ingreso",
        variant: "destructive",
      });
    } finally {
      setClosingSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!warehouseId) return;

    // El SP rechaza el lote entero si suma cero -- stock_movements tiene
    // CHECK (quantity <> 0) -- así que se avisa antes de ir al servidor.
    const payload = rows
      .filter((row) => num(row.good) > 0 || num(row.bad) > 0)
      .map((row) => ({
        production_order_item_id: row.item.id as number,
        quantity_good: num(row.good),
        quantity_bad: num(row.bad),
      }));

    if (payload.length === 0) {
      toast({
        title: "Indica cuántas unidades recibes de al menos una prenda",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { stockEntryId } = await receiveProductionOrderApi(
        productionOrderId,
        {
          warehouseId: Number(warehouseId),
          stockTypeId: stockTypeId ? Number(stockTypeId) : null,
          // Solo viajan si hay merma: si no, no hay nada que enrutar.
          badWarehouseId:
            totalBad > 0 && badWarehouseId ? Number(badWarehouseId) : null,
          badStockTypeId:
            totalBad > 0 && badStockTypeId ? Number(badStockTypeId) : null,
        },
        payload
      );
      toast({ title: "Recepción registrada", variant: "success" });
      onReceived?.();
      // Se queda abierto para imprimir la guía de lo que entró (solo lo
      // bueno: la merma va a su propio almacén y no es lo que se ingresa).
      const almacen = warehouses.find((w) => String(w.id) === warehouseId);
      setSent({
        stockEntryId,
        warehouseName: almacen?.name ?? "",
        warehouseAddress: almacen?.address ?? null,
        lines: rows
          .filter((row) => num(row.good) > 0)
          .map((row) => ({
            sku: row.item.variationSku ?? "",
            productName: row.item.variationLabel ?? row.item.name,
            quantity: num(row.good),
          })),
      });
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la recepción",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const blocked = items.length - receivable.length;

  /** Los dos selectores de un destino, que se repiten para bueno y para malo. */
  const destino = (
    idPrefijo: string,
    almacen: string,
    setAlmacen: (value: string) => void,
    tipo: string,
    setTipo: (value: string) => void
  ) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefijo}-warehouse`}>Almacén</Label>
        <Select value={almacen} onValueChange={setAlmacen}>
          <SelectTrigger id={`${idPrefijo}-warehouse`}>
            <SelectValue
              placeholder={
                loadingCatalogs ? "Cargando..." : "Seleccione el almacén"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefijo}-stock-type`}>Tipo de stock</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger id={`${idPrefijo}-stock-type`}>
            <SelectValue
              placeholder={loadingCatalogs ? "Cargando..." : "Seleccione el tipo"}
            />
          </SelectTrigger>
          <SelectContent>
            {stockTypes.map((stockType) => (
              <SelectItem key={stockType.id} value={String(stockType.id)}>
                {stockType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Flex en columna con tope de alto: el cuerpo scrollea y el footer con
          «Recibir» queda siempre a la vista. Antes el diálogo crecía con las
          prendas y el botón salía del pop-up. Ancho 4xl para que quepan las
          siete columnas; en móvil, la pantalla menos margen. */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Recibir a stock
          </DialogTitle>
          <DialogDescription>
            El producto sale de cada prenda de la orden, así que no hay que
            buscarlo. Elige a qué almacén entra y con qué tipo de stock.
          </DialogDescription>
        </DialogHeader>

        {sent !== null ? (
          /* Ya guardado. El PDF se abre desde aquí y no solo: un window.open
             fuera de un click lo bloquea el navegador. */
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Recepción registrada
              {sent.warehouseName ? ` en ${sent.warehouseName}` : ""}.
            </p>
            {sent.stockEntryId === null || sent.lines.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No hay unidades buenas que imprimir en la guía.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                  openProductionIntakeGuide({
                    stockEntryId: sent.stockEntryId as number,
                    orderLabel: productionOrderLabel ?? `#${productionOrderId}`,
                    warehouseName: sent.warehouseName,
                    warehouseAddress: sent.warehouseAddress,
                    lines: sent.lines,
                  })
                }
              >
                <Printer className="h-4 w-4" />
                Imprimir guía de ingreso
              </Button>
            )}
          </div>
        ) : (
          <>

        {blocked > 0 && (
          <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {blocked} {blocked === 1 ? "prenda" : "prendas"} sin producto
              asignado no {blocked === 1 ? "puede" : "pueden"} entrar a stock.
              Asígnaselo en los ítems de la orden.
            </span>
          </p>
        )}

        {/* min-h-0 es lo que permite al hijo flex recortar; sin él el
            contenido empuja al footer fuera. */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Una o todas, como en el avance de varias prendas. */}
                    <TableHead className="w-10">
                      <Checkbox
                        checked={todas}
                        onCheckedChange={(value) => toggleTodas(value === true)}
                        disabled={marcables.length === 0}
                        aria-label="Marcar todas las prendas"
                      />
                    </TableHead>
                    <TableHead className="min-w-48">Prenda</TableHead>
                    <TableHead className="w-20 text-right">Pedidas</TableHead>
                    {/* De dónde sale la cifra que se propone: sin esta
                        columna, «Pedidas 15» y «Buenas 25» no se explican. */}
                    <TableHead className="w-20 text-right">Salieron</TableHead>
                    <TableHead className="w-20 text-right">
                      Recibidas
                    </TableHead>
                    <TableHead className="w-28 text-right">Buenas</TableHead>
                    <TableHead className="w-28 text-right">Malas</TableHead>
                    {/* «Ya no entra más»: cierra la prenda a mano. */}
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivable.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Ninguna prenda de esta orden tiene producto asignado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivable.map((item) => {
                      const marcada = selected.has(item.id as number);
                      const cerrada = estaCerrada(item);
                      const bloqueada = cerrada || !marcada;
                      return (
                      <TableRow
                        key={item.id}
                        className={marcada ? undefined : "opacity-60"}
                      >
                        <TableCell>
                          <Checkbox
                            checked={marcada}
                            onCheckedChange={(value) =>
                              toggleItem(item.id as number, value === true)
                            }
                            disabled={cerrada}
                            aria-label={`Ingresar ${item.variationLabel ?? item.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span>{item.variationLabel ?? item.name}</span>
                          {item.variationSku && (
                            <span className="text-muted-foreground block text-xs">
                              {item.variationSku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.routeOutput === null ? (
                            <span
                              className="text-muted-foreground"
                              title="Un servicio cubre varias prendas: no se sabe cuántas salieron de cada una"
                            >
                              —
                            </span>
                          ) : (
                            item.routeOutput
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {item.received > 0 ? item.received : "—"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            className={CAMPO_NUMERO}
                            disabled={bloqueada}
                            title={
                              cerrada
                                ? "Ingreso cerrado: ya no entra más de esta prenda"
                                : !marcada
                                  ? "Marca la prenda para ingresarla"
                                  : undefined
                            }
                            value={inputs[item.id as number]?.good ?? ""}
                            onChange={(e) =>
                              setField(
                                item.id as number,
                                "good",
                                e.target.value
                              )
                            }
                            aria-label={`Buenas de ${item.variationLabel ?? item.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            className={CAMPO_NUMERO}
                            disabled={bloqueada}
                            value={inputs[item.id as number]?.bad ?? ""}
                            onChange={(e) =>
                              setField(item.id as number, "bad", e.target.value)
                            }
                            aria-label={`Malas de ${item.variationLabel ?? item.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {cerrada ? (
                            <Badge
                              variant="success"
                              title="Ya no entra más de esta prenda"
                            >
                              Ingresado
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 px-2 text-xs"
                              onClick={() => setClosing(item)}
                              title="Marcar que ya no entrará más de esta prenda"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Cerrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Se dice y se deja guardar: la discrepancia se ve, no se capa. */}
            {excedidas.length > 0 && (
              <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {excedidas.map((row) => (
                    <span key={row.item.id} className="block">
                      De {row.item.variationLabel ?? row.item.name} salieron{" "}
                      {restanteDe(row.item)} por ingresar y se declaran{" "}
                      {num(row.good) + num(row.bad)}. Entra igual; si sobra,
                      luego cierra la prenda con «Cerrar».
                    </span>
                  ))}
                </span>
              </p>
            )}

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">
                Dónde entran las buenas
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {totalGood} uds
                </span>
              </p>
              {destino(
                "receive-good",
                warehouseId,
                setWarehouseId,
                stockTypeId,
                setStockTypeId
              )}
            </div>

            {/* Solo cuando hay merma declarada: sin ella, dos selectores más
                serían dos preguntas sobre algo que no existe. */}
            {totalBad > 0 && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">
                  Dónde entran las malas
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {totalBad} uds
                  </span>
                </p>
                {destino(
                  "receive-bad",
                  badWarehouseId,
                  setBadWarehouseId,
                  badStockTypeId,
                  setBadStockTypeId
                )}
                <p className="text-muted-foreground text-xs">
                  Solo lo que entra como Producción cuenta para cerrar la
                  orden. Lo que entre con otro tipo queda en almacén sin
                  darla por recibida.
                </p>
              </div>
            )}
          </div>
        </div>

        {!loadingCatalogs && warehouses.length === 0 && (
          <p className="text-destructive text-sm">
            No hay almacenes activos, así que no hay dónde recibir.
          </p>
        )}

          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {sent !== null ? "Cerrar" : "Cancelar"}
          </Button>
          <Button
            onClick={handleSubmit}
            className={sent !== null ? "hidden" : undefined}
            disabled={saving || loadingCatalogs || !warehouseId || total <= 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recibiendo...
              </>
            ) : (
              `Recibir ${total} uds`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmación: el cierre es definitivo y no se reabre desde el ERP. */}
      <AlertDialog
        open={closing !== null}
        onOpenChange={(value) => !value && !closingSaving && setClosing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar el ingreso de esta prenda?</AlertDialogTitle>
            <AlertDialogDescription>
              {closing?.variationLabel ?? closing?.name}: no se podrá ingresar
              más a stock de esta prenda, aunque falten unidades. Esta acción
              no se deshace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // El AlertDialog cierra solo al pulsar; se espera al servidor.
                event.preventDefault();
                handleCloseIntake();
              }}
              disabled={closingSaving}
            >
              {closingSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                "Sí, cerrar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
