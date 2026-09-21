import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityCombobox } from "@/modules/suppliers/components/EntityCombobox";
import { AddSupplierModal } from "@/modules/suppliers/components/suppliers/AddSupplierModal";
import { ServiceTab } from "../types/Quotations.types";
import { useNewQuotation } from "../hooks/useNewQuotation";
import { AddQuotationServiceDialog } from "../components/AddQuotationServiceDialog";
import { QuotationLinesTable } from "../components/QuotationLinesTable";

const NewQuotation = () => {
  const navigate = useNavigate();
  const {
    suppliers,
    loadingCatalogs,
    supplierId,
    supplierName,
    selectSupplier,
    supplierSearch,
    setSupplierSearch,
    description,
    setDescription,
    notes,
    setNotes,
    currency,
    setCurrency,
    paymentTerms,
    setPaymentTerms,
    lines,
    addLineFromDialog,
    removeLine,
    reloadSuppliers,
    canSubmit,
    submitting,
    handleSubmit,
    kind,
    setKind,
  } = useNewQuotation();

  const supplierOptions = suppliers.map((s) => ({ id: s.id, label: s.name }));

  /** Alta de línea. El modal es el MISMO que al editar una cotización. */
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/quotations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva cotización</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <EntityCombobox
                  options={supplierOptions}
                  value={supplierId}
                  onSelect={(option) => {
                    const supplier = suppliers.find((s) => s.id === option.id);
                    if (supplier) selectSupplier(supplier);
                  }}
                  search={supplierSearch}
                  onSearchChange={setSupplierSearch}
                  placeholder="Seleccionar proveedor..."
                  searchPlaceholder="Buscar proveedor..."
                  fallbackLabel={supplierName}
                  disabled={loadingCatalogs}
                />
              </div>
              {/* Crear sin salir: el proveedor nuevo aparece a mitad de
                  cotizar, y mandar a otra pantalla pierde lo escrito. Mismo
                  criterio que el alta de material dentro de la línea. */}
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
          <div className="space-y-2 lg:col-span-2">
            {/* Se rotula «Descripción» porque es el campo de siempre, en su
                sitio; por debajo viaja como `subject`: el título que lista la
                pantalla y que los papeles imprimen en «Solicitud». */}
            <Label>Descripción *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Confección de temporada verano"
            />
          </div>
          {/* Lo pactado con el proveedor: la moneda rige todos los importes
              de los dos papeles y la condición sale en sus Observaciones. Las
              dos se pueden cambiar después desde el detalle. */}
          <div className="space-y-2">
            <Label htmlFor="new-quotation-currency">Moneda</Label>
            <CurrencySelect
              id="new-quotation-currency"
              value={currency}
              onValueChange={setCurrency}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="new-quotation-payment-terms">
              Condición de pago{" "}
              <span className="text-muted-foreground text-xs font-normal">
                · opcional
              </span>
            </Label>
            <Input
              id="new-quotation-payment-terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ej: 50% adelanto, 50% contra entrega"
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            {/* Las notas salen en las Observaciones de la Orden de Compra y
                de la Orden de Servicio. Se pueden cambiar después desde el
                detalle. */}
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Entregar en dos lotes. El hilo lo pone el taller."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Las mismas pestañas que al editar, con los mismos valores: una
              línea con material es una compra y sin material un servicio, y
              eso lo deriva el backend de `material_id`.

              NO filtran las líneas. La cotización es una sola y se guarda
              entera; la pestaña dice qué estás añadiendo, no esconde lo
              añadido -- ocultar filas que se van a guardar igual sería peor
              que verlas. */}
          <Tabs value={kind} onValueChange={(value) => setKind(value as ServiceTab)}>
            <TabsList>
              <TabsTrigger value="SERVICE">Orden de Servicios</TabsTrigger>
              <TabsTrigger value="MATERIAL">Orden de Compra</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setAddLineOpen(true)}
              disabled={loadingCatalogs}
            >
              <Plus className="h-4 w-4" />
              {kind === "SERVICE" ? "Agregar servicio" : "Agregar material"}
            </Button>
          </div>

          <QuotationLinesTable lines={lines} onRemove={removeLine} />
        </CardContent>
      </Card>

      {/* quotationId en null: la cotizacion todavia no existe, asi que el
          dialogo devuelve la linea en vez de guardarla. */}
      <AddQuotationServiceDialog
        open={addLineOpen}
        onOpenChange={setAddLineOpen}
        quotationId={null}
        supplierId={supplierId}
        kind={kind}
        onAddLine={addLineFromDialog}
      />

      <AddSupplierModal
        open={addSupplierOpen}
        onOpenChange={setAddSupplierOpen}
        onCreated={reloadSuppliers}
      />

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cotización
        </Button>
      </div>
    </div>
  );
};

export default NewQuotation;
