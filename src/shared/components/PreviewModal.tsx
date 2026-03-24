import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface PreviewModalProps {
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  name?: string;
}

const PreviewModalBase = ({
  title = 'Vista previa',
  open,
  onOpenChange,
  src,
  name = 'archivo',
}: PreviewModalProps) => {
  const isPdf =
    src.includes('application/pdf') || src.toLowerCase().endsWith('.pdf');
  const isBase64 = src.startsWith('data:');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${name}.${isPdf ? 'pdf' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(src, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
              {!isBase64 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenExternal}
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
          {isPdf ? (
            <embed
              src={src}
              type="application/pdf"
              className="w-full h-[60vh] rounded-md"
            />
          ) : (
            <img
              src={src}
              alt={name}
              className="max-w-full max-h-[60vh] object-contain rounded-md shadow-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const PreviewModal = memo(PreviewModalBase);
