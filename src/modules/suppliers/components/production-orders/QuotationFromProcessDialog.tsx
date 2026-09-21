import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
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
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/utils/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { DateField } from "@/shared/components/date-range";
import { taxBreakdown } from "@/shared/utils/tax";
import { TaxIncludedSelect } from "./TaxIncludedSelect";
import { TAX_UNSET, toIncludesTax } from "../../utils/taxIncluded";
import { EntityCombobox } from "../EntityCombobox";
import { AddSupplierModal } from "../suppliers/AddSupplierModal";
import { supplierOptionsApi } from "../../services/materials.service";
import { SupplierOption } from "../../types/materials.types";
import { ProductionOrderItemOption } from "../../types/productionOrderProcesses.types";
import { createSupplierQuotationApi } from "@/modules/quotations/services/Quotations.service";
import { QuotationConsumptionsDialog } from "@/modules/quotations/components/quotations/QuotationConsumptionsDialog";

interface QuotationFromProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number;
  processGroupId: number;
  processName: string;
  /**
   * OP-0028. Es lo que identifica la cotización de un vistazo.
   *
   * Null en una orden anterior al código (no debería quedar ninguna): ahí se
   * cae al id, que es lo que había antes.
   */
  productionOrderCode?: string | null;
  /** La posición del proceso en la ruta, base 1. */
  stepOrder: number;
  /** El total de prendas de la orden. Solo para enseñarlo antes de guardar. */
  orderQuantity: number;
  /**
   * Las prendas de la orden. Se eligen aquí: de cada una elegida nace su propio
   * servicio, con SU cantidad.
   */
  items: ProductionOrderItemOption[];
  onCreated: () => void;
}

/**
 * El código de cada SERVICIO y el nombre de la cotización: «CORTE-38»,
 * «Corte - OP-0028».
 *
 * Se arman aquí y no se piden porque no hay nada que decidir: es el proceso y
 * la orden.
 *
 * Ojo con el código: ya NO es el de la cotización. Ese lo numera el backend
 * --OS-0001-- desde la 202610010113, justamente porque este chocaba al cotizar
 * el mismo corte a dos proveedores. Aquí se queda como código del servicio,
 * que no es único ni pretende serlo.
 */
const buildCode = (processName: string, productionOrderId: number): string =>
  `${processName.trim().toUpperCase().replace(/\s+/g, "-")}-${productionOrderId}`;

/**
 * «Corte - OP-0028»: el proceso y el CÓDIGO de la orden.
 *
 * El código y no el id, que es lo que había: el id es un número interno que no
 * se dice por teléfono ni aparece en ningún papel, así que una cotización
 * llamada «Corte 1834» no se podía cruzar con nada. `OP-0028` sí es como se
 * llama la orden en la lista, en su PDF y en la guía de remisión.
 */
const buildName = (
  processName: string,
  productionOrderId: number,
  productionOrderCode: string | null,
): string =>
  `${processName.trim()} - ${productionOrderCode ?? `#${productionOrderId}`}`;

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Crear la cotización de un proceso sin salir de la orden.
 *
 * Antes esto eran cuatro pantallas: ir a Cotizaciones, crearla, volver a la
 * orden, vincular el servicio y asignarle el proceso. Aquí se piden **el
 * proveedor y qué prendas entran al paso**: el resto ya lo sabe el sistema —el
 * nombre sale del proceso y la orden, la cantidad de cada servicio es la de su
 * prenda, y la clase la resuelve el backend— y los servicios nacen ya atados a
 * la orden Y al proceso.
 *
 * Se crea **un servicio por prenda elegida**, no uno para todo el lote: es lo
 * que deja que cada talla lleve su propia situación, su stock y sus fechas sin
 * tablas puente. Empiezan todas marcadas, que es el caso normal —el paso cubre
 * la orden entera—, y destildar es para cuando una talla va por otro camino.
 *
 * El precio es opcional a propósito: cotizar es justamente pedirlo, así que
 * exigirlo aquí obligaría a inventarlo. Se rellena después, al avanzar.
 *
 * Y es UNITARIO, por prenda. El total de cada servicio --que es lo que guarda
 * `price`-- se calcula aquí como unitario × las prendas de esa variación, y por
 * eso se manda una entrada por prenda y no una con todas: el backend le pasaba
 * el mismo `price` a los N servicios, así que un unitario tecleado ahí quedaba
 * como el total de cada uno.
 *
 * Lo que se va a crear se enseña en modo lectura antes de guardar. Con tanto
 * campo automático, no enseñarlos convertiría el botón en una caja negra.
 */
