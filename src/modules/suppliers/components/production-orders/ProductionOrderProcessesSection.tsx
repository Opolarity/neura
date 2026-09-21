import { useState } from "react";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductionPlanGrid } from "../production-plan/ProductionPlanGrid";
import { RouteConfigDialog } from "./RouteConfigDialog";
import { ProductionOrderServices } from "./ProductionOrderServices";

interface ProductionOrderProcessesSectionProps {
  productionOrderId: number | null;
  /** OP-0028. Lo necesita la cotización que nace de un proceso. */
  productionOrderCode?: string | null;
  /** Abre el diálogo de vincular servicios de la pantalla. */
  onLinkServices?: () => void;
  onUnlinkService?: (serviceId: number) => void;
  unlinkingId?: number | null;
  /** Dentro de una pestaña el título sobra: lo dice la etiqueta. */
  showHeading?: boolean;
  /**
   * Abre el diálogo de recibir de la pantalla, con TODAS las prendas de la
   * orden. Ingresar una sola va por su fila, como en el Plan Maestro; esto es
   * para recibir varias de una vez.
   */
}

/**
 * La pestaña de avances: la misma rejilla del Plan Maestro, con solo los datos
 * de esta orden.
 *
 * Antes era una tabla por SERVICIO, con una forma distinta de leer y de avanzar
 * la producción que la del Plan Maestro. Ahora es la misma vista —una fila por
 * variación, los procesos en columnas— acotada a la orden, así que lo que se
 * aprende en una pantalla sirve en la otra. Se caen las columnas que aquí
 * valdrían lo mismo en todas las filas: la orden, su estado y su entrega.
 *
 * Configurar la ruta —qué procesos tiene la orden y qué servicio cubre cada
 * uno— sigue siendo otra tarea y sigue en su diálogo.
 */
export const ProductionOrderProcessesSection = ({
  productionOrderId,
  productionOrderCode = null,
  onLinkServices,
  onUnlinkService,
  unlinkingId = null,
  showHeading = true,
}: ProductionOrderProcessesSectionProps) => {
  const [configOpen, setConfigOpen] = useState(false);
  /** Sube al remontar la rejilla tras guardar la ruta. */
  const [reloadKey, setReloadKey] = useState(0);

  if (productionOrderId === null) return null;

  return (
    <div className="space-y-3">
      {showHeading && (
        <div>
          <h2 className="text-lg font-semibold">Avances</h2>
          <p className="text-muted-foreground text-xs">
            Por dónde va la orden y qué falta en cada proceso.
          </p>
        </div>
      )}

      <ProductionPlanGrid
        key={reloadKey}
        productionOrderId={productionOrderId}
        scope="order"
        card={false}
        toolbar={
          /* El atajo para ingresar varias prendas a la vez se retiro: el
             ingreso se hace prenda a prenda desde su fila, que es donde se ve
             cuanto salio de cada talla. Elegirlas en un pop-up era repetir lo
             que la rejilla ya tiene delante. */
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setConfigOpen(true)}
            >
              <Route className="h-4 w-4" />
              Configurar ruta
            </Button>
          </div>
        }
      />

      {/* Debajo de la rejilla, como «Compras de esta orden» va debajo de la
          explosión: primero por dónde va la orden, después los papeles. */}
      <ProductionOrderServices
        productionOrderId={productionOrderId}
        productionOrderCode={productionOrderCode}
        reloadKey={reloadKey}
      />

      {/* Se monta al abrir: así arranca leyendo el estado guardado y cerrar sin
          guardar no deja nada a medias. */}
      {configOpen && (
        <RouteConfigDialog
          open={configOpen}
          onOpenChange={setConfigOpen}
          productionOrderId={productionOrderId}
          productionOrderCode={productionOrderCode}
          onSaved={() => setReloadKey((previo) => previo + 1)}
          onLinkServices={onLinkServices}
          onUnlinkService={onUnlinkService}
          unlinkingId={unlinkingId}
        />
      )}
    </div>
  );
};
