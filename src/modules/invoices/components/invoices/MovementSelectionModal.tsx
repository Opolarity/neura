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
import { Loader2, Search, AlertCircle, ShoppingCart } from "lucide-react";
import { getListMovementsApi, getMovementInvoices, getMovementOrderLink } from "@/modules/invoices/services/Invoices.services";
import Pagination, { PaginationState } from "@/shared/components/pagination/Pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MovementSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (movementId: number) => void;
  currentInvoiceId?: number;
}

const MovementSelectionModal = ({ isOpen, onClose, onSelect, currentInvoiceId }: MovementSelectionModalProps) => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);
  const [checkingInvoices, setCheckingInvoices] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showOrderWarning, setShowOrderWarning] = useState(false);
  const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);

  const fetchMovements = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const response = await getListMovementsApi({
        page,
        size: pagination.p_size,
        search: searchTerm || undefined,
      });

      // sp_get_movements returns { movements: { data: [], page: { total: ... } } }
      const rawData = response?.movements?.data || [];
      const total = response?.movements?.page?.total ?? rawData.length;

      setItems(rawData);
      setPagination(prev => ({ ...prev, p_page: page, total }));
    } catch (error) {
      console.error("Error searching movements:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.p_size]);

  const handleSearch = () => {
    fetchMovements(1, search);
  };

  const handlePageChange = (page: number) => {
    fetchMovements(page, search);
  };

  const checkMovementInvoices = async (movement: any) => {
    setSelectedMovement(movement);
    setCheckingInvoices(true);
    try {
      // 1. Check if linked to an order
      const orderLink = await getMovementOrderLink(movement.id);
      if (orderLink?.order_id) {
        setLinkedOrderId(orderLink.order_id);
        setShowOrderWarning(true);
        return;
      }

      // 2. Check if linked to an invoice
      const invoices = await getMovementInvoices(movement.id);
      
      // Filter out the current invoice if we're editing it
      const otherInvoices = currentInvoiceId 
        ? invoices.filter((i: any) => i.invoice_id !== currentInvoiceId)
        : invoices;

      setExistingInvoices(otherInvoices);

      if (otherInvoices.length > 0) {
        setShowWarning(true);
      } else {
        onSelect(movement.id);
        onClose();
      }
    } catch (error) {
      console.error("Error checking invoices:", error);
    } finally {
      setCheckingInvoices(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedMovement) {
      onSelect(selectedMovement.id);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMovements(1, "");
    } else {
      setSearch("");
      setItems([]);
      setSelectedMovement(null);
      setShowWarning(false);
      setShowOrderWarning(false);
      setLinkedOrderId(null);
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
          <DialogTitle>Seleccionar Movimiento para Facturar</DialogTitle>
        </DialogHeader>

        {showOrderWarning ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <ShoppingCart className="h-4 w-4" />
              <AlertTitle>Movimiento vinculado a pedido</AlertTitle>
              <AlertDescription>
                Este movimiento (#{selectedMovement?.id}) pertenece al **Pedido #{linkedOrderId}**.
                <p className="mt-2">
                  No se puede vincular manualmente un movimiento que pertenece a un pedido. 
                  Para facturar este movimiento, debes vincular directamente el Pedido #{linkedOrderId} 
                  al comprobante.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowOrderWarning(false)}>
                Volver
              </Button>
            </div>
          </div>
        ) : !showWarning ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por descripción, método pago..."
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
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo/Clase</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
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
                          <TableCell>{item.movement_date ? new Date(item.movement_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={item.description}>
                            {item.description || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium">{item.type}</span>
                              <span className="text-muted-foreground">{item.class}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.amount || 0)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => checkMovementInvoices(item)}
                              disabled={checkingInvoices && selectedMovement?.id === item.id}
                            >
                              {checkingInvoices && selectedMovement?.id === item.id ? (
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Movimiento ya vinculado</AlertTitle>
              <AlertDescription>
                Este movimiento (#{selectedMovement?.id}) ya cuenta con los siguientes comprobantes asignados:
                <ul className="mt-2 list-disc list-inside">
                  {existingInvoices.map((ei, idx) => (
                    <li key={idx}>
                      {ei.invoices?.invoices_types?.name || "Comprobante"}: {ei.invoices?.invoice_number || "(Sin número)"}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-medium">
                  No se permite vincular el mismo movimiento a más de un comprobante.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowWarning(false)}>
                Volver
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showWarning && !showOrderWarning && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MovementSelectionModal;
