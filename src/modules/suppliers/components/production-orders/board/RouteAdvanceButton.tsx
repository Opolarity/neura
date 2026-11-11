import { useMemo, useState } from "react";
import { StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductionPlanRouteStep } from "../../../types/productionPlan.types";
import { toServiceProgressTarget } from "../../../utils/routeServiceTarget";
import { MultiServiceProgressDialog } from "../../services/MultiServiceProgressDialog";
import { ServiceProgressDialog } from "../../services/ServiceProgressDialog";

interface RouteAdvanceButtonProps {
  /** El paso de la ruta de este proceso; null si la ruta aún no lo tiene. */
  step: ProductionPlanRouteStep | null;
  canEdit: boolean;
  /** Tras registrar: la pizarra relee la ruta y el resumen. */
  onSaved: () => void;
}

/**
 * Avanzar un proceso desde su fila en la Ruta de la orden (2026-10-19), con
 * los mismos pop-ups que tenía la vista de avances:
 *
 * - Un encargo: el avance del servicio (enviar, recibir, situación).
 * - Varios encargos: avanzar sus prendas de una vez.
 *
 * Sin encargo no hay nada que avanzar: el encargo se arma con «Encargar al
 * taller», en la fila del proceso.
 */
export const RouteAdvanceButton = ({ step, canEdit, onSaved }: RouteAdvanceButtonProps) => {
  const [open, setOpen] = useState(false);
  // Referencia estable: el diálogo siembra su formulario cuando cambia.
  const targets = useMemo(() => (step?.services ?? []).map(toServiceProgressTarget), [step]);

  if (!step || !canEdit || targets.length === 0) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <StepForward className="h-4 w-4" />
        Avanzar
      </Button>

      {targets.length === 1 && (
        <ServiceProgressDialog
          open={open}
          onOpenChange={setOpen}
          service={open ? targets[0] : null}
          focusItemId={null}
          onSaved={onSaved}
          /* Se avanza en vivo: la fecha del movimiento es cuando se cambia la
             situación, como en la vista de avances. */
          allowBackdating={false}
        />
      )}
      {targets.length > 1 && (
        <MultiServiceProgressDialog
          open={open}
          onOpenChange={setOpen}
          services={targets}
          processName={step.processName}
          focusServiceId={null}
          onSaved={onSaved}
        />
      )}
    </>
  );
};
