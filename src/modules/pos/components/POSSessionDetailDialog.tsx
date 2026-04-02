import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatTime } from "@/modules/sales/adapters/POS.adapter";
import { supabase } from "@/integrations/supabase/client";
import { getPOSSessionDetail } from "../services/POSDetail.service";
import { adaptPOSSessionDetail } from "../adapters/POSDetail.adapter";
import type { POSSessionDetail, POSSessionOrder } from "../types/POSDetail.types";

interface PaymentMethodSummary {
  paymentMethodName: string;
  total: number;
}

interface POSSessionDetailDialogProps {
  sessionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POSSessionDetailDialog = ({
  sessionId,
  open,
  onOpenChange,
}: POSSessionDetailDialogProps) => {
  const [session, setSession] = useState<POSSessionDetail | null>(null);
  const [orders, setOrders] = useState<POSSessionOrder[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentMethodSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      loadDetail(sessionId);
    }
    if (!open) {
      setSession(null);
      setOrders([]);
      setPaymentSummary([]);
    }
  }, [open, sessionId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const [response, payments] = await Promise.all([
        getPOSSessionDetail(id),
        loadPaymentSummary(id),
      ]);
      const adapted = adaptPOSSessionDetail(response);
      setSession(adapted.session);
      setOrders(adapted.orders);
      setPaymentSummary(payments);
    } catch (err) {
      console.error("Error loading session detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentSummary = async (sessionId: number): Promise<PaymentMethodSummary[]> => {
    const { data: sessionOrders, error: soError } = await supabase
      .from("pos_session_orders")
      .select("order_id")
      .eq("pos_session_id", sessionId);

    if (soError || !sessionOrders?.length) return [];

    const orderIds = sessionOrders.map((o) => o.order_id);

    const { data: payments, error: pError } = await (supabase as any)
      .from("order_payment")
      .select("amount, payment_methods(name)")
      .in("order_id", orderIds);

    if (pError || !payments?.length) return [];

    const map = new Map<string, number>();
    for (const p of payments) {
      const name = p.payment_methods?.name ?? "Sin método";
      map.set(name, (map.get(name) ?? 0) + (Number(p.amount) || 0));
    }

    return Array.from(map.entries())
      .map(([paymentMethodName, total]) => ({ paymentMethodName, total }))
      .sort((a, b) => b.total - a.total);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (statusCode: string, statusName: string) => {
    if (statusCode === "OPE") {
      return <Badge className="bg-green-500 hover:bg-green-500">{statusName}</Badge>;
    }
    if (statusCode === "CLO") {
      return <Badge className="bg-gray-500 hover:bg-gray-500">{statusName}</Badge>;
    }
    return <Badge variant="outline">{statusName}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalle de Sesión {session ? `#${session.id}` : ""}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : session ? (
          <div className="space-y-6">
            {/* Session Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem label="Usuario" value={session.userName} />
              <InfoItem label="Sucursal" value={session.branchName} />
              <InfoItem label="Almacén" value={session.warehouseName} />
              <InfoItem
                label="Estado"
                value={getStatusBadge(session.statusCode, session.statusName)}
              />
              <InfoItem
                label="Apertura"
                value={`${formatDate(session.openedAt)} ${formatTime(session.openedAt)}`}
              />
              <InfoItem
                label="Cierre"
                value={
                  session.closedAt
                    ? `${formatDate(session.closedAt)} ${formatTime(session.closedAt)}`
                    : "-"
                }
              />
              <InfoItem
                label="Monto Apertura"
                value={`S/ ${formatCurrency(session.openingAmount)}`}
              />
              <InfoItem
                label="Dif. Apertura"
                value={`S/ ${formatCurrency(session.openingDifference)}`}
              />
              <InfoItem
                label="Ventas Totales"
                value={
                  session.totalSales !== null
                    ? `S/ ${formatCurrency(session.totalSales)}`
                    : "-"
                }
              />
              <InfoItem
                label="Monto Esperado"
                value={
                  session.expectedAmount !== null
                    ? `S/ ${formatCurrency(session.expectedAmount)}`
                    : "-"
                }
              />
              <InfoItem
                label="Monto Cierre"
                value={
                  session.closingAmount !== null
                    ? `S/ ${formatCurrency(session.closingAmount)}`
                    : "-"
                }
              />
              <InfoItem
                label="Diferencia"
                value={
                  session.difference !== null ? (
                    <span
                      className={
                        session.difference < 0
                          ? "text-red-500"
                          : session.difference > 0
                          ? "text-green-500"
                          : ""
                      }
                    >
                      S/ {formatCurrency(session.difference)}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
            </div>

            {session.notes && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Notas</span>
                <p className="text-sm mt-1">{session.notes}</p>
              </div>
            )}

            {/* Payment Summary */}
            {paymentSummary.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Ingresos por Método de Pago
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  {paymentSummary.map((item) => (
                    <div
                      key={item.paymentMethodName}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{item.paymentMethodName}</span>
                      <span className="font-medium">S/ {formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1.5 flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>
                      S/ {formatCurrency(paymentSummary.reduce((sum, i) => sum + i.total, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Órdenes ({orders.length})
              </h4>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.documentNumber}</TableCell>
                        <TableCell>S/ {formatCurrency(order.subtotal)}</TableCell>
                        <TableCell>S/ {formatCurrency(order.discount)}</TableCell>
                        <TableCell className="font-medium">
                          S/ {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(order.createdAt)}</div>
                            <div className="text-muted-foreground">
                              {formatTime(order.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay órdenes registradas en esta sesión
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="text-sm font-medium mt-0.5">{value}</div>
  </div>
);

export default POSSessionDetailDialog;
