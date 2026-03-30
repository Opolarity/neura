import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface MovementFilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

export const MovementFilePreviewModal = ({
  open,
  onOpenChange,
  file,
}: MovementFilePreviewModalProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !objectUrl) return null;

  const isPdf = file.type === "application/pdf";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(objectUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{file.name}</DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={handleDownload} title="Descargar">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleOpenExternal} title="Abrir en nueva pestaña">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
          {isPdf ? (
            <embed
              src={objectUrl}
              type="application/pdf"
              className="w-full h-[60vh] rounded-md"
            />
          ) : (
            <img
              src={objectUrl}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain rounded-md shadow-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
