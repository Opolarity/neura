import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/utils/utils";
import { quoteOrderShipping } from "../../../services/Couriers.service";
import { useCourierSettings } from "../../../hooks/useCourierSettings";
import { formatSoles, optionTitle } from "../../../utils/couriers";
import {
  COURIER_NAMES,
  type CourierCode,
  type CourierDestination,
  type CourierQuoteOption,
} from "../../../types/Couriers.types";

const COURIER_TABS: CourierCode[] = ["OWN-OLVA", "OWN-SHALOM"];

interface CourierOptionsListProps {
  orderId: number;
  courier: CourierCode;
  destination: CourierDestination;
  enabled: boolean;
  open: boolean;
  selectedId: string | null;
  onSelect: (option: CourierQuoteOption | null) => void;
}

function CourierOptionsList({
  orderId,
  courier,
  destination,
  enabled,
  open,
  selectedId,
  onSelect,
}: CourierOptionsListProps) {
  const { data: options = [], isFetching, error } = useQuery({
    queryKey: ["courier-quote", orderId, courier, destination],
    queryFn: () => quoteOrderShipping(orderId, destination, [courier]),
    enabled: open && enabled,
    retry: false,
    staleTime: 60_000,
  });

  if (!enabled) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm">
        {COURIER_NAMES[courier]} no está habilitado.{" "}
        <Link to="/shipping/create" className="font-medium hover:underline">
          Crea su método de envío en Envíos
        </Link>
        .
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cotizando con {COURIER_NAMES[courier]}...
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-6 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : `No se pudo cotizar con ${COURIER_NAMES[courier]}`}
      </p>
    );
  }

  if (options.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {COURIER_NAMES[courier]} no tiene opciones para este destino.
      </p>
    );
  }

  return (
    <RadioGroup
      value={selectedId ?? ""}
      onValueChange={(id) => onSelect(options.find((o) => o.id === id) ?? null)}
      className="flex flex-col gap-2"
    >
      {options.map((option) => (
        <Label
          key={option.id}
          htmlFor={`courier-option-${option.id}`}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal",
            selectedId === option.id ? "border-primary" : "border-input hover:bg-muted",
          )}
        >
          <RadioGroupItem value={option.id} id={`courier-option-${option.id}`} />
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-medium">{optionTitle(option)}</span>
            {option.agencyAddress && (
              <span className="text-xs text-muted-foreground">{option.agencyAddress}</span>
            )}
          </span>
          <span className="text-sm font-semibold">{formatSoles(option.cost)}</span>
          {option.leadTime && (
            <span className="w-16 text-right text-xs text-muted-foreground">
              {option.leadTime}
            </span>
          )}
        </Label>
      ))}
    </RadioGroup>
  );
}

interface CalculateShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  destination: CourierDestination;
  currentShippingCost: number;
  currentMethodName?: string;
  onApply: (option: CourierQuoteOption, useCourierPrice: boolean) => Promise<void>;
}

export function CalculateShippingDialog({
  open,
  onOpenChange,
  orderId,
  destination,
  currentShippingCost,
  currentMethodName,
  onApply,
}: CalculateShippingDialogProps) {
  const { settings } = useCourierSettings();
  const enabledCodes = useMemo(
    () => settings.filter((s) => s.enabled).map((s) => s.code),
    [settings],
  );
  const [tab, setTab] = useState<CourierCode>("OWN-OLVA");
  const [selected, setSelected] = useState<CourierQuoteOption | null>(null);
  const [priceChoice, setPriceChoice] = useState<"courier" | "keep">("courier");
  const [applying, setApplying] = useState(false);

  // Al abrir, la pestaña del primer courier conectado y sin opción elegida.
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    if (!enabledCodes.includes(tab) && enabledCodes.length > 0) setTab(enabledCodes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      await onApply(selected, priceChoice === "courier");
      onOpenChange(false);
    } finally {
      setApplying(false);
    }
  };

  const destinationLabel = [
    destination.stateName,
    destination.cityName,
    destination.neighborhoodName,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Calcular envío con courier</DialogTitle>
          <p className="text-sm text-muted-foreground">Destino: {destinationLabel}</p>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as CourierCode);
            setSelected(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            {COURIER_TABS.map((code) => (
              <TabsTrigger key={code} value={code}>
                {COURIER_NAMES[code]}
              </TabsTrigger>
            ))}
          </TabsList>
          {COURIER_TABS.map((code) => (
            <TabsContent key={code} value={code} className="mt-4">
              <CourierOptionsList
                orderId={orderId}
                courier={code}
                destination={destination}
                enabled={enabledCodes.includes(code)}
                open={open && tab === code}
                selectedId={selected?.courier === code ? selected.id : null}
                onSelect={setSelected}
              />
            </TabsContent>
          ))}
        </Tabs>

        {selected && (
          <div className="flex flex-col gap-2">
            <Label>Precio del envío en la venta</Label>
            <RadioGroup
              value={priceChoice}
              onValueChange={(v) => setPriceChoice(v as "courier" | "keep")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="courier" id="price-courier" />
                <Label htmlFor="price-courier" className="font-normal">
                  Usar el precio de {COURIER_NAMES[selected.courier]} ·{" "}
                  {formatSoles(selected.cost)}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="keep" id="price-keep" />
                <Label htmlFor="price-keep" className="font-normal">
                  Mantener el precio actual · {formatSoles(currentShippingCost)}
                  {currentMethodName ? ` (${currentMethodName})` : ""}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!selected || applying}>
            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar a la venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
