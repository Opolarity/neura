import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

interface SizeImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (
    sizesImageUrl: string | null,
    sizesRefImageUrl: string | null
  ) => Promise<void>;
}

const SizeImagesModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: SizeImagesModalProps) => {
  const [sizesImage, setSizesImage] = useState<{ file: File; preview: string } | null>(null);
  const [sizesRefImage, setSizesRefImage] = useState<{ file: File; preview: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sizesInputRef = useRef<HTMLInputElement>(null);
  const sizesRefInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    file: File,
    setter: (val: { file: File; preview: string } | null) => void
  ) => {
    const preview = URL.createObjectURL(file);
    setter({ file, preview });
  };

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const uuid = crypto.randomUUID();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${uuid}.${ext}`;

    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) throw error;

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let sizesImageUrl: string | null = null;
      let sizesRefImageUrl: string | null = null;

      if (sizesImage) {
        sizesImageUrl = await uploadImage(sizesImage.file, "products-images/sizes");
      }
      if (sizesRefImage) {
        sizesRefImageUrl = await uploadImage(sizesRefImage.file, "products-images/sizes-ref");
      }

      await onSave(sizesImageUrl, sizesRefImageUrl);
      setSizesImage(null);
      setSizesRefImage(null);
      onClose();
    } finally {
      setIsSaving(false);
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
          <DialogTitle>Imágenes de Tallas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <DropZone
            label="Imagen de Tallas"
            value={sizesImage}
            onSelect={(file) => handleFileSelect(file, setSizesImage)}
            onClear={() => setSizesImage(null)}
            inputRef={sizesInputRef}
          />

          <DropZone
            label="Imagen de Referencia de Tallas"
            value={sizesRefImage}
            onSelect={(file) => handleFileSelect(file, setSizesRefImage)}
            onClear={() => setSizesRefImage(null)}
            inputRef={sizesRefInputRef}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!sizesImage && !sizesRefImage)}
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

export default SizeImagesModal;
