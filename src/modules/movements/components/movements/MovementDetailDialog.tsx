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
import { ComponentPermission } from "@/shared/components/component-permission";

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
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
          <div className="py-4 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-4 text-sm flex-1 overflow-y-auto pr-1 -mr-1">
            {/* Encabezado con monto */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isIncome ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}
              >
                {isIncome ? (
                  <ArrowUpRight className="h-6 w-6" />
                ) : (
                  <ArrowDownRight className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className={`text-xs font-medium ${isIncome ? "text-success" : "text-destructive"}`}>
                  {detail.type}
                </p>
                <p className={`text-2xl font-bold ${isIncome ? "text-success" : "text-destructive"}`}>
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
                {sendError && <p className="text-xs text-destructive text-right">{sendError}</p>}
              </div>
            )}

            {/* Pedido vinculado */}
            {detail.links?.link_order && detail.links.link_order.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                {/* El botón lleva a /sales/edit/:id, ya protegida con sales.edit:
                    se reutiliza ese code para no ofrecer un atajo que acaba en
                    una pantalla bloqueada. */}
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pedidos vinculados ({detail.links.link_order.length})
                </h3>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {detail.links.link_order.map((item) => (
                    <ComponentPermission key={item.order_payment_id} codeIn={["sales.edit"]}>
                      <Button
                        variant="outline"
                        className="w-full h-auto py-2 px-3 flex items-center justify-between text-left"
                        onClick={() => handleNavigate(`/sales/edit/${item.order_id}`)}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">Pedido #{item.order_id}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {`${item.customer_name} ${item.customer_lastname}`.trim() || "-"} · {formatCurrency(item.order_total)}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Button>
                    </ComponentPermission>
                  ))}
                </div>
              </div>
            )}

            {/* Pagos registrados (de este movimiento) */}
            {detail.links?.link_order && detail.links.link_order.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pagos registrados ({detail.links.link_order.length})
                </h3>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {detail.links.link_order.map((item) => (
                    <div key={item.order_payment_id} className="rounded-lg border px-3 py-2 space-y-0.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-semibold">{formatCurrency(item.amount)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.date && (
                            <span className="text-[11px] text-muted-foreground">
                              {item.date.split("T")[0].split("-").reverse().join("/")}
                            </span>
                          )}
                          {item.completed !== null && (
                            <span
                              className={`text-[11px] ${
                                item.completed ? "text-success" : "text-muted-foreground"
                              }`}
                            >
                              {item.completed ? "Completado" : "Pendiente"}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.gateway_confirmation_code && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          Cód. confirmación: {item.gateway_confirmation_code}
                        </p>
                      )}
                      {item.voucher_url && (
                        <a
                          href={item.voucher_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium inline-flex items-center gap-1 text-[11px] hover:underline"
                        >
                          <Eye className="w-3 h-3" /> Ver voucher
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devoluciones vinculadas */}
            {detail.links?.link_returns && detail.links.link_returns.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Devoluciones vinculadas ({detail.links.link_returns.length})
                </h3>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {detail.links.link_returns.map((item) => (
                    <ComponentPermission key={item.order_payment_id} codeIn={["sales.edit"]}>
                      <Button
                        variant="outline"
                        className="w-full h-auto py-2 px-3 flex items-center justify-between text-left"
                        onClick={() => handleNavigate(`/sales/edit/${item.order_id}`)}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">Devolución #{item.order_id}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {`${item.customer_name} ${item.customer_lastname}`.trim() || "-"} · {formatCurrency(item.order_total)}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Button>
                    </ComponentPermission>
                  ))}
                </div>
              </div>
            )}

            {/* Comprobante (adjuntos del movimiento) */}
            {detail.filesUrl.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Comprobante
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {detail.filesUrl.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 hover:bg-accent"
                    >
                      <span className="inline-flex items-center gap-2 text-xs min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{url.split("/").pop()}</span>
                      </span>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
