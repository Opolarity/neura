import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,
} from "@/components/ui/dialog";
import {
  ColorField,
  parseColor,
  rgbaToHex6,
} from "@/modules/ecommerce/editor/components/color-field";

// EL SELECTOR DEL EDITOR DEVUELVE rgba(...). UN COLOR OPACO SE GUARDA EN HEX,
// QUE ES LO QUE LEE EL SELECTOR NATIVO DE LA FICHA DEL PRODUCTO; SOLO UN COLOR
// CON TRANSPARENCIA SE GUARDA EN rgba, PORQUE EL HEX DE SEIS DIGITOS NO LA LLEVA.
const toStoredColor = (value: string) => {
  const rgba = parseColor(value);
  return rgba.a < 1 ? value : `#${rgbaToHex6(rgba)}`;
};

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
          {/* INPUT DE TEXTO */}
          <Input
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)} //TEXTO EN TIEMPO REAL
            placeholder="TEXTO PROMOCIONAL"
          />

          {/* SELECTORES DE COLOR — LOS MISMOS DEL EDITOR DE SITIO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Fondo</Label>
              <ColorField
                value={bgColor}
                onChange={(val) => setBgColor(toStoredColor(val))} //ACTUALIZA COLOR DE FONDO
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Texto</Label>
              <ColorField
                value={textColor}
                onChange={(val) => setTextColor(toStoredColor(val))} //ACTUALIZA COLOR DE TEXTO
              />
            </div>
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
