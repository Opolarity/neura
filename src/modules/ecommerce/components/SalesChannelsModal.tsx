import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getChannelsApi } from "@/modules/products/services/products.service";
import { Loader2 } from "lucide-react";

interface SalesChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (channelIds: number[]) => Promise<void>;
}

const SalesChannelsModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: SalesChannelsModalProps) => {
  const [channels, setChannels] = useState<{ id: number; name: string; code: string }[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingChannels(true);
    getChannelsApi()
      .then(setChannels)
      .finally(() => setLoadingChannels(false));
  }, [isOpen]);

  const toggleChannel = (id: number) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedChannels);
      setSelectedChannels([]);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>Canales de Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loadingChannels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay canales disponibles.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {channels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.code}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedChannels.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
            >
              {isSaving
                ? "Guardando..."
                : `Guardar${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesChannelsModal;
