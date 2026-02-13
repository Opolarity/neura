import { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateDisplay } from "@/shared/utils/date";
import type { Medio } from "../types/medios.types";

interface MediaDetailDialogProps {
  medio: Medio | null;
  open: boolean;
  onClose: () => void;
  onDelete: (medio: Medio) => void;
}

const MediaDetailDialog = ({ medio, open, onClose, onDelete }: MediaDetailDialogProps) => {
  const [copied, setCopied] = useState(false);

  if (!medio) return null;

  const isVideo = medio.mimetype?.startsWith("video/");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(medio.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(medio);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{medio.name}</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center max-h-[400px]">
          {isVideo ? (
            <video
              src={medio.url}
              controls
              className="max-h-[400px] w-full object-contain"
            />
          ) : (
            <img
              src={medio.url}
              alt={medio.name}
              className="max-h-[400px] w-full object-contain"
            />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              URL del medio
            </label>
            <div className="flex gap-2">
              <Input value={medio.url} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span>Tipo: {medio.mimetype ?? "Desconocido"}</span>
              <span>Fecha: {formatDateDisplay(medio.created_at)}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaDetailDialog;
