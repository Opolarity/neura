import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";

interface ShortDescriptionMayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (shortDescription: string) => Promise<void>;
}

const ShortDescriptionMayModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: ShortDescriptionMayModalProps) => {
  const [Description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      ///
      await onSave(Description);
      setDescription("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl" hideClose>
        <DialogHeader>
          <DialogTitle>Descripción Mayorista</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <WysiwygEditor
            label=""
            value={Description}
            onChange={setDescription}
            placeholder="Escribe la descripción corta del producto..."
            height="200px"
            toolbar="full"
            disabled={false}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || Description.trim().length === 0}
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

export default ShortDescriptionMayModal;
