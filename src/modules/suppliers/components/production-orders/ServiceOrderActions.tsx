import { useState } from "react";
import { FileText, ListChecks, Loader2, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotationConsumptionsDialog } from "@/modules/quotations/components/quotations/QuotationConsumptionsDialog";
import { claveDe, EncargoRow } from "../../hooks/useServiceOrders";
import { ServiceSituationDialog } from "./ServiceSituationDialog";
import { ServicePricesDialog } from "./ServicePricesDialog";

interface ServiceOrderActionsProps {
  encargo: EncargoRow;
  /** La situación «En cotización»: solo con ella se cambian los precios. */
  enCotizacionId: number | null;
  /** Qué encargo se está imprimiendo (su clave), o null. */
  imprimiendo: string | null;
  onPrint: (encargo: EncargoRow) => void;
  /** Tras cambiar situación, precios o consumo. */
  onChanged?: () => void;
  /** Uno debajo del otro y a todo el ancho: la columna angosta de la Ruta. */
  vertical?: boolean;
}

/**
 * Los botones de un encargo a taller: su orden de servicio, su situación, sus
 * precios mientras se cotiza y su consumo de material. Con sus diálogos.
 *
 * Van en la fila de cada proceso de proveedor en la Ruta de la orden
 * (2026-11-11), en vez de la tarjeta «Servicios a talleres».
 */
export const ServiceOrderActions = ({
  encargo,
  enCotizacionId,
  imprimiendo,
  onPrint,
  onChanged,
  vertical = false,
}: ServiceOrderActionsProps) => {
  const boton = vertical ? "w-full justify-start gap-2" : "gap-2";
  const [situacion, setSituacion] = useState(false);
  const [precios, setPrecios] = useState(false);
  /**
   * El consumo de material (0241). Como la situación y el precio, vale para
   * todos sus servicios: qué material gasta el paso y de qué almacén, y se
   * descuenta al recibirlo.
   */
  const [consumo, setConsumo] = useState(false);

  return (
    <div className={vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={boton}
        disabled={imprimiendo !== null}
        onClick={() => onPrint(encargo)}
        title="Imprimir la orden de servicio de este taller"
      >
        {imprimiendo === claveDe(encargo) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Orden de servicio
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={boton}
        onClick={() => setSituacion(true)}
        title="Si ya se cotizó o ya se pagó, por servicio"
      >
        <ListChecks className="h-4 w-4" />
        Situación
      </Button>
      {/* Solo mientras se cotiza: después el precio está cerrado. */}
      {enCotizacionId !== null && encargo.services.some((s) => s.situationId === enCotizacionId) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={boton}
          onClick={() => setPrecios(true)}
          title="Cambiar el precio mientras está En cotización"
        >
          <Tag className="h-4 w-4" />
          Precios
        </Button>
      )}
      {/* Cuelga de la cotización: sin su id no hay dónde declararlo
          (backend anterior, fila por taller). */}
      {encargo.quotationId !== null && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={boton}
          onClick={() => setConsumo(true)}
          title="Qué material consume este paso y de qué almacén sale"
        >
          <Package className="h-4 w-4" />
          Consumo
        </Button>
      )}

      {situacion && (
        <ServiceSituationDialog
          open
          onOpenChange={(value) => !value && setSituacion(false)}
          quotationCode={encargo.quotationCode}
          supplierName={encargo.supplierName}
          services={encargo.services}
          onSaved={() => onChanged?.()}
        />
      )}
      {precios && (
        <ServicePricesDialog
          open
          onOpenChange={(value) => !value && setPrecios(false)}
          quotationCode={encargo.quotationCode}
          supplierName={encargo.supplierName}
          services={encargo.services}
          onSaved={() => onChanged?.()}
        />
      )}
      {consumo && encargo.quotationId !== null && (
        <QuotationConsumptionsDialog
          open
          onOpenChange={(value) => !value && setConsumo(false)}
          quotationId={encargo.quotationId}
          quotationLabel={[encargo.quotationCode, encargo.processes].filter(Boolean).join(" · ") || null}
          // El consumo cambia el requerimiento de la orden (consumido y
          // faltante): se relee como tras cambiar una situación.
          onSaved={() => onChanged?.()}
        />
      )}
    </div>
  );
};
