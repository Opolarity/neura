import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { DateField } from "@/shared/components/date-range";
import { formatDocumentMoney } from "@/shared/utils/currency";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupplierQuotationApi } from "@/modules/quotations/services/Quotations.service";
import {
  MaterialSupplier,
  materialSuppliersApi,
  supplierOptionsApi,
} from "../../services/materials.service";
import { SupplierOption } from "../../types/materials.types";
import { MaterialRequirementRow } from "../../types/materialRequirement.types";
import { TaxIncludedSelect } from "./TaxIncludedSelect";
import { TAX_UNSET, toIncludesTax } from "../../utils/taxIncluded";

interface MaterialPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number;
  /** OP-0028. Va en la descripción de la cotización. */
  orderCode: string | null;
  /** Los materiales del requerimiento, TODOS: los que faltan vienen marcados. */
  materials: MaterialRequirementRow[];
  /**
   * Todos marcados al abrir, en vez de solo los que faltan.
   *
   * Es lo que usa el boton de cada fila del requerimiento: si se pide comprar
   * ESE material, viene elegido -- aunque hoy alcance, que es justo cuando se
   * repone.
   */
  marcarTodo?: boolean;
  onCreated: () => void;
}

/** Lo que se pide de un material, editable. */
interface Linea {
  marcado: boolean;
  cantidad: string;
  precio: string;
  /**
   * Si el unitario lleva el IGV dentro. Por LÍNEA y no para todo el diálogo:
   * cada material puede venir de una factura distinta. Solo rotula.
   */
  igv: string;
  supplierId: number | null;
}

/** Lo pactado con UN proveedor: es lo que llevará su Orden de Compra. */
interface Pacto {
  currency: string;
  paymentTerms: string;
  promisedDate: string;
  notes: string;
}

const PACTO_NUEVO: Pacto = {
  currency: "PEN",
  paymentTerms: "",
  promisedDate: "",
  notes: "",
};

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * El importe con el símbolo de SU moneda. Traía «S/» clavado, y con una
 * moneda por proveedor eso enseñaría soles en una orden en dólares.
 */
const money = (value: number, currency?: string | null) =>
  formatDocumentMoney(value, currency ?? "PEN");

/**
 * El TOTAL de una línea, o null si falta cantidad o precio.
 *
 * Lo que se teclea es el unitario --es lo que trae la ficha del material y lo
 * que el usuario conoce--, pero `price` en la cotización es el total de la
 * línea: así lo dejó escrito la migración que retiró `unit_price`, y así lo
 * leen los SPs (unitario = price / quantity) y los papeles. Mandar el
 * unitario a secas dejaba 50 kg a S/ 10 como una compra de S/ 10.
 */
const lineTotal = (linea: Linea | undefined): number | null => {
  if (!linea || linea.precio.trim() === "" || linea.cantidad.trim() === "") {
    return null;
  }
  const unitario = Number(linea.precio);
  const cantidad = Number(linea.cantidad);
  if (!Number.isFinite(unitario) || !Number.isFinite(cantidad)) return null;
  return Math.round(unitario * cantidad * 100) / 100;
};

/**
 * Comprar lo que falta, desde la explosión.
 *
 * Aquí no hay «orden de compra» como entidad aparte: en este ERP comprar
 * material ES un servicio con `material_id` dentro de una cotización, y al
 * recibirlo el stock entra por el mismo camino que cualquier otro servicio.
 * Por eso lo que sale de aquí son cotizaciones, no un documento nuevo.
 *
 * ## El proveedor va por MATERIAL
 *
 * Cada línea arranca con el proveedor de la ficha del material —a quien se le
 * compra siempre— y se puede cambiar. Al confirmar, las líneas se AGRUPAN por
 * proveedor: si todas coinciden sale una cotización, y si no, una por cada
 * uno.
 *
 * No es un capricho de la pantalla: `supplier_service_quotations` tiene UN
 * `supplier_id`. Una cotización con dos proveedores no existe en el modelo, y
 * fingir lo contrario en la interfaz solo trasladaría el problema al guardar.
 */
