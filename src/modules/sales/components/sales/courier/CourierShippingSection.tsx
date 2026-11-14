import { useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Loader2,
  PackageSearch,
  RefreshCw,
  Truck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/shared/utils/date";
import { cn } from "@/shared/utils/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCourierShipment } from "../../../hooks/useCourierShipment";
import {
  COURIER_NAMES,
  type CourierDestination,
  type CourierQuoteOption,
  type CourierShipment,
  type FreightPayer,
} from "../../../types/Couriers.types";
import {
  COURIER_STATUS_LABEL,
  COURIER_STATUS_VARIANT,
  COURIER_STEPS,
  courierStepIndex,
  generatePickupKey,
  isValidPickupKey,
  formatSoles,
  optionTitle,
} from "../../../utils/couriers";
import { CalculateShippingDialog } from "./CalculateShippingDialog";

interface CourierShippingSectionProps {
  orderId: number;
  destination: CourierDestination;
  currentShippingCost: number;
  currentMethodName?: string;
  /** "Usar el precio del courier": cambia el costo de envío del formulario. */
  onUseCourierPrice: (cost: number) => void;
  /**
   * Guarda la venta con lo que hay en pantalla (sin recargar) antes de que el
   * courier la lea de la BD. Resuelve false si no se pudo guardar.
   */
  onSaveSale: () => Promise<boolean>;
  /** Contra entrega de la venta y el saldo que se cobra. */
  cashOnDelivery: { enabled: boolean; balance: number };
  /**
   * Venta en situación física (-PHY) o sin envío: como la card de envío, no se
   * cambia nada; solo se consulta (rótulo, estado, historial).
   */
  locked?: boolean;
}

/** Seguimiento en pasos: Registrado → … → Entregado. */
function TrackingSteps({ shipment }: { shipment: CourierShipment }) {
  const current = courierStepIndex(shipment.statusCode);
  return (
    <ol className="flex items-start">
      {COURIER_STEPS.map((step, index) => {
        const done = index <= current;
        const isCurrent = index === current;
        return (
          <li key={step.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={cn("h-0.5 flex-1", index === 0 ? "invisible" : done ? "bg-primary" : "bg-border")}
              />
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/30 ring-offset-1",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "h-0.5 flex-1",
                  index === COURIER_STEPS.length - 1
                    ? "invisible"
                    : index < current
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1.5 text-center text-[11px] leading-tight",
                isCurrent ? "font-semibold" : done ? "" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function CourierShippingSection({
  orderId,
  destination,
  currentShippingCost,
  currentMethodName,
  onUseCourierPrice,
  onSaveSale,
  cashOnDelivery,
  locked = false,
}: CourierShippingSectionProps) {
  const { toast } = useToast();
  const [savingSale, setSavingSale] = useState(false);
  const [calculateOpen, setCalculateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickupKey, setPickupKey] = useState("");
  const {
    shipment,
    isLoading,
    applyQuote,
    createShipment,
    isCreating,
    refreshTracking,
    isRefreshing,
    downloadLabel,
    isDownloadingLabel,
    cancelShipment,
    isCancelling,
    removeShipment,
    isRemoving,
    setFreightPayer,
  } = useCourierShipment(orderId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const costLabel = (cost: number | null) => (cost == null ? "—" : formatSoles(cost));

  const isOlva = shipment?.option.courier === "OWN-OLVA";
  const codActive = cashOnDelivery.enabled && cashOnDelivery.balance > 0;
  const freightPayer: FreightPayer = shipment?.freightPayer ?? "store";
  // Olva solo deja que el cliente pague el flete si recoge en agencia.
  const customerFreightAllowed = !(isOlva && shipment?.option.deliveryType === "home");

  // La clave de recojo solo aplica a entregas en agencia.
  const needsPickupKey = shipment?.option.deliveryType === "agency";

  const handleGenerateClick = () => {
    if (needsPickupKey && !isValidPickupKey(pickupKey)) {
      toast({
        title: "Clave de recojo inválida",
        description: "Escribe 4 dígitos que no sean consecutivos (ej. 1234 o 4321), o pulsa Generar.",
        variant: "destructive",
      });
      return;
    }
    if (codActive && isOlva) {
      toast({
        title: "Olva no cobra contra entrega",
        description:
          "Olva no cobra el producto al entregar. Usa Shalom o reparto propio, o desmarca contra entrega.",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const hasDestination = !!destination.stateName;

  const saveSale = async () => {
    setSavingSale(true);
    try {
      return await onSaveSale();
    } finally {
      setSavingSale(false);
    }
  };

  // La guía se registra con la dirección y el cliente guardados: primero se
  // guarda lo que haya en pantalla.
  const handleConfirmCreate = async () => {
    if (!(await saveSale())) return;
    createShipment(needsPickupKey ? pickupKey : null);
  };

  const handleApply = async (option: CourierQuoteOption, useCourierPrice: boolean) => {
    await applyQuote(option);
    if (useCourierPrice) {
      onUseCourierPrice(option.cost);
      // Se guarda solo: el costo nuevo entra en el total sin "Actualizar Venta".
      if (await saveSale()) {
        toast({ title: "Envío aplicado", description: `Costo de envío: ${formatSoles(option.cost)}.` });
      }
    } else {
      toast({ title: "Envío aplicado", description: "Se mantuvo el precio actual." });
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Envío con courier</p>
          {locked && (
            <p className="text-xs text-muted-foreground">
              La venta ya no permite cambiar el envío; puedes ver el estado y el rótulo.
            </p>
          )}
        </div>
        {shipment?.statusCode ? (
          <Badge variant={COURIER_STATUS_VARIANT[shipment.statusCode]}>
            {COURIER_STATUS_LABEL[shipment.statusCode]}
          </Badge>
        ) : shipment ? (
          <Badge variant="pending">Sin guía</Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando envío...
        </div>
      ) : !shipment ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasDestination
              ? "Puedes seguir usando el método de envío de arriba, o cotizar con Olva o Shalom y gestionar la guía desde aquí."
              : "Completa el departamento de envío de la venta para cotizar con Olva o Shalom."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => setCalculateOpen(true)}
            disabled={!hasDestination || locked}
          >
            <PackageSearch className="mr-2 h-4 w-4" />
            Calcular envío con courier
          </Button>
        </div>
      ) : (
        <>
          {/* 1. Qué se envía: courier y lugar a la izquierda, costo a la derecha */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-sm">
              <p className="font-medium">{optionTitle(shipment.option)}</p>
              {shipment.option.agencyAddress && (
                <p className="text-xs text-muted-foreground">{shipment.option.agencyAddress}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-semibold">{costLabel(shipment.option.cost)}</p>
              {shipment.option.leadTime && (
                <p className="text-xs text-muted-foreground">llega en {shipment.option.leadTime}</p>
              )}
            </div>
          </div>

          {/* 2. Guía (cuando ya existe) con sus acciones */}
          {shipment.trackingNumber && (
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-md bg-muted/50 p-3">
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Guía</p>
                  <p className="font-semibold">{shipment.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {shipment.option.courier === "OWN-SHALOM" ? "Código" : "Año"}
                  </p>
                  <p className="font-semibold">{shipment.trackingCode}</p>
                </div>
                {shipment.pickupKey && (
                  <div>
                    <p className="text-xs text-muted-foreground">Clave de recojo</p>
                    <p className="font-semibold">{shipment.pickupKey}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadLabel}
                  disabled={isDownloadingLabel}
                >
                  {isDownloadingLabel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Rótulo
                </Button>
                {/* Olva con pago online pendiente (link de PagoEfectivo vigente). */}
                {shipment.paymentUrl && (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={shipment.paymentUrl} target="_blank" rel="noreferrer">
                      <Wallet className="mr-2 h-4 w-4" />
                      Pagar flete
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshTracking}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                  Actualizar
                </Button>
              </div>
            </div>
          )}

          {/* 3. Flete y clave de recojo, lado a lado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Flete del courier</Label>
              <RadioGroup
                value={freightPayer}
                onValueChange={(v) => setFreightPayer(v as FreightPayer)}
                disabled={!!shipment.trackingNumber || locked}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="store" id="freight-store" />
                  <Label htmlFor="freight-store" className="font-normal">
                    Lo paga la tienda
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="customer"
                    id="freight-customer"
                    disabled={!customerFreightAllowed}
                  />
                  <Label htmlFor="freight-customer" className="font-normal">
                    Lo paga el cliente al recoger
                    {!customerFreightAllowed && (
                      <span className="text-xs text-muted-foreground">
                        {" "}(Olva solo lo permite en agencia)
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {needsPickupKey && !shipment.trackingNumber && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="pickup-key" required>
                  Clave de recojo
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="pickup-key"
                    value={pickupKey}
                    onChange={(e) => setPickupKey(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    aria-required
                    disabled={locked}
                    className="w-28 font-mono tracking-widest"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPickupKey(generatePickupKey())}
                    disabled={locked}
                  >
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  4 dígitos que el cliente dará en la agencia. No consecutivos (1234, 4321).
                </p>
              </div>
            )}
          </div>

          {/* 4. Acciones antes de la guía */}
          {!shipment.trackingNumber && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={handleGenerateClick} disabled={isCreating || savingSale || locked}>
                {isCreating || savingSale ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-2 h-4 w-4" />
                )}
                Generar guía
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCalculateOpen(true)}
                disabled={locked}
              >
                Recalcular
              </Button>
              <Button
                type="button"
                variant="outline"
                className="ml-auto"
                onClick={removeShipment}
                disabled={isRemoving || locked}
              >
                Quitar
              </Button>
            </div>
          )}

          {/* Aviso de la guía: rastreo caído */}
          {shipment.trackingError && (
            <p className="text-xs text-muted-foreground">
              No se pudo consultar el estado: {shipment.trackingError}
            </p>
          )}

          {/* 5. Por dónde va el envío y su historial */}
          {shipment.trackingNumber && (
            <div className="space-y-2 border-t pt-4">
              <TrackingSteps shipment={shipment} />
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="-ml-2">
                    <ChevronDown
                      className={cn("mr-1 h-4 w-4 transition-transform", historyOpen && "rotate-180")}
                    />
                    Historial ({shipment.events.length})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ol className="mt-2 flex flex-col gap-2 border-l pl-4">
                    {shipment.events.map((event, index) => (
                      <li key={`${event.statusCode}-${index}`} className="text-sm">
                        <span className={index === 0 ? "font-medium" : "text-muted-foreground"}>
                          {event.statusText}
                        </span>
                        {event.at && (
                          <span className="block text-xs text-muted-foreground">
                            {formatDateTime(event.at)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </CollapsibleContent>
              </Collapsible>
              {/* Shalom anula mientras está pendiente; Olva no anula por API. */}
              <div className="flex justify-end gap-2">
                {shipment.option.courier === "OWN-SHALOM" && shipment.cancellable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                    disabled={isCancelling || locked}
                  >
                    {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anular guía
                  </Button>
                )}
                {isOlva && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnlinkOpen(true)}
                    disabled={isRemoving || locked}
                  >
                    Desvincular guía
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <CalculateShippingDialog
        open={calculateOpen}
        onOpenChange={setCalculateOpen}
        orderId={orderId}
        destination={destination}
        currentShippingCost={currentShippingCost}
        currentMethodName={currentMethodName}
        onApply={handleApply}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Generar la guía?</AlertDialogTitle>
            <AlertDialogDescription>
              {shipment
                ? `Se registrará una guía real en ${COURIER_NAMES[shipment.option.courier]} (${optionTitle(shipment.option)}) por ${costLabel(shipment.option.cost)}. Flete: ${freightPayer === "customer" ? "lo paga el cliente" : "lo paga la tienda"}.${needsPickupKey ? ` Clave de recojo: ${pickupKey}.` : ""}${codActive ? ` Contra entrega: cobrar ${formatSoles(cashOnDelivery.balance)}.` : ""}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              Generar guía
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular la guía {shipment?.trackingNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se elimina en Shalom mientras sigue pendiente. La venta conserva la agencia elegida
              para volver a generar la guía.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelShipment}>Anular guía</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular la guía {shipment?.trackingNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Olva no permite anular por API: la guía sigue registrada en Olva y hay que anularla
              en su portal. La venta queda sin courier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeShipment}>Desvincular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
