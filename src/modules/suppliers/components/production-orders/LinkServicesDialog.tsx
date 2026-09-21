import { ArrowLeft, FileText, Link2, Loader2, Search, Wrench } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLinkServices } from "../../hooks/useLinkServices";
import { QuotationServiceOption } from "../../types/productionOrderServices.types";

interface LinkServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number | null;
  onLinked?: () => void;
}

/** Por qué una línea no se puede marcar, para decirlo en la propia fila. */
const blockedReason = (
  service: QuotationServiceOption,
  productionOrderId: number | null
): string | null => {
  if (service.materialId !== null) {
    return "Es una línea de material: la orden consume materiales por la explosión";
  }
  if (service.productionOrderId === productionOrderId) {
    return "Ya está en esta orden";
  }
  if (service.productionOrderId !== null) {
    return `Ya está en la orden ${service.productionOrderId}`;
  }
  return null;
};

/**
 * Vincular servicios a una orden de producción.
 *
 * Dos pasos: se elige una cotización y se marcan LOS SERVICIOS de esa
 * cotización que entran a la orden. La cotización nunca se vincula entera —
 * de una de diez líneas entran las tres que corresponden. Para servicios de
 * otra cotización se vuelve atrás y se repite.
 */
export const LinkServicesDialog = ({
  open,
  onOpenChange,
  productionOrderId,
  onLinked,
}: LinkServicesDialogProps) => {
  const {
    search,
    setSearch,
    quotations,
    loadingQuotations,
    selectedQuotation,
    openQuotation,
    backToQuotations,
    services,
    loadingServices,
    checked,
    isSelectable,
    toggle,
    toggleAll,
    linking,
    link,
  } = useLinkServices({
    productionOrderId,
    open,
    onLinked: () => {
      onLinked?.();
      onOpenChange(false);
    },
  });

  const selectableCount = services.filter(isSelectable).length;
  const allChecked = selectableCount > 0 && checked.size === selectableCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedQuotation
              ? `Servicios de ${selectedQuotation.description}`
              : "Vincular servicios"}
          </DialogTitle>
          <DialogDescription>
            {selectedQuotation
              ? "Marca los servicios que entran a esta orden. De ellos salen los procesos y el costo de la prenda."
              : "Elige una cotización para ver los servicios que tiene. Lo que se vincula son los servicios, no la cotización."}
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1 — elegir cotización */}
        {!selectedQuotation ? (
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descripción o proveedor..."
              />
            </div>

            {loadingQuotations ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando cotizaciones...
              </div>
            ) : quotations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <FileText className="w-8 h-8 opacity-50" />
                <p className="font-medium">Sin cotizaciones</p>
                <p className="text-sm max-w-md">
                  {search.trim()
                    ? "Ninguna coincide con la búsqueda."
                    : "Crea una cotización con sus servicios para poder vincularlos."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="w-28 text-right">Total</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        {quotation.description}
                      </TableCell>
                      <TableCell>{quotation.supplierName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {quotation.price === null
                          ? "—"
                          : `S/ ${Number(quotation.price).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openQuotation(quotation)}
                        >
                          <Wrench className="w-4 h-4" />
                          Ver servicios
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          /* Paso 2 — marcar servicios de esa cotización */
          <div className="space-y-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={backToQuotations}
            >
              <ArrowLeft className="w-4 h-4" />
              Otra cotización
            </Button>

            {loadingServices ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando servicios...
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Wrench className="w-8 h-8 opacity-50" />
                <p className="font-medium">Esta cotización no tiene servicios</p>
                <p className="text-sm max-w-md">
                  Añade líneas de servicio a la cotización para poder
                  vincularlas a una orden.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        disabled={selectableCount === 0}
                        onCheckedChange={toggleAll}
                        aria-label="Marcar todos los servicios disponibles"
                      />
                    </TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Situación</TableHead>
                    <TableHead className="w-28 text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => {
                    const reason = blockedReason(service, productionOrderId);
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <Checkbox
                            checked={checked.has(service.id)}
                            disabled={reason !== null}
                            onCheckedChange={() => toggle(service.id)}
                            aria-label={`Marcar ${service.description}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{service.description}</div>
                          {service.code && (
                            <div className="text-muted-foreground text-xs">
                              {service.code}
                            </div>
                          )}
                          {reason && (
                            <div className="text-muted-foreground text-xs">
                              {reason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{service.situationName ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {service.price === null
                            ? "—"
                            : `S/ ${service.price.toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {selectedQuotation && (
            <Button
              className="gap-2"
              disabled={checked.size === 0 || linking}
              onClick={link}
            >
              {linking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Vincular {checked.size > 0 ? `(${checked.size})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