export const QuotationFromProcessDialog = ({
  open,
  onOpenChange,
  productionOrderId,
  processGroupId,
  processName,
  productionOrderCode = null,
  stepOrder,
  orderQuantity,
  items,
  onCreated,
}: QuotationFromProcessDialogProps) => {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierLabel, setSupplierLabel] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  /** Alta de proveedor en línea, sin salir de la orden. */
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [price, setPrice] = useState("");
  /**
   * Si el precio unitario ya lleva el IGV. Arranca sin declarar, como las
   * líneas de siempre; solo rotula, no cambia el precio. Uno para todas las
   * prendas del paso: se pactan juntas con el mismo taller.
   */
  const [priceIncludesTax, setPriceIncludesTax] = useState<string>(TAX_UNSET);
  /** Lo pactado: rige los importes de la Orden de Servicio que salga de aquí. */
  const [currency, setCurrency] = useState("PEN");
  const [paymentTerms, setPaymentTerms] = useState("");
  /** Cuando se espera el trabajo (YYYY-MM-DD). Una para todos los servicios del paso. */
  const [promisedDate, setPromisedDate] = useState("");
  /**
   * Las notas de la cotización. Van a request_description y salen en las
   * Observaciones de la Orden de Servicio; se pueden seguir editando desde
   * el detalle de la cotización.
   */
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  /**
   * La cotización que acaba de nacer, para declararle el consumo aquí mismo.
   *
   * Declarar qué consume el paso es la frase siguiente a decir quién lo hace,
   * así que encadena: antes había que salir de la orden, ir a Cotizaciones,
   * buscarla y abrirla. Se hace DESPUÉS de crearla y no antes porque los
   * materiales candidatos se derivan de las prendas que sus servicios
   * atraviesan, y esos servicios no existen hasta este momento.
   */
  const [recienCreada, setRecienCreada] = useState<{ id: number; code: string } | null>(null);
  /** Las prendas elegidas, por id. Arranca con todas: el caso normal es que el
      paso cubra la orden entera. */
  const [chosenIds, setChosenIds] = useState<number[]>([]);

  const code = buildCode(processName, productionOrderId);
  const name = buildName(processName, productionOrderId, productionOrderCode);

  useEffect(() => {
    if (!open) return;
    setSupplierId(null);
    setSupplierLabel(null);
    setSupplierSearch("");
    setPrice("");
    setPromisedDate("");
    setNotes("");
    setChosenIds(items.map((item) => item.id));
    // `items` fuera de las dependencias a proposito: se siembra al ABRIR. Si
    // entrara, cualquier recarga de la orden por debajo devolveria la seleccion
    // a "todas" y borraria lo que el usuario acabara de destildar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // La búsqueda de proveedores es server-side, igual que en el resto de
  // combobox de la orden. El debounce lo pone el padre del combobox: aquí es
  // este efecto.
  const debouncedSearch = useDebounce(supplierSearch, 300);
  useEffect(() => {
    if (!open) return;
    supplierOptionsApi(debouncedSearch || null)
      .then(setSuppliers)
      .catch(console.error);
  }, [open, debouncedSearch]);

  /**
   * Un proveedor recién creado desde aquí se selecciona solo: si hubo que
   * crearlo es porque es el de esta cotización, y hacer que el usuario lo
   * busque después de teclearlo sería pedirle el nombre dos veces. Se recarga
   * la lista sin filtro para que el combobox tenga la opción y su nombre.
   */
  const supplierCreated = async (supplierId: number) => {
    setSupplierSearch("");
    try {
      const lista = await supplierOptionsApi(null);
      setSuppliers(lista);
      const creado = lista.find((supplier) => supplier.id === supplierId);
      setSupplierId(supplierId);
      setSupplierLabel(creado?.name ?? `Proveedor #${supplierId}`);
    } catch (error) {
      console.error(error);
      setSupplierId(supplierId);
      setSupplierLabel(`Proveedor #${supplierId}`);
    }
  };

  const chosen = useMemo(
    () => items.filter((item) => chosenIds.includes(item.id)),
    [items, chosenIds]
  );
  const chosenQuantity = chosen.reduce((total, item) => total + item.quantity, 0);

  /** Lo tecleado, o null si está vacío o no es un número. */
  const unitPrice = useMemo(() => {
    const limpio = price.trim();
    if (limpio === "") return null;
    const valor = Number(limpio);
    return Number.isFinite(valor) ? valor : null;
  }, [price]);

  /** Lo que va a costar el paso entero. Se enseña para que el número se vea. */
  const totalEncargo = unitPrice === null ? null : unitPrice * chosenQuantity;
  /** El desglose del total, solo cuando el IGV está declarado. */
  const desglose = taxBreakdown(totalEncargo, toIncludesTax(priceIncludesTax));
  const allChosen = items.length > 0 && chosen.length === items.length;

  const toggleItem = (itemId: number) =>
    setChosenIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );

  const toggleAll = () =>
    setChosenIds(allChosen ? [] : items.map((item) => item.id));

  const handleSubmit = async () => {
    if (supplierId === null || chosen.length === 0) return;

    try {
      setSaving(true);
      const creada = await createSupplierQuotationApi({
        supplier_id: supplierId,
        subject: name,
        request_description: notes.trim() || null,
        currency,
        payment_terms: paymentTerms.trim() || null,
        // Sin `code`: el de la cotización lo numera el backend --OS-0001-- y
        // lo que se mandaba desde aquí era «CORTE-38», el proceso y el id de
        // la orden, que con dos proveedores para el mismo corte chocaba. El de
        // cada SERVICIO, más abajo, se queda: es otra cosa.
        // UNA ENTRADA POR PRENDA, no una con todas.
        //
        // Antes era una sola con `production_order_item_ids: chosenIds`, y el
        // backend la abría en N servicios pasándole a todos el MISMO `price`.
        // Como `price` es el total de la línea, escribir «4» pensando «4 soles
        // por polo» dejaba cada servicio valiendo 4 en total: el papel, el
        // costo de la orden y lo que se le debe al taller salían todos mal.
        //
        // Aquí el precio es UNITARIO, así que el total de cada servicio tiene
        // que ser el suyo, y eso necesita una entrada por prenda. El código se
        // repite entre ellas igual que antes: los N servicios ya compartían el
        // suyo, y `supplier_services.code` no es único.
        services: chosen.map((item) => ({
          // Solo el proceso. El código de la orden se lo antepone el backend
          // (fn_supplier_service_label), así que mandarlo aquí dejaría el
          // servicio llamado «OP-0028 · Corte - OP-0028».
          description: processName.trim(),
          code,
          // La clase la resuelve el backend: no sale del proveedor --sus
          // clases son otra cosa-- sino de la que este tenant ya usa en los
          // servicios de sus órdenes.
          supplier_class_id: null,
          production_order_id: productionOrderId,
          process_group_id: processGroupId,
          step_order: stepOrder,
          // Nula a propósito: el servicio toma la cantidad de SU prenda.
          // Mandarla desde aquí sería calcular en el frontend algo que la orden
          // ya sabe, y quedaría desfasada si la orden cambia mientras el
          // diálogo está abierto.
          quantity: null,
          // El TOTAL de esta línea, que es lo que guarda `price`: el unitario
          // por las prendas de ESTA variación.
          price: unitPrice === null ? null : unitPrice * item.quantity,
          // Solo rotula el precio; sin precio no hay nada que declarar.
          price_includes_tax:
            unitPrice === null ? null : toIncludesTax(priceIncludesTax),
          promised_date: promisedDate || null,
          production_order_item_ids: [item.id],
        })),
      });

      toast({
        title: `Cotización ${name} creada`,
        description:
          chosen.length === 1
            ? "1 servicio, uno por prenda."
            : `${chosen.length} servicios, uno por prenda.`,
      });
      onCreated();
      onOpenChange(false);

      // El paso siguiente, sin cambiar de pantalla. Si se cierra sin declarar
      // nada, el botón del detalle de la cotización sigue estando.
      if (creada?.id) {
        setRecienCreada({ id: creada.id, code: name });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "No se pudo crear la cotización",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mas ancho: la lista de prendas lleva nombre, cantidad y un check por
          fila, y en `md` el nombre se recortaba a la mitad. */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cotizar {processName}</DialogTitle>
          <DialogDescription>
            Se crea la cotización y su servicio, ya asignados a este proceso de
            la orden.
          </DialogDescription>
        </DialogHeader>

        {/* El cuerpo rueda; la cabecera y el pie se quedan.

            Sin esto el dialogo crecia con la lista de prendas -- una orden de
            quince tallas son quince filas -- y al pasarse del alto de la
            pantalla Radix lo centra y lo recorta por arriba y por abajo: se
            perdian el titulo y los botones a la vez.

            `overflow-y-auto` a secas y no el ScrollArea de Radix: hace lo
            mismo aqui y no arrastra sus rarezas. */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <div className="flex min-w-0 gap-2">
              <EntityCombobox
                className="min-w-0 flex-1"
                options={suppliers.map((supplier) => ({
                  id: supplier.id,
                  label: supplier.name,
                }))}
                value={supplierId}
                onSelect={(option) => {
                  setSupplierId(option.id);
                  setSupplierLabel(option.label);
                }}
                search={supplierSearch}
                onSearchChange={setSupplierSearch}
                fallbackLabel={supplierLabel}
                placeholder="Elige el proveedor"
                searchPlaceholder="Buscar proveedor..."
              />
              {/* Crear el proveedor aquí mismo, como ya hace la cotización
                  nueva: un taller que todavía no está dado de alta era el
                  único motivo para abandonar la orden a mitad de cotizar. */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setAddSupplierOpen(true)}
                title="Crear proveedor"
                aria-label="Crear proveedor"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotation-price">
              Precio unitario{" "}
              <span className="text-muted-foreground text-xs font-normal">
                · por prenda, opcional
              </span>
            </Label>
            <Input
              id="quotation-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Se puede dejar vacío y cerrarlo al avanzar"
            />
            {/* La cuenta, delante. El rótulo decía solo «Precio» y cada prenda
                se convierte en su propio servicio: sin ver el total era fácil
                teclear el unitario creyendo que era el del lote, o al revés. */}
            {totalEncargo !== null && chosenQuantity > 0 && (
              <p className="text-muted-foreground text-xs">
                {fmt(chosenQuantity)} prendas ×{" "}
                {formatCurrency(unitPrice ?? 0)} ={" "}
                <span className="text-foreground font-medium tabular-nums">
                  {formatCurrency(totalEncargo)}
                </span>{" "}
                en total
                {desglose && (
                  <>
                    {" "}
                    · base {formatCurrency(desglose.base)} + IGV{" "}
                    {formatCurrency(desglose.igv)}
                    {desglose.includesTax
                      ? ""
                      : ` = ${formatCurrency(desglose.total)} a pagar`}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Lo pactado con el taller: la moneda rige los importes del papel
              y la condición sale en sus Observaciones. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quotation-currency">Moneda</Label>
              <CurrencySelect
                id="quotation-currency"
                value={currency}
                onValueChange={setCurrency}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotation-payment-terms">
                Condición de pago{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  · opcional
                </span>
              </Label>
              <Input
                id="quotation-payment-terms"
                value={paymentTerms}
                onChange={(event) => setPaymentTerms(event.target.value)}
                placeholder="Ej: 50% adelanto"
              />
            </div>
          </div>

          {/* Como en Cotizaciones: si el precio pactado lleva el IGV dentro.
              Es lo que decide el desglose de la Orden de Servicio. */}
          <div className="space-y-2">
            <Label htmlFor="quotation-tax">
              IGV{" "}
              <span className="text-muted-foreground text-xs font-normal">
                · solo informa, no cambia el precio
              </span>
            </Label>
            <TaxIncludedSelect
              id="quotation-tax"
              value={priceIncludesTax}
              onValueChange={setPriceIncludesTax}
              disabled={unitPrice === null}
            />
          </div>

          {/* Cuando se espera el trabajo. Por linea en el backend; aqui todas
              las prendas del paso van al mismo taller y se pactan juntas.

              DateField y no un `input type="date"`, igual que en la Orden de
              Compra: es el selector del sistema y asi la fecha se elige igual
              en las dos pantallas, que son hermanas.

              maxDate null: mira al FUTURO, y el tope de hoy que DateField trae
              por defecto la bloquearia entera. */}
          <div className="space-y-2">
            <Label htmlFor="quotation-promised-date">
              Fecha pactada{" "}
              <span className="text-muted-foreground text-xs font-normal">· opcional</span>
            </Label>
            <DateField
              id="quotation-promised-date"
              value={promisedDate || null}
              onChange={(value) => setPromisedDate(value ?? "")}
              maxDate={null}
              showClear
              placeholder="Sin fecha pactada"
            />
          </div>

          {/* Lo que el taller tiene que leer en el papel: salen en las
              Observaciones de la Orden de Servicio, delante de las condiciones
              fijas. Una para toda la cotización, como la fecha. */}
          <div className="space-y-2">
            <Label htmlFor="quotation-notes">
              Notas{" "}
              <span className="text-muted-foreground text-xs font-normal">· opcional</span>
            </Label>
            <Textarea
              id="quotation-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: Entregar en dos lotes. El hilo lo pone el taller."
              rows={3}
            />
          </div>

          {/* Qué prendas entran a este paso. De cada una nace su propio
              servicio, así que esto decide cuántos se crean. */}
          <div className="space-y-2">
            <Label>
              Prendas{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (mínimo 1)
              </span>
            </Label>

            <div className="overflow-hidden rounded-md border">
              <button
                type="button"
                onClick={toggleAll}
                className="bg-muted hover:bg-accent flex h-11 w-full items-center gap-3 px-3 text-left"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                    allChosen
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input bg-background"
                  )}
                >
                  {allChosen && <Check className="h-3 w-3" />}
                </span>
                <span className="text-muted-foreground flex-1 text-xs font-medium">
                  Variación
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  Cantidad
                </span>
              </button>

              {items.map((item) => {
                const on = chosenIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="hover:bg-accent flex h-11 w-full items-center gap-3 border-t px-3 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        on
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-background"
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        !on && "text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        !on && "text-muted-foreground"
                      )}
                    >
                      {fmt(item.quantity)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lo que se crea solo. En lectura: si algo de esto no cuadra, lo que
              hay que cambiar es la orden o la ruta, no este formulario. */}
          <dl className="bg-muted text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md p-3 text-xs">
            <dt>Código</dt>
            <dd className="text-foreground tabular-nums">{code}</dd>
            <dt>Nombre</dt>
            <dd className="text-foreground">{name}</dd>
            <dt>Proceso</dt>
            <dd className="text-foreground">
              {processName} · paso {stepOrder}
            </dd>
            <dt>Prendas</dt>
            <dd className="text-foreground tabular-nums">
              {chosen.length === 0
                ? "elige al menos una"
                : `${fmt(chosenQuantity)} — ${chosen.length} de ${items.length} de la orden (${fmt(orderQuantity)})`}
            </dd>
            <dt>Servicios</dt>
            <dd className="text-foreground tabular-nums">
              {chosen.length === 0
                ? "—"
                : chosen.length === 1
                  ? "1 — uno por prenda"
                  : `${chosen.length} — uno por prenda`}
            </dd>
          </dl>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={supplierId === null || chosen.length === 0 || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cotización
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Se monta al abrir: así el formulario nace limpio cada vez, sin
          arrastrar lo tecleado en un alta anterior que se canceló. */}
      {addSupplierOpen && (
        <AddSupplierModal
          open
          onOpenChange={setAddSupplierOpen}
          onCreated={supplierCreated}
        />
      )}
    </Dialog>

    {/* FUERA del Dialog de arriba, no dentro: ese se cierra al crear la
        cotización, y un hijo suyo se desmontaría con él. */}
    {recienCreada && (
      <QuotationConsumptionsDialog
        open
        onOpenChange={(abierto) => {
          if (!abierto) setRecienCreada(null);
        }}
        quotationId={recienCreada.id}
        quotationLabel={recienCreada.code}
      />
    )}
    </>
  );
};

export default QuotationFromProcessDialog;
