import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityCombobox } from "@/modules/suppliers/components/EntityCombobox";
import { MaterialLinkField } from "@/modules/suppliers/components/MaterialLinkField";
import { ProductionOrderLinkField } from "@/modules/suppliers/components/ProductionOrderLinkField";
import { materialLinkUnit } from "@/modules/suppliers/types/materialLink.types";
import { useAddQuotationService } from "../hooks/useAddQuotationService";
import { QuotationServiceLine, ServiceTab } from "../types/Quotations.types";

interface AddQuotationServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * La cotización a la que se añade, o `null` al crearla desde cero.
   *
   * Con `null` el diálogo no llama al servidor: entrega la línea por
   * `onAddLine` y quien lo abre la guarda en memoria hasta que la cotización
   * exista. Es el mismo formulario y las mismas validaciones -- lo único que
   * cambia es dónde acaba la línea.
   */
  quotationId: number | null;
  /** Proveedor de la cotización, con el que se crea un material nuevo. */
  supplierId: number | null;
  /** Pestaña desde la que se abre: decide qué campos tienen sentido. */
  kind?: ServiceTab;
  /** Solo con `quotationId` en null. */
  onAddLine?: (line: QuotationServiceLine) => void;
  onSaved?: () => void;
}

export const AddQuotationServiceDialog = ({
  open,
  onOpenChange,
  quotationId,
  supplierId,
  kind = "SERVICE",
  onAddLine,
  onSaved,
}: AddQuotationServiceDialogProps) => {
  const {
    classes,
    materials,
    materialClasses,
    loadingCatalogs,
    form,
    setField,
    materialLink,
    setMaterialLink,
    productionOrderLink,
    setProductionOrderLink,
    productionOrders,
    productionOrderSearch,
    setProductionOrderSearch,
    handleMaterialCreated,
    selectedClassName,
    classSearch,
    setClassSearch,
    materialSearch,
    setMaterialSearch,
    materialClassSearch,
    setMaterialClassSearch,
    submitting,
    handleSubmit,
  } = useAddQuotationService({
    quotationId,
    supplierId,
    kind,
    onAddLine,
    onSuccess: () => {
      onSaved?.();
      onOpenChange(false);
    },
  });

  const classOptions = classes
    .filter((cls) => cls.name.toLowerCase().includes(classSearch.toLowerCase()))
    .map((cls) => ({ id: cls.id, label: cls.name }));

  // Con material vinculado, la unidad la impone el material.
  const unitLocked = materialLink.linked;
  const linkedUnit = materialLinkUnit(materialLink);

  /**
   * Lo que se teclea es el UNITARIO: es lo que el proveedor cotiza y lo que el
   * usuario conoce. `price` en la base es el total de la línea --así lo dejó
   * la migración que retiró `unit_price`, y así lo leen los SPs y los
   * papeles--, así que el hook manda unitario × cantidad al guardar, igual
   * que «Comprar materiales» de la orden de producción. Pedir aquí el total
   * hacía que se tecleara el unitario y la Orden de Compra saliera con
   * S/ 10 de total por 50 kg y un «importe» de S/ 0.20.
   *
   * Con un SERVICIO vinculado a una orden la cantidad la pone la orden y aquí
   * no se conoce, así que no hay por qué multiplicar: en ese caso el campo
   * sigue siendo el total y se dice.
   *
   * Una COMPRA vinculada a una orden no es ese caso: la orden solo dice de
   * dónde salió la compra (procedencia), y cuánto se compra lo decide quien
   * compra -- se puede pedir más tela de la que la orden consume, o menos si
   * ya hay en almacén. Ahí la cantidad se teclea y el precio es el unitario.
   */
  const cantidadLaPoneLaOrden = kind === "SERVICE" && productionOrderLink.linked;
  const precioEsTotal = cantidadLaPoneLaOrden;
  const costoTotal = (() => {
    const unitario = Number(form.price);
    const cantidad = Number(form.quantity);
    if (precioEsTotal) return null;
    if (!form.price || !form.quantity) return null;
    if (!Number.isFinite(unitario) || !Number.isFinite(cantidad)) return null;
    return unitario * cantidad;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {kind === "MATERIAL" ? "Agregar material" : "Agregar servicio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Ej: Confección de polos"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Clase de proveedor *</Label>
            <EntityCombobox
              options={classOptions}
              value={form.supplier_class_id === "" ? null : Number(form.supplier_class_id)}
              onSelect={(option) => setField("supplier_class_id", option.id.toString())}
              search={classSearch}
              onSearchChange={setClassSearch}
              placeholder="Seleccionar clase..."
              searchPlaceholder="Buscar clase..."
              fallbackLabel={selectedClassName}
              disabled={loadingCatalogs}
            />
          </div>

          {/* Solo en compra, y sin casilla: una línea de compra ES un material,
              no hay nada que decidir. En servicios ni se ofrece — `kind` se
              deriva de `material_id`, así que asignarle uno la convertiría en
              línea de compra y saltaría a la otra pestaña. */}
          {kind === "MATERIAL" && (
            <MaterialLinkField
              value={materialLink}
              onChange={setMaterialLink}
              materials={materials}
              materialSearch={materialSearch}
              onMaterialSearchChange={setMaterialSearch}
              materialClasses={materialClasses}
              materialClassSearch={materialClassSearch}
              onMaterialClassSearchChange={setMaterialClassSearch}
              supplierId={supplierId}
              nameSuggestion={form.description}
              onMaterialCreated={handleMaterialCreated}
              disabled={loadingCatalogs}
              alwaysLinked
            />
          )}

          {/*
            Sin este campo el servicio nacía huérfano de orden: no hay otra
            pantalla donde vincularlo después, y sin orden no entra en el
            costo de ninguna prenda.

            En compra también se ofrece: la compra queda con su orden de
            PROCEDENCIA y aparece en «Compras de esta orden», sin entrar en
            la ruta (el backend no la mete en production_order_info). Antes
            solo se podía ligar desde «Comprar materiales» de la propia orden.
          */}
          <ProductionOrderLinkField
            value={productionOrderLink}
            onChange={setProductionOrderLink}
            productionOrders={productionOrders}
            productionOrderSearch={productionOrderSearch}
            onProductionOrderSearchChange={setProductionOrderSearch}
            disabled={loadingCatalogs}
          />

          <div className="space-y-2">
            <Label>Cantidad</Label>
            <Input
              type="number"
              /* Si un SERVICIO cuelga de una orden, la cantidad la pone la
                 orden y sigue a la orden cuando cambia. Se teclea cuando no
                 hay orden detrás -- el servicio sobre prendas ya terminadas --
                 y SIEMPRE en una compra: cuánto material se pide lo decide
                 quien compra, con orden vinculada o sin ella. */
              disabled={cantidadLaPoneLaOrden}
              value={cantidadLaPoneLaOrden ? "" : form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder={
                cantidadLaPoneLaOrden
                  ? "La pone la orden de producción"
                  : "Ej: 100"
              }
              className={cn(
                cantidadLaPoneLaOrden &&
                  "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>{precioEsTotal ? "Precio total" : "Precio unitario"}</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder={precioEsTotal ? "Ej: 250.00" : "Ej: 12.50"}
            />
            {/* El total en vivo, para que se vea lo que va a quedar guardado
                antes de pulsar Agregar. */}
            {costoTotal !== null && (
              <p className="text-muted-foreground text-xs">
                Costo total: {formatCurrency(costoTotal)}
              </p>
            )}
            {precioEsTotal && (
              <p className="text-muted-foreground text-xs">
                Con orden vinculada la cantidad la pone la orden: indica el
                total de la línea.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>IGV *</Label>
            <Select
              value={form.price_includes_tax}
              onValueChange={(value) => setField("price_includes_tax", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="¿El precio incluye IGV?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">El precio incluye IGV</SelectItem>
                {/* «+ IGV»: como se dice al pactar, «cien más IGV». */}
                <SelectItem value="false">+ IGV</SelectItem>
              </SelectContent>
            </Select>
            {/* Solo rotula: dice si el precio pactado llega con el IGV
                dentro. No cambia ningún costo. */}
            <p className="text-muted-foreground text-xs">
              Solo informa si el precio pactado incluye el IGV.
            </p>
          </div>

          {/* Lo pactado con el proveedor. Es por línea, no por cotización,
              porque cada servicio se promete para un día distinto. */}
          <div className="space-y-2">
            <Label htmlFor="line-promised-date">Fecha pactada</Label>
            <Input
              id="line-promised-date"
              type="date"
              value={form.promised_date}
              onChange={(e) => setField("promised_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Input
              value={unitLocked ? linkedUnit ?? "" : form.measurement_unit}
              onChange={(e) => setField("measurement_unit", e.target.value)}
              placeholder="UND"
              readOnly={unitLocked}
              disabled={unitLocked}
            />
            {unitLocked && (
              <p className="text-xs text-muted-foreground">
                La unidad la define el material vinculado.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuotationServiceDialog;
