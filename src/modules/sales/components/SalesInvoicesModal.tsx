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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: number;
  tax_serie: string | null;
  total_amount: number;
  client_name: string | null;
  customer_document_number: string;
  created_at: string;
  invoice_type_id?: number;
}

interface InvoiceType {
  id: number;
  name: string;
  code: string;
}

interface SalesInvoicesModalProps {
  orderId: number;
  orderTotal: number;
  saleTypeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SalesInvoicesModal = ({
  orderId,
  orderTotal,
  saleTypeId,
  open,
  onOpenChange,
}: SalesInvoicesModalProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      fetchInvoices();
      checkPaymentStatus();
      fetchInvoiceTypes();
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

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("order_payment")
        .select("amount")
        .eq("order_id", orderId);

      if (error || !data) {
        setIsFullyPaid(false);
        return;
      }

      const totalPaid = data.reduce((sum, p) => sum + Number(p.amount), 0);
      // Exactly equal (using rounding to avoid floating point issues)
      setIsFullyPaid(Math.round(totalPaid * 100) === Math.round(orderTotal * 100));
    } catch {
      setIsFullyPaid(false);
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

  const getSerieForType = async (typeCode: string): Promise<string | null> => {
    // For "INV" type (generic comprobante), always null
    if (typeCode === "INV") return null;

    // Notes (credit/debit) - skip series for now
    if (typeCode === "3" || typeCode === "4") return null;

    try {
      // 1. Find invoice_series via sale_type_invoice_series
      const { data: stis, error: stisError } = await (supabase as any)
        .from("sale_type_invoice_series")
        .select("tax_serie_id")
        .eq("sale_type_id", saleTypeId);

      if (stisError || !stis || stis.length === 0) return null;

      const serieId = (stis[0] as any).tax_serie_id;

      // 2. Get the invoice_series record
      const { data: serie, error: serieError } = await supabase
        .from("invoice_series")
        .select("*")
        .eq("id", serieId)
        .single();

      if (serieError || !serie) return null;

      // 3. Use the serie column directly
      const seriePrefix = serie.serie || null;

      return seriePrefix;
    } catch {
      return null;
    }
  };

  const handleCreateInvoice = async (invoiceType: InvoiceType) => {
    setCreating(true);
    try {
      // 1. Get tax_serie
      const taxSerie = await getSerieForType(invoiceType.code);

      // 2. Fetch order data
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        toast({ title: "Error", description: "No se pudo obtener la orden", variant: "destructive" });
        return;
      }

      // 3. Fetch order products
      const { data: orderProducts, error: productsError } = await supabase
        .from("order_products")
        .select("*")
        .eq("order_id", orderId);

      if (productsError || !orderProducts) {
        toast({ title: "Error", description: "No se pudieron obtener los productos", variant: "destructive" });
        return;
      }

      // 4. Calculate totals
      const totalAmount = Number(order.total);
      const totalTaxes = totalAmount - (totalAmount / 1.18);

      // 5. Build items from order products
      const items = orderProducts.map((op) => {
        const lineTotal = (Number(op.product_price) * Number(op.quantity)) - Number(op.product_discount || 0);
        const igv = lineTotal - (lineTotal / 1.18);
        return {
          description: op.product_name || `Producto ${op.product_variation_id}`,
          quantity: Number(op.quantity),
          measurement_unit: "NIU",
          unit_price: Number(op.product_price),
          discount: Number(op.product_discount || 0),
          igv: Math.round(igv * 100) / 100,
          total: Math.round(lineTotal * 100) / 100,
        };
      });

      // 6. Build client name
      const clientName = [order.customer_name, order.customer_lastname].filter(Boolean).join(" ") || null;

      // 7. Call edge function
      const { data: result, error: fnError } = await supabase.functions.invoke("create-invoice", {
        body: {
          invoice_type_id: invoiceType.id,
          tax_serie: taxSerie,
          invoice_number: null,
          declared: false,
          customer_document_type_id: order.document_type,
          customer_document_number: order.document_number,
          client_name: clientName,
          total_amount: totalAmount,
          total_taxes: Math.round(totalTaxes * 100) / 100,
          items,
          order_id: orderId,
        },
      });

      if (fnError) {
        toast({ title: "Error", description: "Error al crear el comprobante", variant: "destructive" });
        return;
      }

      toast({ title: "Éxito", description: `${invoiceType.name} creado correctamente` });
      fetchInvoices();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error inesperado", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Comprobantes vinculados</DialogTitle>
              <DialogDescription>
                Comprobantes asociados a esta orden.
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={!isFullyPaid || creating}
                  title={!isFullyPaid ? "La orden debe estar cancelada al 100%" : ""}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Crear
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {invoiceTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    onClick={() => handleCreateInvoice(type)}
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
