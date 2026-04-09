import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { getOrderInvoices, getListOrdersApi } from "@/modules/invoices/services/Invoices.services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Pagination, { PaginationState } from "@/shared/components/pagination/Pagination";

interface OrderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (orderId: number) => void;
  mode?: "create" | "link";
}

const OrderSelectionModal = ({ isOpen, onClose, onSelect, mode = "create" }: OrderSelectionModalProps) => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [checkingInvoices, setCheckingInvoices] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  const fetchOrders = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const response = await getListOrdersApi({
        page,
        size: pagination.p_size,
        search: searchTerm || undefined,
      });

      // Handle the different response structures and filter duplicates
      const rawData = Array.isArray(response) ? response : (response?.data || []);

      // Use a Map to ensure unique IDs
      const uniqueItemsMap = new Map();
      rawData.forEach((item: any) => {
        if (!uniqueItemsMap.has(item.id)) {
          uniqueItemsMap.set(item.id, item);
        }
      });
      const dataItems = Array.from(uniqueItemsMap.values());

      const total = response?.page?.total ?? response?.metadata?.total_rows ?? response?.total_rows ?? response?.total ?? dataItems.length;

      setItems(dataItems);
      setPagination(prev => ({ ...prev, p_page: page, total }));
    } catch (error) {
      console.error("Error searching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.p_size]);

  const handleSearch = () => {
    fetchOrders(1, search);
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, search);
  };

  const checkOrderInvoices = async (order: any) => {
    setSelectedOrder(order);
    setCheckingInvoices(true);
    try {
      const invoices = await getOrderInvoices(order.id);
      setExistingInvoices(invoices);

      if (invoices.length > 0) {
        setShowWarning(true);
      } else {
        onSelect(order.id);
        onClose();
      }
    } catch (error) {
      console.error("Error checking invoices:", error);
    } finally {
      setCheckingInvoices(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedOrder) {
      onSelect(selectedOrder.id);
      onClose();
    }
  };

  // Initial load and reset
  useEffect(() => {
    if (isOpen) {
      fetchOrders(1, "");
    } else {
      setSearch("");
      setItems([]);
      setSelectedOrder(null);
      setShowWarning(false);
      setExistingInvoices([]);
      setPagination({ p_page: 1, p_size: 20, total: 0 });
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Pedido para Facturar</DialogTitle>
        </DialogHeader>

        {!showWarning ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nro pedido o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Venta</TableHead>
                      <TableHead>N° Documento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron resultados
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground text-sm">#{item.id}</TableCell>
                          <TableCell className="font-medium">{item.document_number || `Pedido #${item.id}`}</TableCell>
                          <TableCell>{item.customer_name || item.customer_document_number || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total || 0)}</TableCell>
                          <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => checkOrderInvoices(item)}
                              disabled={checkingInvoices && selectedOrder?.id === item.id}
                            >
                              {checkingInvoices && selectedOrder?.id === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Seleccionar"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex justify-center py-2">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {(() => {
              const hasLegalInvoice = existingInvoices.some(ei => {
                const t = ei.invoices?.invoices_types;
                const code = String(t?.code || "").trim();
                const name = String(t?.name || "").toLowerCase().trim();
                // Bloquear si es Factura (1) o Boleta (2)
                return code === "1" || code === "2" || name.includes("boleta") || name.includes("factura");
              });
              const isBlockMode = hasLegalInvoice && mode === "create";

              return (
                <>
                  <Alert variant={isBlockMode ? "destructive" : "default"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {isBlockMode ? "Bloqueo Legal" : "Atención"}
                    </AlertTitle>
                    <AlertDescription>
                      {isBlockMode
                        ? "Este pedido ya cuenta con un comprobante legal (Boleta o Factura). Por normatividad, no se permite crear otro comprobante legal."
                        : `Este pedido (#${selectedOrder?.id}) ya tiene los siguientes comprobantes asignados:`}
                      
                      <ul className="mt-2 list-disc list-inside">
                        {existingInvoices.map((ei, idx) => (
                          <li key={idx}>
                            {ei.invoices?.invoices_types?.name || "Comprobante"}: {ei.invoices?.invoice_number || "(Sin número)"}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm font-medium">
                    {isBlockMode
                      ? "Para continuar, debe anular el comprobante previo o vincular este pedido a una factura existente manualmente."
                      : "¿Deseas continuar y vincular este pedido?"}
                  </p>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setShowWarning(false)}>
                      Volver
                    </Button>
                    {!isBlockMode ? (
                      <Button onClick={handleConfirmSelection}>
                        Sí, Continuar
                      </Button>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <DialogFooter>
          {!showWarning && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderSelectionModal;
