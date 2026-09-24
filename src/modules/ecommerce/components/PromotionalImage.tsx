import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Trash2, Upload, X } from "lucide-react";

interface PromotionalImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  /** Cuántos de los seleccionados ya tienen imagen; null mientras se consulta. */
  withImageCount: number | null;
  onSave: (PromotionalImageUrl: string | null) => Promise<void>;
  onRemove: () => Promise<void>;
}

const plural = (n: number) => `${n} producto${n === 1 ? "" : "s"}`;

const PromotionalImageModal = ({
  isOpen,
  onClose,
  selectedCount,
  withImageCount,
  onSave,
  onRemove,
}: PromotionalImageModalProps) => {
  const [PromotionalImage, setPromotionalImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const isBusy = isSaving || isRemoving;
  const withoutImageCount =
    withImageCount === null ? 0 : selectedCount - withImageCount;

  const sizesInputRef = useRef<HTMLInputElement>(null);
  const sizesRefInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    file: File,
    setter: (val: { file: File; preview: string } | null) => void,
  ) => {
    const preview = URL.createObjectURL(file);
    setter({ file, preview });
  };

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const uuid = crypto.randomUUID();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${uuid}.${ext}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(path, file);
    if (error) throw error;

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let PromotionalImageUrl: string | null = null;

      if (PromotionalImage) {
        PromotionalImageUrl = await uploadImage(
          PromotionalImage.file,
          "products-images/promotional",
        );
      }

      await onSave(PromotionalImageUrl);
      setPromotionalImage(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
      setIsConfirmRemoveOpen(false);
      setPromotionalImage(null);
      onClose();
    } catch {
      // El error ya lo muestra quien llama; el modal queda abierto.
    } finally {
      setIsRemoving(false);
    }
  };

  const DropZone = ({
    label,
    value,
    onSelect,
    onClear,
    inputRef,
  }: {
    label: string;
    value: { file: File; preview: string } | null;
    onSelect: (file: File) => void;
    onClear: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {value ? (
        <div className="relative w-full rounded-lg overflow-hidden border border-border">
          <img
            src={value.preview}
            alt={label}
            className="w-full object-contain max-h-48"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 cursor-pointer hover:border-muted-foreground/40 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Haz clic para seleccionar una imagen
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" hideClose>
        <DialogHeader>
          <DialogTitle>Imagen promocional</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {withImageCount !== null && withImageCount > 0 && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4 !text-amber-600" />
              <AlertDescription>
                {withImageCount} de los {plural(selectedCount)} seleccionados
                ya {withImageCount === 1 ? "tiene" : "tienen"} imagen
                promocional. Si guardas una nueva, se reemplazará.
              </AlertDescription>
            </Alert>
          )}

          <DropZone
            label="Imagen "
            value={PromotionalImage}
            onSelect={(file) => handleFileSelect(file, setPromotionalImage)}
            onClear={() => setPromotionalImage(null)}
            inputRef={sizesRefInputRef}
          />

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmRemoveOpen(true)}
              disabled={isBusy || !withImageCount}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Quitar imagen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isBusy}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isBusy || (!PromotionalImage && !PromotionalImage)}
                className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
              >
                {isSaving
                  ? "Guardando..."
                  : `Guardar${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={isConfirmRemoveOpen}
        onOpenChange={(open) => !isRemoving && setIsConfirmRemoveOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar imagen promocional?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará la imagen promocional de {plural(withImageCount ?? 0)}.
              {withoutImageCount > 0 &&
                ` ${plural(withoutImageCount)} de la selección no ${withoutImageCount === 1 ? "tiene" : "tienen"} imagen y no ${withoutImageCount === 1 ? "cambia" : "cambian"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Quitando..." : "Quitar imagen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default PromotionalImageModal;
