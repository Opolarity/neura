import { useState, useEffect, useCallback } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "../utils";

interface InvoiceType {
  id: number;
  name: string;
  code: string;
}

interface OrderInvoice {
  id: number;
  invoiceId: number;
  serie: string | null;
  totalAmount: number;
  createdAt: string;
  typeName: string;
  declared: boolean;
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
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_invoices")
        .select(`
          id,
          invoice_id,
          invoices (
            id,
            serie,
            total_amount,
            created_at,
            declared,
            invoice_type_id,
            customer_document_number
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;

      // Get type names for each invoice
      const invoiceTypeIds = [
        ...new Set(
          (data || [])
            .map((d: any) => d.invoices?.invoice_type_id)
            .filter(Boolean)
        ),
      ];

      let typeMap: Record<number, string> = {};
      if (invoiceTypeIds.length > 0) {
        const { data: types } = await supabase
          .from("types")
          .select("id, name")
          .in("id", invoiceTypeIds);
        typeMap = (types || []).reduce(
          (acc: Record<number, string>, t: any) => {
            acc[t.id] = t.name;
            return acc;
          },
          {}
        );
      }

      const mapped: OrderInvoice[] = (data || []).map((d: any) => ({
        id: d.id,
        invoiceId: d.invoices?.id || d.invoice_id,
        serie: d.invoices?.serie || null,
        totalAmount: d.invoices?.total_amount || 0,
        createdAt: d.invoices?.created_at || "",
        typeName: typeMap[d.invoices?.invoice_type_id] || "-",
        declared: d.invoices?.declared || false,
      }));

      setInvoices(mapped);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchInvoiceTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("types")
        .select("id, name, code")
        .eq(
          "module_id",
          (
            await supabase
              .from("modules")
              .select("id")
              .eq("code", "INV")
              .single()
          ).data?.id || 0
        );

      if (error) throw error;
      setInvoiceTypes((data || []) as InvoiceType[]);
    } catch (err) {
      console.error("Error fetching invoice types:", err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchInvoices();
      fetchInvoiceTypes();
    }
  }, [open, fetchInvoices, fetchInvoiceTypes]);

  const handleCreateInvoice = async (invoiceType: InvoiceType) => {
    setCreating(true);
    try {
      // Fetch order data
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, order_products(*)")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw orderError || new Error("Orden no encontrada");

      // Build invoice items from order products
      const items = (order.order_products || []).map((op: any) => {
        const subtotal = op.quantity * op.product_price;
        const discount = op.product_discount || 0;
        const base = subtotal - discount;
        const igv = parseFloat((base * 0.18).toFixed(2));
        const total = parseFloat((base + igv).toFixed(2));

        return {
          description: op.product_name || `Producto ${op.product_variation_id}`,
          quantity: op.quantity,
          measurement_unit: "NIU",
          unit_price: op.product_price,
          discount: discount,
          igv: igv,
          total: total,
        };
      });

      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.total,
        0
      );

      // Create invoice via edge function
      const { data, error } = await supabase.functions.invoke(
        "create-invoice",
        {
          body: {
            invoice_type_id: invoiceType.id,
            account_id: null,
            total_amount: parseFloat(totalAmount.toFixed(2)),
            customer_document_number: order.document_number,
            customer_document_type_id: order.document_type,
            items,
          },
        }
      );

      if (error) throw error;

      // Link invoice to order
      const invoiceId = data?.invoice?.id;
      if (invoiceId) {
        const { error: linkError } = await supabase
          .from("order_invoices")
          .insert({ order_id: orderId, invoice_id: invoiceId });

        if (linkError) throw linkError;
      }

      toast({
        title: "Comprobante creado",
        description: `${invoiceType.name} creado exitosamente`,
      });

      fetchInvoices();
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      toast({
        title: "Error",
        description: err?.message || "No se pudo crear el comprobante",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Comprobantes de la venta</DialogTitle>
          <DialogDescription>
            Comprobantes vinculados a esta orden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Nuevo comprobante
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

        <div className="py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay comprobantes vinculados a esta orden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Declarado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, index) => (
                  <TableRow key={inv.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{inv.typeName}</TableCell>
                    <TableCell>{inv.serie || "-"}</TableCell>
                    <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell>{inv.declared ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      {inv.createdAt
                        ? format(new Date(inv.createdAt), "dd/MM/yyyy")
                        : "-"}
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
