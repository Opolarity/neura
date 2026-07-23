import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  FileText,
  Eye,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getMovementDetails, sendFranchiseePayment } from "../../services/movements.service";
import { movementDetailAdapter } from "../../adapters/Movement.adapter";
import { MovementDetail, MovementDetailApiResponse } from "../../types/Movements.types";

interface MovementDetailDialogProps {
  movementId: number | null;
  onClose: () => void;
}

const formatCurrency = (amount: number): string =>
  amount.toLocaleString("es-PE", { style: "currency", currency: "PEN" });

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between gap-4 py-1.5">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-right font-medium max-w-[60%]">{value}</span>
  </div>
);

const MovementDetailDialog = ({ movementId, onClose }: MovementDetailDialogProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };
  const [detail, setDetail] = useState<MovementDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!detail || !movementId || !detail.franchiseAccount) return;
    setSending(true);
    setSendError(null);
    try {
      await sendFranchiseePayment({
        movementId,
        amount: detail.amount,
        description: detail.description,
        filesUrl: detail.filesUrl,
        movementDate: detail.date,
        franchiseAccount: detail.franchiseAccount,
        orderIds: detail.orderIds,
      });
      const data: MovementDetailApiResponse = await getMovementDetails(movementId);
      setDetail(movementDetailAdapter(data.movement, data.is_franchise_movement ?? false, data.franchise_account ?? null, data.order_ids ?? [], data.links ?? null));
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (movementId === null) {
      setDetail(null);
      setError(null);
      setSendError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getMovementDetails(movementId)
      .then((data: MovementDetailApiResponse) =>
        setDetail(movementDetailAdapter(data.movement, data.is_franchise_movement ?? false, data.franchise_account ?? null, data.order_ids ?? [], data.links ?? null))
      )
      .catch((err: Error) => setError(err?.message ?? "Error al cargar el movimiento"))
      .finally(() => setLoading(false));
  }, [movementId]);

  const isIncome = detail?.type === "Ingreso";

  return (
    <Dialog open={movementId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {detail ? `Movimiento #${detail.id} · ${detail.date}` : "Detalle del Movimiento"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        )}

        {error && (
          <div className="py-4 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-4 text-sm">
            {/* Encabezado con monto */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isIncome ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"
                }`}
              >
                {isIncome ? (
                  <ArrowUpRight className="h-6 w-6" />
                ) : (
                  <ArrowDownRight className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className={`text-xs font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}>
                  {detail.type}
                </p>
                <p className={`text-2xl font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                  {isIncome ? "+" : "-"}
                  {detail.formattedAmount}
                </p>
              </div>
            </div>

            {/* Detalles */}
            <div className="border-t pt-2">
              <DetailRow label="Categoría" value={detail.category} />
              <DetailRow label="Descripción" value={detail.description} />
              <DetailRow label="Método de pago" value={detail.paymentMethod} />
              <DetailRow label="Cuenta" value={detail.businessAccount} />
              <DetailRow label="Sucursal" value={detail.branch} />
              <DetailRow label="Registrado por" value={detail.user} />
            </div>

            {/* Franquiciado */}
            {detail.isFranchiseMovement && (
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Enviado a franquiciado</span>
                  {detail.franchisee_sended ? (
                    <span className="font-medium">
                      {detail.franchisee_sended.split("T")[0].split("-").reverse().join("/")}
                    </span>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="text-xs px-2 py-1 rounded border border-input hover:bg-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {sending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Enviar
                    </button>
                  )}
                </div>
                {sendError && <p className="text-xs text-red-500 text-right">{sendError}</p>}
              </div>
            )}

            {/* Pedido vinculado */}
            {detail.links?.link_order && detail.links.link_order.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pedido vinculado
                </h3>
                {detail.links.link_order.map((item) => (
                  <Button
                    key={item.order_payment_id}
                    variant="outline"
                    className="w-full h-auto py-3 px-4 flex items-center justify-between text-left"
                    onClick={() => handleNavigate(`/sales/edit/${item.order_id}`)}
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Pedido #{item.order_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {`${item.customer_name} ${item.customer_lastname}`.trim() || "-"} · {formatCurrency(item.order_total)}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Button>
                ))}
              </div>
            )}

            {/* Pagos registrados (de este movimiento) */}
            {detail.links?.link_order && detail.links.link_order.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pagos registrados
                </h3>
                {detail.links.link_order.map((item) => (
                  <div key={item.order_payment_id} className="rounded-lg border px-4 py-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
                      {item.completed !== null && (
                        <span
                          className={`text-xs ${
                            item.completed ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          {item.completed ? "Completado" : "Pendiente"}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">
                          {item.date.split("T")[0].split("-").reverse().join("/")}
                        </span>
                      </div>
                    )}
                    {item.gateway_confirmation_code && (
                      <p className="text-xs text-muted-foreground">
                        Cód. confirmación: {item.gateway_confirmation_code}
                      </p>
                    )}
                    {item.voucher_url && (
                      <a
                        href={item.voucher_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver voucher
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Devoluciones vinculadas */}
            {detail.links?.link_returns && detail.links.link_returns.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Devoluciones vinculadas
                </h3>
                {detail.links.link_returns.map((item) => (
                  <Button
                    key={item.order_payment_id}
                    variant="outline"
                    className="w-full h-auto py-3 px-4 flex items-center justify-between text-left"
                    onClick={() => handleNavigate(`/sales/edit/${item.order_id}`)}
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Devolución #{item.order_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {`${item.customer_name} ${item.customer_lastname}`.trim() || "-"} · {formatCurrency(item.order_total)}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Button>
                ))}
              </div>
            )}

            {/* Comprobante (adjuntos del movimiento) */}
            {detail.filesUrl.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Comprobante
                </h3>
                <div className="space-y-2">
                  {detail.filesUrl.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-dashed px-4 py-2.5 hover:bg-accent"
                    >
                      <span className="inline-flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {url.split("/").pop()}
                      </span>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovementDetailDialog;
