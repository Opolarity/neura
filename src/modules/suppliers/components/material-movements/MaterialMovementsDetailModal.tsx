import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { formatDateDisplay } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { MaterialMovementDetail } from "../../types/materialMovements.types";
import { materialDispatchGuideApi } from "../../services/materialDispatch.service";
import { openMaterialRemisionGuide } from "../../utils/materialRemisionGuide";

interface MaterialMovementsDetailModalProps {
  movementId: number | null;
  detail: MaterialMovementDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value}</span>
  </div>
);

const ORIGIN_LABEL: Record<"supplier_service" | "production_order", string> = {
  supplier_service: "Servicio de proveedor",
  production_order: "Orden de producción",
};

/**
 * A dónde lleva el origen.
 *
 * La orden tiene su propia pantalla. El servicio ya no --la de Servicios se
 * retiró-- así que se va a la COTIZACIÓN de la que cuelga, que es donde vive
 * ese servicio con su precio y su avance. Sin cotización no hay a dónde ir y
 * el origen se queda como texto, en vez de un enlace que no lleva a nada.
 */
const origenHref = (origin: MaterialMovementDetail["origin"]): string | null => {
  if (!origin) return null;
  if (origin.kind === "production_order") {
    return `/suppliers/production-orders/${origin.id}`;
  }
  return origin.quotationId ? `/quotations/view/${origin.quotationId}` : null;
};

const MaterialMovementsDetailModal = ({
  movementId,
  detail,
  loading,
  error,
  onClose,
}: MaterialMovementsDetailModalProps) => {
  const [printing, setPrinting] = useState(false);

  /**
   * La guía de remisión del envío. Se arma en el backend a partir de este
   * apunte: trae el envío entero, no solo esta línea, así que el papel es el
   * mismo se imprima desde la salida o desde la entrada al taller.
   */
  const handlePrintGuide = async () => {
    if (!detail) return;
    try {
      setPrinting(true);
      const guide = await materialDispatchGuideApi(detail.id);
      if (!guide) {
        toastError(null, "Este movimiento no es un envío a taller");
        return;
      }
      await openMaterialRemisionGuide(guide);
    } catch (err) {
      toastError(err, "No se pudo generar la guía de remisión");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={movementId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle del movimiento</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando detalle...
          </div>
        ) : error ? (
          <p className="py-10 text-center text-muted-foreground">{error}</p>
        ) : detail ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Material" value={detail.materialName} />
              <Field label="Clase" value={detail.materialClassName || "—"} />
              <Field label="Unidad" value={detail.measurementUnit || "—"} />

              <Field
                label="Cantidad"
                value={
                  <Badge
                    variant={detail.quantity > 0 ? "success" : "destructive-soft"}
                  >
                    {detail.quantity > 0 ? "+" : ""}
                    {detail.quantity}
                  </Badge>
                }
              />
              <Field label="Tipo de movimiento" value={detail.movementType} />
              <Field label="Tipo de stock" value={detail.stockType} />

              <Field label="Almacén" value={detail.warehouse} />
              <Field label="Fecha" value={formatDateDisplay(detail.createdAt)} />
              <Field label="Usuario" value={detail.user} />

              <Field
                label="Estado"
                value={
                  detail.completed ? (
                    <Badge variant="success">Culminado</Badge>
                  ) : (
                    <Badge variant="pending">Pendiente</Badge>
                  )
                }
              />
              <Field
                label="Costo unitario"
                value={detail.unitCost === null ? "—" : detail.unitCost.toFixed(2)}
              />
              <Field
                label="Movimiento vinculado"
                value={
                  detail.vinculatedMovementId
                    ? `#${detail.vinculatedMovementId}`
                    : "—"
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Origen</h3>
              {detail.supplierQuotationId ? (
                // Envío de material a un taller: lleva cotización, y la guía
                // de remisión es el papel que acompaña al bulto.
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border p-3">
                  <Field
                    label="Envío a cotización"
                    value={
                      <Link
                        to={`/quotations/view/${detail.supplierQuotationId}`}
                        className="inline-flex items-center gap-1.5 font-medium hover:underline"
                        onClick={onClose}
                      >
                        {detail.supplierQuotationCode ?? `#${detail.supplierQuotationId}`}
                        {detail.origin ? ` · ${detail.origin.label}` : ""}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    }
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handlePrintGuide}
                    disabled={printing}
                  >
                    {printing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Guía de remisión
                  </Button>
                </div>
              ) : detail.origin ? (
                <div className="rounded-lg border border-border p-3">
                  <Field
                    label={ORIGIN_LABEL[detail.origin.kind]}
                    value={(() => {
                      const texto = `${detail.origin.label} (#${detail.origin.id})`;
                      const href = origenHref(detail.origin);

                      // Lo enlazable se distingue por PESO, no por color:
                      // el icono acompaña sin teñir el texto.
                      return href ? (
                        <Link
                          to={href}
                          className="inline-flex items-center gap-1.5 font-medium hover:underline"
                          onClick={onClose}
                        >
                          {texto}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      ) : (
                        texto
                      );
                    })()}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Movimiento manual: no proviene de una compra ni de una orden
                  de producción.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialMovementsDetailModal;
