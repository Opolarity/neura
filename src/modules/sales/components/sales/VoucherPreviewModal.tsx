import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

interface VoucherPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucherSrc: string;
  voucherName?: string;
}

export const VoucherPreviewModal = ({
  open,
  onOpenChange,
  voucherSrc,
  voucherName = 'comprobante',
}: VoucherPreviewModalProps) => {
  if (!voucherSrc) return null;

  // Detect if it's a PDF
  const isPdf = voucherSrc.includes('application/pdf') || 
                voucherSrc.toLowerCase().endsWith('.pdf');

  // Detect if it's a base64 string or URL
  const isBase64 = voucherSrc.startsWith('data:');

  const handleDownload = () => {
    if (isBase64) {
      // For base64 data, create a blob and download
      const link = document.createElement('a');
      link.href = voucherSrc;
      link.download = `${voucherName}.${isPdf ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For URLs, open in new tab
      window.open(voucherSrc, '_blank');
    }
  };

  const handleOpenExternal = () => {
    window.open(voucherSrc, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Vista previa del comprobante</DialogTitle>
            <div className="flex items-center gap-2">
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
              src={voucherSrc}
              type="application/pdf"
              className="w-full h-[60vh] rounded-md"
            />
          ) : (
            <img
              src={voucherSrc}
              alt="Comprobante"
              className="max-w-full max-h-[60vh] object-contain rounded-md shadow-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
