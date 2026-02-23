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
import { ArrowUp, ChevronDown, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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

  const [pendingInvoiceType, setPendingInvoiceType] = useState<InvoiceType | null>(null);
  const [pendingEmitInvoice, setPendingEmitInvoice] = useState<Invoice | null>(null);
  const [emitting, setEmitting] = useState(false);

  const [pendingValidation, setPendingValidation] = useState<{
    vinculatedInvoiceId?: number;
    vinculatedTypeCode?: string;
  } | null>(null);

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
        .select("id, tax_serie, total_amount, client_name, customer_document_number, created_at, invoice_type_id, declared, invoice_number")
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

  const validateNonInvInvoice = async (
    selectedType: InvoiceType
  ): Promise<{ valid: boolean; error?: string; vinculatedInvoiceId?: number; vinculatedTypeCode?: string }> => {
    const existingTypeIds = invoices.map((i) => i.invoice_type_id).filter(Boolean);

    let existingCodes: { id: number; code: string }[] = [];
    if (existingTypeIds.length > 0) {
      const { data } = await supabase
        .from("types")
        .select("id, code")
        .in("id", existingTypeIds as number[]);
      existingCodes = data || [];
    }

    const existingCodeValues = existingCodes.map((t) => t.code);

    if (existingTypeIds.includes(selectedType.id)) {
      return { valid: false, error: "Ya existe un comprobante de este tipo vinculado a la orden." };
    }

    if (
      (selectedType.code === "1" || selectedType.code === "2") &&
      existingCodeValues.some((c) => c === "1" || c === "2")
    ) {
      return { valid: false, error: "Ya existe una Factura o Boleta vinculada a esta orden. No se puede crear otra." };
    }

    if (
      (selectedType.code === "3" || selectedType.code === "4") &&
      !existingCodeValues.some((c) => c === "1" || c === "2")
    ) {
      return { valid: false, error: "Debe existir una Factura o Boleta antes de crear este tipo de comprobante." };
    }

    const { data: payments } = await supabase
      .from("order_payment")
      .select("amount")
      .eq("order_id", orderId);

    const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    if (Math.round(totalPaid * 100) !== Math.round(orderTotal * 100)) {
      return { valid: false, error: "La suma de pagos no coincide con el total de la orden." };
    }

    let vinculatedInvoiceId: number | undefined;
    let vinculatedTypeCode: string | undefined;
    if (selectedType.code === "3" || selectedType.code === "4") {
      const parentCode = existingCodes.find((t) => t.code === "1" || t.code === "2");
      if (parentCode) {
        const parentInvoice = invoices.find((i) => i.invoice_type_id === parentCode.id);
        vinculatedInvoiceId = parentInvoice?.id;
        vinculatedTypeCode = parentCode.code;
      }
    }

    return { valid: true, vinculatedInvoiceId, vinculatedTypeCode };
  };

  const getSerieForType = async (
    typeCode: string,
    vinculatedTypeCode?: string
  ): Promise<string | null> => {
    if (typeCode === "INV") return null;

    try {
      const { data: saleType, error: stError } = await supabase
        .from("sale_types")
        .select("factura_serie_id, boleta_serie_id")
        .eq("id", saleTypeId)
        .single();

      if (stError || !saleType) return null;

      let serieId: number | null = null;

      if (typeCode === "1") {
        serieId = saleType.factura_serie_id;
      } else if (typeCode === "2") {
        serieId = saleType.boleta_serie_id;
      } else if (typeCode === "3" || typeCode === "4") {
        if (vinculatedTypeCode === "1") {
          serieId = saleType.factura_serie_id;
        } else if (vinculatedTypeCode === "2") {
          serieId = saleType.boleta_serie_id;
        }
      }

      if (!serieId) return null;

      const { data: serie, error: serieError } = await supabase
        .from("invoice_series")
        .select("serie")
        .eq("id", serieId)
        .single();

      if (serieError || !serie) return null;

      return serie.serie || null;
    } catch {
      return null;
    }
  };

  const handleSelectInvoiceType = async (invoiceType: InvoiceType) => {
    if (invoiceType.code === "INV") {
      setPendingInvoiceType(invoiceType);
      return;
    }

    const { data: lastSituation } = await supabase
      .from("order_situations")
      .select("status_id")
      .eq("order_id", orderId)
      .eq("last_row", true)
      .single();

    if (lastSituation) {
      const { data: status } = await supabase
        .from("statuses")
        .select("code")
        .eq("id", lastSituation.status_id)
        .single();

      if (!status || status.code !== "COM") {
        toast({ title: "No se puede crear", description: "La orden debe estar en estado Completado para crear este tipo de comprobante.", variant: "destructive" });
        return;
      }
    } else {
      toast({ title: "No se puede crear", description: "No se pudo verificar el estado de la orden.", variant: "destructive" });
      return;
    }

    const result = await validateNonInvInvoice(invoiceType);
    if (!result.valid) {
      toast({ title: "No se puede crear", description: result.error, variant: "destructive" });
      return;
    }

    setPendingInvoiceType(invoiceType);
    setPendingValidation(result);
  };

  const handleCreateInvoice = async (invoiceType: InvoiceType) => {
    setCreating(true);
    try {
      const isNonInv = invoiceType.code !== "INV";

      const taxSerie = await getSerieForType(
        invoiceType.code,
        isNonInv ? pendingValidation?.vinculatedTypeCode : undefined
      );

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        toast({ title: "Error", description: "No se pudo obtener la orden", variant: "destructive" });
        return;
      }

      const { data: orderProducts, error: productsError } = await supabase
        .from("order_products")
        .select("*")
        .eq("order_id", orderId);

      if (productsError || !orderProducts) {
        toast({ title: "Error", description: "No se pudieron obtener los productos", variant: "destructive" });
        return;
      }

      let customerDocumentEstateCode: string | null = null;
      if (isNonInv) {
        const { data: docType } = await supabase
          .from("document_types")
          .select("state_code")
          .eq("id", order.document_type)
          .single();
        customerDocumentEstateCode = docType?.state_code || null;
      }

      const totalAmount = Number(order.total);
      const totalTaxes = totalAmount - (totalAmount / 1.18);

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

      const clientName = [order.customer_name, order.customer_lastname].filter(Boolean).join(" ") || null;

      const body: Record<string, any> = {
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
      };

      if (isNonInv) {
        body.customer_document_estate_code = customerDocumentEstateCode;
        if (pendingValidation?.vinculatedInvoiceId) {
          body.vinculated_invoice_id = pendingValidation.vinculatedInvoiceId;
        }
      }

      const { error: fnError } = await supabase.functions.invoke("create-invoice", { body });

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

  const handleEmitInvoice = async (invoice: Invoice) => {
    setEmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-invoice", {
        body: { invoice_id: invoice.id },
      });

      if (error) {
        toast({ title: "Error", description: "Error al emitir el comprobante", variant: "destructive" });
        return;
      }

      if (data?.error) {
        toast({ title: "Error de emisión", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Éxito", description: "Comprobante emitido correctamente a SUNAT" });
      fetchInvoices();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error inesperado", variant: "destructive" });
    } finally {
      setEmitting(false);
      setPendingEmitInvoice(null);
    }
  };

  const getInvoiceTypeCode = (inv: Invoice): string | null => {
    const type = invoiceTypes.find((t) => t.id === inv.invoice_type_id);
    return type?.code || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
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
                    onClick={() => handleSelectInvoiceType(type)}
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>N. Comprobante</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, index) => {
                  const typeCode = getInvoiceTypeCode(inv);
                  const showActions = typeCode !== "INV" && typeCode !== null && !inv.declared;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{invoiceTypes.find(t => t.id === inv.invoice_type_id)?.name || "-"}</TableCell>
                      <TableCell>{inv.invoice_number || "-"}</TableCell>
                      <TableCell>{inv.tax_serie || "-"}</TableCell>
                      <TableCell>{inv.client_name || "-"}</TableCell>
                      <TableCell>S/ {inv.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(inv.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {showActions ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Emitir a SUNAT"
                              onClick={() => setPendingEmitInvoice(inv)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Ver comprobante"
                              onClick={() => {
                                window.open(`/invoices/edit/${inv.id}`, "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>

      {/* Confirm create invoice */}
      <AlertDialog open={!!pendingInvoiceType} onOpenChange={(alertOpen) => {
        if (!alertOpen) {
          setPendingInvoiceType(null);
          setPendingValidation(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar creación de comprobante</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de crear un(a) <strong>{pendingInvoiceType?.name}</strong> con la información actual de esta venta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={creating}
              onClick={() => {
                if (pendingInvoiceType) {
                  handleCreateInvoice(pendingInvoiceType).then(() => {
                    setPendingInvoiceType(null);
                    setPendingValidation(null);
                  });
                }
              }}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm emit invoice to SUNAT */}
      <AlertDialog open={!!pendingEmitInvoice} onOpenChange={(alertOpen) => {
        if (!alertOpen) {
          setPendingEmitInvoice(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar emisión a SUNAT</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de emitir este comprobante a la SUNAT? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={emitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={emitting}
              onClick={() => {
                if (pendingEmitInvoice) {
                  handleEmitInvoice(pendingEmitInvoice);
                }
              }}
            >
              {emitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Emitir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
