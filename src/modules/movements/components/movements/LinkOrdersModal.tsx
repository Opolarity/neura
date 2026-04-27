import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { getListOrdersApi } from "@/modules/invoices/services/Invoices.services";
import Pagination, { PaginationState } from "@/shared/components/pagination/Pagination";

export interface OrderSummary {
  id: number;
  customer_name: string;
  total: number;
  date: string;
}

interface LinkOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: OrderSummary[];
  onConfirm: (orders: OrderSummary[]) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);

export function LinkOrdersModal({ open, onOpenChange, selectedOrders, onConfirm }: LinkOrdersModalProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [localSelected, setLocalSelected] = useState<OrderSummary[]>([]);

  const fetchOrders = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const response = await getListOrdersApi({
        page,
        size: 20,
        search: searchTerm || undefined,
      });

      const rawData = Array.isArray(response) ? response : (response?.data || []);
      const uniqueMap = new Map();
      rawData.forEach((item: any) => {
        if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
      });
      const dataItems = Array.from(uniqueMap.values());
      const total =
        response?.page?.total ??
        response?.metadata?.total_rows ??
        response?.total_rows ??
        response?.total ??
        dataItems.length;

      setItems(dataItems);
      setPagination((prev) => ({ ...prev, p_page: page, total }));
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedOrders);
      fetchOrders(1, "");
    } else {
      setSearch("");
      setItems([]);
      setPagination({ p_page: 1, p_size: 20, total: 0 });
    }
  }, [open]);

  const isChecked = (id: number) => localSelected.some((o) => o.id === id);

  const toggleOrder = (item: any) => {
    const order: OrderSummary = {
      id: item.id,
      customer_name: item.customer_name || item.customer_document_number || `Pedido #${item.id}`,
      total: item.total || 0,
      date: item.date || "",
    };
    setLocalSelected((prev) =>
      isChecked(item.id) ? prev.filter((o) => o.id !== item.id) : [...prev, order]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nro pedido o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders(1, search)}
            />
            <Button onClick={() => fetchOrders(1, search)} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

          {localSelected.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {localSelected.length} venta{localSelected.length !== 1 ? "s" : ""} seleccionada{localSelected.length !== 1 ? "s" : ""}
            </p>
          )}

          <div className="border rounded-md overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>ID Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron resultados
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => toggleOrder(item)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isChecked(item.id)}
                            onCheckedChange={() => toggleOrder(item)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">#{item.id}</TableCell>
                        <TableCell>{item.customer_name || item.customer_document_number || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total || 0)}
                        </TableCell>
                        <TableCell>
                          {item.date ? new Date(item.date).toLocaleDateString() : "-"}
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
              onPageChange={(page) => fetchOrders(page, search)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar selección
            {localSelected.length > 0 && ` (${localSelected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
