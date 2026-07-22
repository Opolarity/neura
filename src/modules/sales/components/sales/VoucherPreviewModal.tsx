import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/utils";

interface VoucherPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Acepta una sola URL (retrocompat) o varias (hasta 3)
  voucherSrc: string | string[];
  voucherName?: string;
  completed?: boolean;
  paymentId?: string | null;
  onConfirmPayment?: (paymentId: string) => Promise<void>;
}

export const VoucherPreviewModal = ({
  open,
  onOpenChange,
  voucherSrc,
  voucherName = "comprobante",
  completed = false,
  paymentId,
  onConfirmPayment,
}: VoucherPreviewModalProps) => {
  const sources = (Array.isArray(voucherSrc) ? voucherSrc : [voucherSrc]).filter(
    Boolean,
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);

  // Reinicia el índice al abrir o cambiar las fuentes
  useEffect(() => {
    setActiveIndex(0);
  }, [open, voucherSrc]);

  if (sources.length === 0) return null;

  const active = sources[Math.min(activeIndex, sources.length - 1)];

  const isPdf =
    active.includes("application/pdf") || active.toLowerCase().endsWith(".pdf");
  const isBase64 = active.startsWith("data:");

  const handleDownload = () => {
    if (isBase64) {
      const link = document.createElement("a");
      link.href = active;
      link.download = `${voucherName}.${isPdf ? "pdf" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(active, "_blank");
    }
  };

  const handleOpenExternal = () => {
    window.open(active, "_blank");
  };

  const handleConfirmPayment = async () => {
    if (!paymentId || confirming || completed) return;
    setConfirming(true);
    try {
      await onConfirmPayment?.(paymentId);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              Vista previa del comprobante
              {sources.length > 1
                ? ` (${activeIndex + 1}/${sources.length})`
                : ""}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenExternal}
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
          {isPdf ? (
            <embed
              src={active}
              type="application/pdf"
              className="w-full h-[60vh] rounded-md"
            />
          ) : (
            <img
              src={active}
              alt="Comprobante"
              className="max-w-full max-h-[60vh] object-contain rounded-md shadow-md"
            />
          )}
        </div>

        {sources.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center flex-shrink-0 pt-2">
            {sources.map((src, idx) => {
              const thumbIsPdf =
                src.includes("application/pdf") ||
                src.toLowerCase().endsWith(".pdf");
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "h-14 w-14 rounded-md overflow-hidden border-2 flex items-center justify-center bg-muted/40",
                    idx === activeIndex
                      ? "border-primary"
                      : "border-transparent",
                  )}
                  title={`Comprobante ${idx + 1}`}
                >
                  {thumbIsPdf ? (
                    <span className="text-[10px] font-medium">PDF</span>
                  ) : (
                    <img
                      src={src}
                      alt={`Comprobante ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          {!completed && (
            <Button
              size="sm"
              onClick={handleConfirmPayment}
              disabled={confirming || !paymentId}
            >
              <CheckCircle className="h-4 w-4" />
              {confirming ? "Guardando..." : "Confirmar pago"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
