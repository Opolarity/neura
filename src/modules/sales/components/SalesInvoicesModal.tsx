import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Invoice {
  id: number;
  tax_serie: string | null;
  total_amount: number;
  client_name: string | null;
  customer_document_number: string;
  created_at: string;
  invoice_type_name?: string;
}

interface SalesInvoicesModalProps {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SalesInvoicesModal = ({
  orderId,
  open,
  onOpenChange,
}: SalesInvoicesModalProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      fetchInvoices();
    }
  }, [open, orderId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_invoices")
        .select("invoice_id")
        .eq("order_id", orderId);

      if (error || !data || data.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      const invoiceIds = data.map((oi) => oi.invoice_id);

      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, tax_serie, total_amount, client_name, customer_document_number, created_at, invoice_type_id")
        .in("id", invoiceIds);

      if (invoicesError || !invoicesData) {
        setInvoices([]);
      } else {
        setInvoices(invoicesData);
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Comprobantes vinculados</DialogTitle>
          <DialogDescription>
            Comprobantes asociados a esta orden.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay comprobantes vinculados a esta orden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Cliente</TableHead>
                  
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, index) => (
                  <TableRow key={inv.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{inv.tax_serie || "-"}</TableCell>
                    <TableCell>{inv.client_name || "-"}</TableCell>
                    
                    <TableCell>S/ {inv.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(inv.created_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
