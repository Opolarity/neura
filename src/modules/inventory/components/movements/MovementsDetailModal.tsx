import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/shared/utils/date";
import { Loader2, ExternalLink, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockMovementDetailApi } from "../../services/Movements.service";
import { StockMovementDetail } from "../../types/Movements.types";

interface MovementsDetailModalProps {
  movementId: number | null;
  onClose: () => void;
}

const MovementsDetailModal = ({ movementId, onClose }: MovementsDetailModalProps) => {
  const [detail, setDetail] = useState<StockMovementDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (movementId === null) {
      setDetail(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getStockMovementDetailApi(movementId)
      .then(setDetail)
      .catch((err: Error) => setError(err?.message ?? "Error al cargar el movimiento"))
      .finally(() => setLoading(false));
  }, [movementId]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const formatDate = (dateStr: string | null) => dateStr ? formatDateTime(dateStr) : "—";

  return (
    <Dialog open={movementId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Movimiento #{movementId}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 py-4 text-center">{error}</p>
        )}

        {!loading && !error && detail && (
          <div className="space-y-6">
            {/* Información General */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Información General
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cantidad</span>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      detail.quantity > 0
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    }`}>
                      {detail.quantity > 0 ? "+" : ""}{detail.quantity}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de Movimiento</span>
                  <p className="mt-0.5 font-medium">{detail.movement_type?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Almacén</span>
                  <p className="mt-0.5 font-medium">{detail.warehouse?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de Stock</span>
                  <p className="mt-0.5 font-medium">{detail.stock_type?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SKU Variación</span>
                  <p className="mt-0.5 font-medium">{detail.variation?.sku ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Usuario</span>
                  <p className="mt-0.5 font-medium">{detail.created_by_profile?.user_name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha</span>
                  <p className="mt-0.5 font-medium">{formatDate(detail.created_at)}</p>
                </div>
                {detail.vinculated_movement_id && (
                  <div>
                    <span className="text-muted-foreground">Movimiento Vinculado</span>
                    <p className="mt-0.5 font-medium">#{detail.vinculated_movement_id}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Pedidos vinculados */}
            {detail.links.order_products.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pedidos vinculados
                </h3>
                <div className="space-y-2">
                  {detail.links.order_products.map((op) => (
                    <Button
                      key={op.id}
                      variant="outline"
                      className="w-full h-auto py-3 px-4 flex items-start justify-between text-left"
                      onClick={() => handleNavigate(`/sales/edit/${op.order_id}`)}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{op.product_name ?? `Pedido #${op.order_id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Pedido #{op.order_id}
                          {op.order_customer_name ? ` · ${op.order_customer_name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cant: {op.quantity} · S/ {op.product_price.toFixed(2)}
                          {op.product_discount > 0 ? ` (desc. ${op.product_discount}%)` : ""}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* Devoluciones vinculadas */}
            {detail.links.returns_products.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Devoluciones vinculadas
                </h3>
                <div className="space-y-2">
                  {detail.links.returns_products.map((rp) => (
                    <Button
                      key={rp.id}
                      variant="outline"
                      className="w-full h-auto py-3 px-4 flex items-start justify-between text-left"
                      onClick={() => handleNavigate(`/returns/edit/${rp.return_id}`)}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Devolución #{rp.return_id}</p>
                        <p className="text-xs text-muted-foreground">
                          Cant: {rp.return_quantity}
                          {rp.product_amount ? ` · S/ ${Number(rp.product_amount).toFixed(2)}` : ""}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={rp.output ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                            {rp.output ? "Salida" : "Entrada"}
                          </Badge>
                          {rp.return_reason && (
                            <span className="text-xs text-muted-foreground">{rp.return_reason}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* Solicitudes de traslado */}
            {detail.links.linked_stock_movement_requests.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Solicitudes de traslado vinculadas
                </h3>
                <div className="space-y-2">
                  {detail.links.linked_stock_movement_requests.map((lr) => (
                    <div
                      key={lr.id}
                      className="rounded-md border px-4 py-3 text-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Solicitud #{lr.stock_movement_request_id}</span>
                        <Badge
                          variant={lr.approved === true ? "default" : lr.approved === false ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {lr.approved === true ? "Aprobado" : lr.approved === false ? "Rechazado" : "Pendiente"}
                        </Badge>
                      </div>
                      {(lr.out_warehouse || lr.in_warehouse) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <span>{lr.out_warehouse ?? "—"}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{lr.in_warehouse ?? "—"}</span>
                        </div>
                      )}
                      {lr.created_at && (
                        <p className="text-xs text-muted-foreground">{formatDate(lr.created_at)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Servicios de proveedor */}
            {detail.links.supplier_service_stock.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Servicios de proveedor vinculados
                </h3>
                <div className="space-y-2">
                  {detail.links.supplier_service_stock.map((ss) => (
                    <div
                      key={ss.id}
                      className="rounded-md border px-4 py-3 text-sm space-y-1"
                    >
                      <p className="font-medium">{ss.service_name ?? `Servicio #${ss.supplier_service_id}`}</p>
                      {ss.unit_cost !== null && (
                        <p className="text-xs text-muted-foreground">Costo unitario: S/ {Number(ss.unit_cost).toFixed(2)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sin vínculos */}
            {detail.links.order_products.length === 0 &&
              detail.links.returns_products.length === 0 &&
              detail.links.linked_stock_movement_requests.length === 0 &&
              detail.links.supplier_service_stock.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Este movimiento no tiene vínculos registrados.
                </p>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovementsDetailModal;
