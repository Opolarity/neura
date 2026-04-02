import { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsExportModal } from './ProductsExportModal';

export function ProductsOptionsPanel() {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          Más opciones
          <span className="text-primary font-semibold">+</span>
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex items-end gap-3 px-4 pb-4 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="h-9 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar reporte
          </Button>
        </div>
      )}

      <ProductsExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
