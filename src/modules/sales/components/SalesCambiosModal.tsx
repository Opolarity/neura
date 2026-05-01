import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight, CreditCard, Eye, Package } from "lucide-react";
import { SaleReturn } from "../types/Sales.types";
import { formatCurrency } from "../utils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface SalesCambiosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | null;
  returns: SaleReturn[];
}

export const SalesCambiosModal = ({
  open,
  onOpenChange,
  orderId,
  returns,
}: SalesCambiosModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Cambios
            {orderId && (
              <span className="text-muted-foreground font-normal text-sm">
                — Pedido #{orderId}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Cambios registrados para esta venta.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-2">
          <div className="space-y-4 py-2">
            {returns.map((ret) => (
              <div
                key={ret.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Header del cambio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">#{ret.id}</span>
                    <Badge variant="outline">{ret.return_type_name}</Badge>
                    <Badge variant="secondary">{ret.status_name}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {ret.situation_name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ret.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      title="Ver retorno"
                      onClick={() => navigate(`/returns/edit/${ret.id}`)}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {ret.reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{ret.reason}"
                  </p>
                )}

                {/* Productos */}
                {ret.products.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Package className="w-3 h-3" />
                      Productos
                    </div>
                    {ret.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between text-sm px-2 py-1 bg-muted/40 rounded"
                      >
                        <span className="truncate">
                          {p.product_name}
                          {p.variation_terms.length > 0 &&
                            ` — ${p.variation_terms.join(" / ")}`}
                          <span className="text-muted-foreground text-xs ml-1">
                            ({p.sku})
                          </span>
                        </span>
                        <span className="shrink-0 ml-2 font-medium">
                          x{p.return_quantity} · {formatCurrency(p.product_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagos */}
                {ret.payments.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <CreditCard className="w-3 h-3" />
                      Pagos
                    </div>
                    {ret.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between text-sm px-2 py-1 bg-muted/40 rounded"
                      >
                        <span>{p.payment_method_name}</span>
                        <span className="font-medium">
                          {formatCurrency(Math.abs(p.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm font-semibold">
                  <span>Total reembolsado</span>
                  <span className="text-primary">
                    {formatCurrency(ret.total_refund_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