export const MaterialPurchaseDialog = ({
  open,
  onOpenChange,
  productionOrderId,
  orderCode,
  materials,
  marcarTodo = false,
  onCreated,
}: MaterialPurchaseDialogProps) => {
  const [lineas, setLineas] = useState<Record<number, Linea>>({});
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  /**
   * Lo pactado, POR PROVEEDOR.
   *
   * De este diálogo sale una Orden de Compra por proveedor, y cada una se
   * negocia con el suyo: la moneda, la condición de pago, cuándo entrega y lo
   * que haya que decirle son de ESA orden, no del rato que se pasó aquí. Con
   * un solo juego de campos, pactar 30 días con uno se lo imponía al otro.
   */
  const [pactos, setPactos] = useState<Record<number, Pacto>>({});
  /**
   * En qué paso está el diálogo.
   *
   * Dos y no uno largo: elegir QUÉ se compra y pactar CÓMO son dos momentos, y
   * apilados hacían crecer el diálogo con cada proveedor hasta sacarlo de la
   * pantalla. Es el mismo reparto que la Orden de Servicio, que pregunta lo
   * suyo por cada una.
   */
  const [paso, setPaso] = useState<"materiales" | "pactos">("materiales");
  /**
   * Con UNA sola orden no hay paso a paso: cabe todo en una pantalla y
   * partirlo en dos solo añade un clic. El reparto en pasos existe para que
   * el dialogo no crezca con cada proveedor, y con uno no crece.
   */
  /** Qué orden de compra se está pactando, dentro de `ordenes`. */
  const [indicePacto, setIndicePacto] = useState(0);

  // TODOS los materiales de la orden, no solo los que faltan.
  //
  // Antes solo salían los que no alcanzaban, para no comprar lo que ya está en
  // almacén. Pero eso decidía por el usuario: si de paso quiere reponer un
  // material que hoy alcanza, tenía que salir a Cotizaciones y armarla a mano.
  //
  // La protección no se pierde, cambia de sitio: los que faltan vienen
  // marcados y con su cantidad puesta; el resto viene desmarcado y en blanco,
  // así que comprar de más es una decisión que hay que tomar, no algo que pase
  // por no mirar.
  const comprables = materials;

  /** Cuántos no alcanzan. Es lo que decide qué viene marcado al abrir. */
  const faltantes = useMemo(
    () => materials.filter((material) => material.missing > 0),
    [materials]
  );

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setLoading(true);

    Promise.all([
      materialSuppliersApi(comprables.map((material) => material.materialId)),
      supplierOptionsApi(null),
    ])
      .then(([porMaterial, lista]: [MaterialSupplier[], SupplierOption[]]) => {
        if (cancelado) return;
        setSuppliers(lista);
        setPaso("materiales");
        setIndicePacto(0);
        setPactos({});
        setLineas(
          Object.fromEntries(
            comprables.map((material) => [
              material.materialId,
              {
                // Marcado solo lo que falta: el diálogo se abre para cubrir el
                // faltante, y lo demás está ahí por si de paso hace falta.
                marcado: marcarTodo || material.missing > 0,
                // Lo que falta, y si no falta nada la cantidad la pone quien
                // compra: reponer no tiene un numero evidente.
                cantidad: material.missing > 0 ? String(material.missing) : "",
                precio:
                  material.unitCost === null ? "" : String(material.unitCost),
                igv: TAX_UNSET,
                supplierId:
                  porMaterial.find((p) => p.materialId === material.materialId)
                    ?.supplierId ?? null,
              },
            ])
          )
        );
      })
      .catch(() => {
        if (!cancelado) {
          toast({
            title: "No se pudieron cargar los proveedores",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
    // Al abrir. `faltantes` se recalcula con los materiales, que no cambian
    // mientras el diálogo está abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pactoDe = (supplierId: number | null | undefined): Pacto =>
    (supplierId == null ? undefined : pactos[supplierId]) ?? PACTO_NUEVO;

  const setPacto = (supplierId: number, cambio: Partial<Pacto>) =>
    setPactos((prev) => ({
      ...prev,
      [supplierId]: { ...(prev[supplierId] ?? PACTO_NUEVO), ...cambio },
    }));

  const setLinea = (materialId: number, cambio: Partial<Linea>) =>
    setLineas((prev) => ({
      ...prev,
      [materialId]: { ...prev[materialId], ...cambio },
    }));

  const elegidas = comprables.filter(
    (material) => lineas[material.materialId]?.marcado
  );

  /** Cuántas cotizaciones van a salir: una por proveedor distinto. */
  const porProveedor = useMemo(() => {
    const mapa = new Map<number, MaterialRequirementRow[]>();
    elegidas.forEach((material) => {
      const supplierId = lineas[material.materialId]?.supplierId;
      if (supplierId == null) return;
      const grupo = mapa.get(supplierId);
      if (grupo) grupo.push(material);
      else mapa.set(supplierId, [material]);
    });
    return mapa;
  }, [elegidas, lineas]);

  const sinProveedor = elegidas.filter(
    (material) => lineas[material.materialId]?.supplierId == null
  );

  /** Las órdenes que van a salir, en el orden en que se van a pactar. */
  const ordenes = useMemo(() => [...porProveedor], [porProveedor]);

  /** Con una sola orden se enseña todo junto y el pie crea directamente. */
  const enUnPaso = ordenes.length <= 1;

  /** Para pasar a pactar hace falta que haya algo que pactar y esté completo. */
  const puedeContinuar =
    elegidas.length > 0 && sinProveedor.length === 0 && !saving && !loading;

  const puedeGuardar = puedeContinuar;

  const handleSubmit = async () => {
    if (!puedeGuardar) return;

    setSaving(true);
    try {
      // Una cotización por proveedor, en serie: si la segunda falla, la
      // primera YA está creada. Se avisa con el número real en vez de dejar
      // creer que no entró ninguna.
      let creadas = 0;
      for (const [supplierId, delProveedor] of porProveedor) {
        await createSupplierQuotationApi({
          supplier_id: supplierId,
          subject: `Materiales${orderCode ? ` - ${orderCode}` : ""}`,
          // La nota va a request_description, que es de donde la sacan las
          // Observaciones del papel. Mismo camino que la Orden de Servicio.
          request_description: pactoDe(supplierId).notes.trim() || null,
          currency: pactoDe(supplierId).currency,
          payment_terms: pactoDe(supplierId).paymentTerms.trim() || null,
          services: delProveedor.map((material) => ({
            description: material.materialName,
            supplier_class_id: null,
            material_id: material.materialId,
            production_order_id: productionOrderId,
            quantity: Number(lineas[material.materialId]?.cantidad || 0),
            // El total de la línea, que es lo que guarda `price`.
            price: lineTotal(lineas[material.materialId]),
            price_includes_tax:
              lineTotal(lineas[material.materialId]) === null
                ? null
                : toIncludesTax(lineas[material.materialId]?.igv ?? TAX_UNSET),
            measurement_unit: material.measurementUnit || null,
            // La fecha vive POR LÍNEA en la base (supplier_services), pero se
            // pacta una sola vez con el proveedor, así que aquí va la misma a
            // todas sus líneas. Igual que en la Orden de Servicio.
            promised_date: pactoDe(supplierId).promisedDate || null,
          })),
        });
        creadas += 1;
      }

      toast({
        title:
          creadas === 1
            ? "Cotización creada"
            : `${creadas} cotizaciones creadas`,
        description: "Una por proveedor, con un servicio por material.",
      });
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "No se pudieron crear todas las cotizaciones",
        description:
          error instanceof Error
            ? error.message
            : "Revisa cuáles entraron antes de repetir.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Alto TOPE y columna. Sin `max-h` el dialogo crecia con su contenido
          --y con un bloque por proveedor crecia mucho-- hasta salirse de la
          pantalla por arriba y por abajo, sin nada que desplazar: eso era el
          «no funciona el scroll». Ahora el cuerpo rueda por dentro y la
          cabecera y el pie se quedan. */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comprar material</DialogTitle>
          <DialogDescription>
            Vienen marcados los que no alcanzan, con su faltante puesto. Los
            demás están por si de paso hace falta reponer. Sale una cotización
            por proveedor, con un servicio por material; al recibirla, el stock
            entra solo.
          </DialogDescription>
        </DialogHeader>

        {(enUnPaso || paso === "materiales") && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando proveedores...
          </div>
        ) : comprables.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            La orden todavía no tiene materiales que comprar.
          </p>
        ) : (
            /* Un div con `overflow-y-auto`, no un ScrollArea.

                El Viewport de Radix es `h-full`, y dentro de un elemento flex
                el 100% NO resuelve --la altura del padre sale del reparto, no
                de una altura declarada--: el viewport crece con su contenido y
                el Root, que es `overflow-hidden`, lo RECORTA sin desplazar.
                Antes funcionaba porque el padre llevaba un `max-h-[52vh]`
                clavado, que si es una altura declarada. Medido en una maqueta
                con estas clases: con ScrollArea, clientH = scrollH = 1482 y el
                root en 548, o sea 934 px recortados; con el div plano,
                clientH 550 sobre scrollH 1482, que es desplazar. */
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="divide-y rounded-md border">
                <div className="text-muted-foreground grid grid-cols-[1.5rem_1fr_6rem_6rem_7rem_9rem_13rem] items-center gap-3 px-3 py-2 text-xs">
                  <span />
                  <span>Material</span>
                  <span className="text-right">Cantidad</span>
                  <span className="text-right">P. unitario</span>
                  <span className="text-right">Costo total</span>
                  <span>IGV</span>
                  <span>Proveedor</span>
                </div>

                {comprables.map((material) => {
                  const linea = lineas[material.materialId];
                  return (
                    <div
                      key={material.materialId}
                      className="grid grid-cols-[1.5rem_1fr_6rem_6rem_7rem_9rem_13rem] items-center gap-3 px-3 py-2"
                    >
                      <Checkbox
                        checked={linea?.marcado ?? false}
                        onCheckedChange={(value) =>
                          setLinea(material.materialId, {
                            marcado: value === true,
                          })
                        }
                        aria-label={`Comprar ${material.materialName}`}
                      />

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm"
                          title={material.materialName}
                        >
                          {material.materialName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {/* «Faltan 0» no es una frase: el que alcanza lo dice
                              con palabras. */}
                          {material.missing > 0
                            ? `Faltan ${fmt(material.missing)} ${material.measurementUnit}`
                            : "Alcanza"}
                          {/* «En almacén» a secas mentía desde que hay
                              almacenes de taller: decía que el material estaba
                              a mano cuando parte de ese saldo ya se había
                              mandado. Se dice dónde está, y solo cuando hay
                              algo fuera. */}
                          {` · en almacén ${fmt(material.stockOwn)} ${material.measurementUnit}`}
                          {material.stockAtSuppliers > 0 &&
                            ` · en talleres ${fmt(material.stockAtSuppliers)} ${material.measurementUnit}`}
                        </div>
                      </div>

                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        className="h-8 text-right"
                        value={linea?.cantidad ?? ""}
                        onChange={(e) =>
                          setLinea(material.materialId, {
                            cantidad: e.target.value,
                          })
                        }
                        aria-label={`Cantidad de ${material.materialName}`}
                      />

                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 text-right"
                        value={linea?.precio ?? ""}
                        onChange={(e) =>
                          setLinea(material.materialId, {
                            precio: e.target.value,
                          })
                        }
                        aria-label={`Precio unitario de ${material.materialName}`}
                      />

                      {/* Lo que de verdad se guarda y lo que sale en el papel:
                          se enseña antes de confirmar para que no sorprenda. */}
                      <span className="text-right text-sm tabular-nums">
                        {(() => {
                          const total = lineTotal(linea);
                          // En la moneda de SU proveedor: la orden que va
                          // a salir es la de él, no una general.
                          return total === null
                            ? "—"
                            : money(total, pactoDe(linea?.supplierId).currency);
                        })()}
                      </span>

                      {/* Como en Cotizaciones: si el unitario lleva el IGV. */}
                      <TaxIncludedSelect
                        compact
                        value={linea?.igv ?? TAX_UNSET}
                        onValueChange={(value) =>
                          setLinea(material.materialId, { igv: value })
                        }
                        disabled={lineTotal(linea) === null}
                        aria-label={`IGV de ${material.materialName}`}
                      />

                      <Select
                        value={
                          linea?.supplierId != null
                            ? String(linea.supplierId)
                            : ""
                        }
                        onValueChange={(value) =>
                          setLinea(material.materialId, {
                            supplierId: Number(value),
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Elegir proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem
                              key={supplier.id}
                              value={String(supplier.id)}
                            >
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {/* Cuántos documentos van a salir, antes de pulsar: es lo que
              sorprende si no se dice -- una cotización no puede tener dos
              proveedores. */}
          {elegidas.length > 0 && (
            <Badge variant="secondary">
              {porProveedor.size === 1
                ? "1 cotización"
                : `${porProveedor.size} cotizaciones`}{" "}
              · {elegidas.length}{" "}
              {elegidas.length === 1 ? "material" : "materiales"}
            </Badge>
          )}
          {sinProveedor.length > 0 && (
            <span className="text-destructive text-xs">
              {sinProveedor.length}{" "}
              {sinProveedor.length === 1
                ? "material sin proveedor"
                : "materiales sin proveedor"}
              : elígelo o desmárcalo.
            </span>
          )}
        </div>
        </div>
        )}

        {/* PASO 2: lo pactado, UNA ORDEN CADA VEZ.
            
            De aquí sale una Orden de Compra por proveedor, y cada una se
            negocia con el suyo: la moneda, la condición de pago, cuándo
            entrega y lo que haya que decirle son de ESA orden.

            De una en una y no todas apiladas, como en la Orden de Servicio:
            apiladas, tres proveedores eran doce campos creciendo hacia abajo
            hasta sacar el diálogo de la pantalla. Aquí siempre se ve una, y el
            pie dice por cuál se va. */}
        {(enUnPaso || paso === "pactos") && ordenes.length > 0 && (
          <div
            className={
              enUnPaso
                ? "shrink-0 space-y-3"
                : "min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
            }
          >
            <Label>
              {enUnPaso
                ? "Lo pactado con el proveedor"
                : `Orden ${indicePacto + 1} de ${ordenes.length}`}
            </Label>

            {ordenes
              .slice(enUnPaso ? 0 : indicePacto, (enUnPaso ? 0 : indicePacto) + 1)
              .map(([supplierId, delProveedor]) => {
              const pacto = pactoDe(supplierId);
              const nombre =
                suppliers.find((s) => s.id === supplierId)?.name ??
                `Proveedor #${supplierId}`;
              const total = delProveedor.reduce(
                (suma, material) =>
                  suma + (lineTotal(lineas[material.materialId]) ?? 0),
                0
              );

              return (
                <div
                  key={supplierId}
                  className="space-y-3 rounded-md border p-3"
                >
                  {/* Qué orden se está pactando: de quién es y qué lleva. Sin
                      esto, con dos proveedores los campos se repiten sin que
                      nada diga cuál es cuál. */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{nombre}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {delProveedor.length}{" "}
                      {delProveedor.length === 1 ? "material" : "materiales"} ·{" "}
                      {money(total, pacto.currency)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`purchase-currency-${supplierId}`}>
                        Moneda
                      </Label>
                      <CurrencySelect
                        id={`purchase-currency-${supplierId}`}
                        value={pacto.currency}
                        onValueChange={(value) =>
                          setPacto(supplierId, { currency: value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`purchase-payment-terms-${supplierId}`}>
                        Condición de pago{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          · opcional
                        </span>
                      </Label>
                      <Input
                        id={`purchase-payment-terms-${supplierId}`}
                        value={pacto.paymentTerms}
                        onChange={(event) =>
                          setPacto(supplierId, {
                            paymentTerms: event.target.value,
                          })
                        }
                        placeholder="Ej: 30 días"
                      />
                    </div>
                  </div>

                  {/* Cuándo entrega ESTE proveedor. En la base vive por línea;
                      aquí todas las suyas se pactan juntas, que es como se
                      pacta con él.

                      DateField y no un `input type="date"`: es el selector del
                      sistema --el mismo de los filtros y el de la entrega de
                      la orden-- y así las fechas se eligen igual en todas las
                      pantallas en vez de con el calendario que ponga cada
                      navegador.

                      maxDate null: es una fecha al FUTURO, y el tope de hoy
                      que DateField trae por defecto la bloquearía entera. */}
                  <div className="space-y-2">
                    <Label htmlFor={`purchase-promised-date-${supplierId}`}>
                      Fecha comprometida{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        · opcional
                      </span>
                    </Label>
                    <DateField
                      id={`purchase-promised-date-${supplierId}`}
                      value={pacto.promisedDate || null}
                      onChange={(value) =>
                        setPacto(supplierId, { promisedDate: value ?? "" })
                      }
                      maxDate={null}
                      showClear
                      placeholder="Sin fecha comprometida"
                    />
                  </div>

                  {/* Lo que este proveedor tiene que leer en su papel: sale en
                      las Observaciones de SU Orden de Compra. */}
                  <div className="space-y-2">
                    <Label htmlFor={`purchase-notes-${supplierId}`}>
                      Notas{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        · opcional
                      </span>
                    </Label>
                    <Textarea
                      id={`purchase-notes-${supplierId}`}
                      value={pacto.notes}
                      onChange={(event) =>
                        setPacto(supplierId, { notes: event.target.value })
                      }
                      placeholder="Ej: Entregar en dos lotes. Facturar a 30 días."
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* El pie cambia con el paso, y es lo que dice dónde se está. Con una
            sola orden no hay pasos: se crea y ya. */}
        <DialogFooter className="shrink-0">
          {enUnPaso ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!puedeGuardar}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Crear la orden
              </Button>
            </>
          ) : paso === "materiales" ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setIndicePacto(0);
                  setPaso("pactos");
                }}
                disabled={!puedeContinuar}
                className="gap-2"
              >
                Continuar
                {ordenes.length > 0 && (
                  <span className="opacity-80">
                    · {ordenes.length}{" "}
                    {ordenes.length === 1 ? "orden" : "órdenes"}
                  </span>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Atrás vuelve a los materiales desde la primera, y a la orden
                  anterior desde cualquier otra: no hay callejón sin salida. */}
              <Button
                variant="outline"
                disabled={saving}
                onClick={() =>
                  indicePacto === 0
                    ? setPaso("materiales")
                    : setIndicePacto((actual) => actual - 1)
                }
              >
                Atrás
              </Button>
              {indicePacto < ordenes.length - 1 ? (
                <Button
                  onClick={() => setIndicePacto((actual) => actual + 1)}
                  className="gap-2"
                >
                  Siguiente orden
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!puedeGuardar}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  {ordenes.length === 1
                    ? "Crear la orden"
                    : `Crear ${ordenes.length} órdenes`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPurchaseDialog;
