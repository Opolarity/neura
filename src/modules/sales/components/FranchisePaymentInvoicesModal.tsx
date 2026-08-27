import { useEffect, useState } from "react";
import { ChevronDown, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateDisplay } from "@/shared/utils/date";
import { useToast } from "@/hooks/use-toast";
import type { PendingPaymentRow } from "../services/PendingPayments.service";

interface InvoiceType {
  id: number;
  name: string;
  code: string;
}

interface Invoice {
  id: number;
  tax_serie: string | null;
  total_amount: number;
  client_name: string | null;
  customer_document_number: string;
  created_at: string;
  invoice_type_id?: number;
  declared: boolean;
  invoice_number: string | null;
}

// Tipos que se pueden crear desde el pago: NC/ND requieren padre declarado y la
// guía tiene su propio flujo GRE, por eso quedan fuera de esta vía.
const CREATABLE_TYPE_CODES = ["1", "2", "INV"];

interface FranchisePaymentInvoicesModalProps {
  payment: PendingPaymentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FranchisePaymentInvoicesModal = ({
  payment,
  open,
  onOpenChange,
}: FranchisePaymentInvoicesModalProps) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(false);

  const orderIds = [
    ...new Set(payment.orderProducts.map((p) => p.company_order_id).filter(Boolean)),
  ];

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      if (orderIds.length === 0) {
        setInvoices([]);
        return;
      }

      const { data, error } = await supabase
        .from("order_invoices")
        .select("invoice_id")
        .in("order_id", orderIds);

      if (error || !data || data.length === 0) {
        setInvoices([]);
        return;
      }

      // 1 comprobante puede estar vinculado a N ordenes del pago: dedupe
      const invoiceIds = [...new Set(data.map((oi) => oi.invoice_id))];

      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, tax_serie, total_amount, client_name, customer_document_number, created_at, invoice_type_id, declared, invoice_number")
        .in("id", invoiceIds)
        .order("id");

      setInvoices(invoicesError || !invoicesData ? [] : invoicesData);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceTypes = async () => {
    try {
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "INV")
        .single();

      if (!modules) return;

      const { data, error } = await supabase
        .from("types")
        .select("id, name, code")
        .eq("module_id", modules.id)
        .order("id");

      if (!error && data) {
        setInvoiceTypes(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) {
      fetchInvoices();
      fetchInvoiceTypes();
    }
  }, [open, payment.id]);

  const handleSelectType = async (type: InvoiceType) => {
    const legalTypeIds = invoiceTypes
      .filter((t) => t.code === "1" || t.code === "2")
      .map((t) => t.id);
    const hasLegalInvoice = invoices.some(
      (inv) => inv.invoice_type_id && legalTypeIds.includes(inv.invoice_type_id)
    );

    if (hasLegalInvoice) {
      toast({
        title: "Ya existe una Factura o Boleta para las órdenes de este pago",
        description: "No se permite crear otro comprobante legal por esta vía.",
        variant: "destructive",
      });
      return;
    }

    if (type.code === "1") {
      const { data: order } = await supabase
        .from("orders")
        .select("document_type")
        .eq("id", orderIds[0])
        .maybeSingle();

      if (order?.document_type) {
        const { data: docType } = await supabase
          .from("document_types")
          .select("code")
          .eq("id", order.document_type)
          .maybeSingle();

        if (!docType || docType.code !== "RUC") {
          toast({
            title: "El cliente no tiene RUC",
            description: "Podrás corregir el documento en el formulario del comprobante.",
            variant: "warning",
          });
        }
      }
    }

    window.open(`/invoices/add?paymentId=${payment.id}&typeId=${type.id}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[780px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Comprobantes del pago {payment.movementCode}</DialogTitle>
              <DialogDescription>
                Comprobantes asociados a los {orderIds.length} pedidos de este pago.
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={orderIds.length === 0}>
                  Crear
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {invoiceTypes
                  .filter((type) => CREATABLE_TYPE_CODES.includes(type.code))
                  .map((type) => (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                    >
                      {type.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay comprobantes vinculados a los pedidos de este pago.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>N. Comprobante</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, index) => (
                  <TableRow key={inv.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {invoiceTypes.find((t) => t.id === inv.invoice_type_id)?.name || "-"}
                    </TableCell>
                    <TableCell>{inv.invoice_number || "-"}</TableCell>
                    <TableCell>{inv.tax_serie || "-"}</TableCell>
                    <TableCell>S/ {inv.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{formatDateDisplay(inv.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Ver comprobante"
                        onClick={() => window.open(`/invoices/edit/${inv.id}`, "_blank")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
