import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/shared/utils/date";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getStockMovementDetailApi } from "../../services/Movements.service";
import { stockMovementDetailAdapter } from "../../adapters/Movements.adapter";
import { StockMovementDetail } from "../../types/Movements.types";

interface MovementsDetailModalProps {
    movementId: number | null;
    onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-right">{value}</span>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {children}
    </h3>
);

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
            .then((response) => setDetail(stockMovementDetailAdapter(response)))
            .catch((err: Error) => setError(err?.message ?? "Error al cargar el movimiento"))
            .finally(() => setLoading(false));
    }, [movementId]);

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    const isEntrance = (detail?.quantity ?? 0) > 0;
    const units = Math.abs(detail?.quantity ?? 0) === 1 ? "unidad" : "unidades";
    const accent = isEntrance ? "text-emerald-500" : "text-rose-400";
    const accentBg = isEntrance
        ? "bg-emerald-500/10 text-emerald-500"
        : "bg-rose-500/10 text-rose-400";
    const DirectionIcon = isEntrance ? ArrowUpRight : ArrowDownRight;

    const hasLinks =
        (detail?.links.order_products.length ?? 0) > 0 ||
        (detail?.links.returns_products.length ?? 0) > 0 ||
        (detail?.links.linked_stock_movement_requests.length ?? 0) > 0 ||
        (detail?.links.supplier_service_stock.length ?? 0) > 0;

    return (
        <Dialog open={movementId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="flex flex-col max-w-md gap-0 p-0 overflow-hidden rounded-xl max-h-[85vh]">
                {/* Cabecera */}
                <DialogHeader className="px-6 pt-5 space-y-0 shrink-0">
                    <DialogTitle className="pr-8 text-base font-normal text-muted-foreground">
                        Movimiento #{movementId}
                        {detail ? ` · ${formatDateTime(detail.createdAt)}` : ""}
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando...
                        </div>
                    )}

                    {error && !loading && (
                        <p className="py-10 text-sm text-center text-rose-500">{error}</p>
                    )}

                    {!loading && !error && detail && (
                        <>
                            {/* Cantidad */}
                            <div className="flex items-center gap-3 px-6 py-5 border-b">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${accentBg}`}>
                                    <DirectionIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-xs font-medium ${accent}`}>
                                        {isEntrance ? "Entrada" : "Salida"}
                                    </p>
                                    <p className={`text-2xl font-bold ${accent}`}>
                                        {isEntrance ? "+" : "-"}{Math.abs(detail.quantity)} {units}
                                    </p>
                                </div>
                            </div>

                            {/* Producto */}
                            <div className="px-6 py-5 space-y-2 border-b text-sm">
                                <SectionTitle>Producto</SectionTitle>
                                <div>
                                    <p className="font-medium text-sm">
                                        {detail.productTitle} — {detail.variationLabel}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        SKU <span className="ml-1 font-mono">{detail.sku}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Datos generales */}
                            <div className="px-6 py-5 space-y-3">
                                <InfoRow label="Categoría" value={detail.movementType} />
                                <InfoRow label="Almacén" value={detail.warehouse} />
                                <InfoRow label="Tipo de stock" value={detail.stockType} />
                                <InfoRow label="Registrado por" value={detail.user} />
                                {detail.vinculatedMovementId && (
                                    <InfoRow
                                        label="Movimiento vinculado"
                                        value={`#${detail.vinculatedMovementId}`}
                                    />
                                )}
                            </div>

                            {/* Pedidos vinculados */}
                            {detail.links.order_products.length > 0 && (
                                <div className="px-6 pb-5 space-y-2">
                                    <SectionTitle>
                                        {detail.links.order_products.length === 1
                                            ? "Pedido vinculado"
                                            : "Pedidos vinculados"}
                                    </SectionTitle>
                                    {detail.links.order_products.map((op) => (
                                        <button
                                            key={op.id}
                                            type="button"
                                            onClick={() => handleNavigate(`/sales/edit/${op.order_id}`)}
                                            className="flex items-start justify-between w-full gap-4 px-4 py-3 text-left transition-colors border rounded-lg hover:bg-accent"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-base font-medium">Pedido #{op.order_id}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {op.order_customer_name ? `${op.order_customer_name} · ` : ""}
                                                    Cant: {op.quantity} · S/ {Number(op.product_price).toFixed(2)}
                                                    {op.product_discount ? ` (desc. ${op.product_discount}%)` : ""}
                                                </p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Devoluciones vinculadas */}
                            {detail.links.returns_products.length > 0 && (
                                <div className="px-6 pb-5 space-y-2">
                                    <SectionTitle>
                                        {detail.links.returns_products.length === 1
                                            ? "Devolución vinculada"
                                            : "Devoluciones vinculadas"}
                                    </SectionTitle>
                                    {detail.links.returns_products.map((rp) => (
                                        <button
                                            key={rp.id}
                                            type="button"
                                            onClick={() => handleNavigate(`/returns/edit/${rp.return_id}`)}
                                            className="flex items-start justify-between w-full gap-4 px-4 py-3 text-left transition-colors border rounded-lg hover:bg-accent"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-base font-medium">Devolución #{rp.return_id}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cant: {rp.return_quantity}
                                                    {rp.product_amount !== null
                                                        ? ` · S/ ${Number(rp.product_amount).toFixed(2)}`
                                                        : ""}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={rp.output ? "default" : "secondary"} className="text-xs">
                                                        {rp.output ? "Salida" : "Entrada"}
                                                    </Badge>
                                                    {rp.return_reason && (
                                                        <span className="text-xs text-muted-foreground">{rp.return_reason}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Solicitudes de traslado */}
                            {detail.links.linked_stock_movement_requests.length > 0 && (
                                <div className="px-6 pb-5 space-y-2">
                                    <SectionTitle>
                                        {detail.links.linked_stock_movement_requests.length === 1
                                            ? "Solicitud de traslado"
                                            : "Solicitudes de traslado"}
                                    </SectionTitle>
                                    {detail.links.linked_stock_movement_requests.map((lr) => (
                                        <div key={lr.id} className="px-4 py-3 space-y-1.5 border rounded-lg">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-base font-medium">
                                                    Solicitud #{lr.stock_movement_request_id}
                                                </span>
                                                <Badge
                                                    variant={
                                                        lr.approved === true
                                                            ? "default"
                                                            : lr.approved === false
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {lr.approved === true
                                                        ? "Aprobado"
                                                        : lr.approved === false
                                                            ? "Rechazado"
                                                            : "Pendiente"}
                                                </Badge>
                                            </div>
                                            {(lr.out_warehouse || lr.in_warehouse) && (
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <span>{lr.out_warehouse ?? "—"}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span>{lr.in_warehouse ?? "—"}</span>
                                                </div>
                                            )}
                                            {lr.created_at && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(lr.created_at)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Servicios de proveedor */}
                            {detail.links.supplier_service_stock.length > 0 && (
                                <div className="px-6 pb-5 space-y-2">
                                    <SectionTitle>
                                        {detail.links.supplier_service_stock.length === 1
                                            ? "Servicio de proveedor"
                                            : "Servicios de proveedor"}
                                    </SectionTitle>
                                    {detail.links.supplier_service_stock.map((ss) => (
                                        <div key={ss.id} className="px-4 py-3 space-y-1 border rounded-lg">
                                            <p className="text-base font-medium">
                                                {ss.service_name ?? `Servicio #${ss.supplier_service_id}`}
                                            </p>
                                            {ss.unit_cost !== null && (
                                                <p className="text-sm text-muted-foreground">
                                                    Costo unitario: S/ {Number(ss.unit_cost).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!hasLinks && (
                                <p className="px-6 pb-6 text-sm text-center text-muted-foreground">
                                    Este movimiento no tiene vínculos registrados.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MovementsDetailModal;
