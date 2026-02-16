import { useState } from "react";
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
import { getPOSSessionDetail } from "../services/POSDetail.service";
import { adaptPOSSessionDetail } from "../adapters/POSDetail.adapter";
import type { POSSessionDetail, POSSessionOrder } from "../types/POSDetail.types";

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
  const [loading, setLoading] = useState(false);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const response = await getPOSSessionDetail(id);
      const adapted = adaptPOSSessionDetail(response);
      setSession(adapted.session);
      setOrders(adapted.orders);
    } catch (err) {
      console.error("Error loading session detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && sessionId) {
      loadDetail(sessionId);
    }
    if (!isOpen) {
      setSession(null);
      setOrders([]);
    }
    onOpenChange(isOpen);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
