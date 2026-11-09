import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * El PDF en un modal: «Generando PDF...» mientras se arma y después el PDF,
 * con Descargar y Abrir en otra pestaña. Se abre en seguida y el PDF se arma
 * con esta pestaña a la vista: en segundo plano el navegador frena los cuadros
 * con que se arma la hoja (tardaba casi un minuto). Abrirlo en otra pestaña
 * queda para un clic: pasado el tiempo, el navegador bloquearía la ventana
 * que se abre sola.
 */
export function PdfPreviewDialog({
  title,
  url,
  open,
  fileName,
  progress,
  onClose,
}: {
  title: string;
  /** El PDF listo; null mientras se genera. */
  url: string | null;
  open: boolean;
  /** El nombre al descargarlo, sin «.pdf». */
  fileName: string;
  /** Mientras se genera una lista de registros: «12 de 40». */
  progress?: string | null;
  /** Al cerrarlo (también mientras se genera). */
  onClose: () => void;
}) {
  const download = () => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.pdf`;
    link.click();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {url ? (
          <iframe
            title={title}
            src={url}
            className="h-[70vh] w-full rounded-md border border-border"
          />
        ) : (
          <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Generando PDF...
            {progress && <span className="text-xs">{progress}</span>}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={download}
            disabled={!url}
          >
            <Download className="h-4 w-4" />
            Descargar
          </Button>
          <Button
            className="gap-2"
            onClick={() => url && window.open(url, "_blank")}
            disabled={!url}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir en otra pestaña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
