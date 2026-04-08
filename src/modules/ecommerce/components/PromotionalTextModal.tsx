import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,
} from "@/components/ui/dialog";

// TIPOS DE DATOS QUE EL MODAL RECIBE DESDE LA PAGINA
interface PromotionalTextModalProps {
  isOpen: boolean; // TRUE O FALSE PARA VER O NO EL MODAL
  onClose: () => void; //CERRAR
  selectedCount: number;
  onSave: (
    promoText: string,
    bgColor: string,
    textColor: string,
  ) => Promise<void>; //GUARDAR
}

const PromotionalTextModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: PromotionalTextModalProps) => {
  // USE ESTATE
  const [promoText, setPromoText] = useState("Texto promocional");
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isSaving, setIsSaving] = useState(false);

  // EJECUTA EL GUARDADO Y CIERRA EL MODAL AL TERMINAR
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(promoText, bgColor, textColor);
      onClose(); // CIERRA EL MODAL SI TODO SALIO BIEN
    } finally {
      setPromoText("Texto promocional");setBgColor("#000000");setTextColor("#ffffff");
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" hideClose>
        {/* TITULO DEL MODAL */}
        <DialogHeader>
          <DialogTitle>Texto promocional</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* INPUT DE TEXTO + SELECTORES DE COLOR */}
          <div className="flex items-center gap-3">
            <Input
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)} //TEXTO EN TIEMPO REAL
              placeholder="TEXTO PROMOCIONAL"
            />
            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
              Fondo
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)} //CTUALIZA COLOR DE FONDO
                className="w-8 h-8 cursor-pointer rounded border"
              />
            </label>
            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
              Texto
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)} //ACTUALIZA COLOR DE TEXTO
                className="w-8 h-8 cursor-pointer rounded border"
              />
            </label>
          </div>

          {/* PREVIEW EN VIVO — USA LOS ESTADOS PARA MOSTRAR COMO QUEDARA */}
          <div
            className="w-full py-3 text-center rounded text-sm font-medium"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {promoText}
          </div>

          {/* BOTONES DE ACCION */}
          <div className="flex justify-end gap-2 pt-2">
            {/* CANCELAR — CIERRA EL MODAL SIN GUARDAR */}
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            {/* GUARDAR — LLAMA handleSave Y SE DESACTIVA MIENTRAS PROCESA */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
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

export default PromotionalTextModal;
