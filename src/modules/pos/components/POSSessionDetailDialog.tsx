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
import {
  formatCurrency,
  formatTime,
} from "@/modules/sales/adapters/POS.adapter";
import { formatDateDisplay } from "@/shared/utils/date";
import { getPOSSessionDetail } from "../services/POSDetail.service";
import { adaptPOSSessionDetail } from "../adapters/POSDetail.adapter";
import type {
  POSSessionDetail,
  POSSessionOrder,
  POSSessionPaymentItem,
} from "../types/POSDetail.types";

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
  const [incomePayments, setIncomePayments] = useState<POSSessionPaymentItem[]>([]);
  const [changePayments, setChangePayments] = useState<POSSessionPaymentItem[]>([]);
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [totalVueltos, setTotalVueltos] = useState<number>(0);
  const [otherIngresos, setOtherIngresos] = useState<number>(0);
  const [otherEgresos, setOtherEgresos] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      loadDetail(sessionId);
    }
    if (!open) {
      setSession(null);
      setOrders([]);
      setIncomePayments([]);
      setChangePayments([]);
      setTotalIngresos(0);
      setTotalVueltos(0);
      setOtherIngresos(0);
      setOtherEgresos(0);
    }
  }, [open, sessionId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const response = await getPOSSessionDetail(id);
      const adapted = adaptPOSSessionDetail(response);
      setSession(adapted.session);
      setOrders(adapted.orders);
      setIncomePayments(adapted.incomePayments);
      setChangePayments(adapted.changePayments);
      setTotalIngresos(adapted.totalIngresos);
      setTotalVueltos(adapted.totalVueltos);
      // get_pos_session_detail already calculates these with proper session bounds
      setOtherIngresos(adapted.session.otherIncome);
      setOtherEgresos(adapted.session.otherExpenses);
    } catch (err) {
      console.error("Error loading session detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => formatDateDisplay(dateString);

  const getStatusBadge = (statusCode: string, statusName: string) => {
    if (statusCode === "OPE") {
      return (
        <Badge className="bg-green-500 hover:bg-green-500">{statusName}</Badge>
      );
    }
    if (statusCode === "CLO") {
      return (
        <Badge className="bg-gray-500 hover:bg-gray-500">{statusName}</Badge>
      );
    }
    return <Badge variant="outline">{statusName}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[56rem] max-h-[85vh] overflow-y-auto">
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
              <h4 className="col-span-2 md:col-span-3 text-start text-sm font-semibold">
                Cuadre de Caja
              </h4>
              <InfoItem
                label="Monto Apertura"
                value={`S/ ${formatCurrency(session.openingAmount)}`}
              />
              <InfoItem
                label="Dif. Apertura"
                value={`S/ ${formatCurrency(session.openingDifference)}`}
              />
              <InfoItem
                label="Ventas Totales Efectivo"
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
              <div className="col-span-2 md:col-span-3 space-y-1">
                <span className="text-sm text-muted-foreground">Otros ajustes de efectivo externos</span>
                <div className="flex gap-6 pl-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Ingresos</span>
                    <div className="text-sm font-medium text-blue-600">+ S/ {formatCurrency(otherIngresos)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Egresos</span>
                    <div className="text-sm font-medium text-destructive">- S/ {formatCurrency(otherEgresos)}</div>
                  </div>
                </div>
              </div>
            </div>

            {session.notes && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Notas
                </span>
                <p className="text-sm mt-1">{session.notes}</p>
              </div>
            )}

            {/* Income & Change Section */}
            {(incomePayments.length > 0 || changePayments.length > 0) && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Income Payments */}
                {incomePayments.length > 0 && (
                  <div className="flex-1">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                      <h4 className="text-sm font-semibold text-slate-600 mb-2">
                        INGRESOS POR MÉTODO DE PAGO
                      </h4>
                      {incomePayments.map((item) => (
                        <div
                          key={item.payment_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {item.payment_method}
                          </span>
                          <span className="font-medium">
                            S/ {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-sm font-semibold">
                        <span>TOTAL INGRESOS</span>
                        <span>
                          S/ {formatCurrency(totalIngresos)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Change Payments */}
                {changePayments.length > 0 && (
                  <div className="flex-1">
                    <div className="bg-blue-50/50 rounded-lg p-3 space-y-1.5">
                      <h4 className="text-sm font-semibold text-blue-600 mb-2">
                        CONTROL DE VUELTOS
                      </h4>
                      {changePayments.map((item) => (
                        <div
                          key={item.payment_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-blue-600">
                            {item.payment_method}
                          </span>
                          <span className="font-medium text-blue-600">
                            S/ {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-blue-200 pt-1.5 flex items-center justify-between text-sm font-semibold text-blue-700">
                        <span>TOTAL VUELTOS</span>
                        <span>
                          S/ {formatCurrency(totalVueltos)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.documentNumber}</TableCell>
                        <TableCell>
                          S/ {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell>
                          S/ {formatCurrency(order.discount)}
                        </TableCell>
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
