import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// T-596 · Configura el stock mínimo de las variaciones seleccionadas.
//
// Dos acciones distintas, a propósito:
//   Guardar N       -> esas variaciones reservan N unidades. N = 0 es "no
//                      proteger esta variación", una decisión explícita.
//   Volver al valor -> borra el valor propio; las variaciones vuelven a regirse
//   por defecto        por el mínimo global. No es lo mismo que guardar 0.

interface MinimumStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  /** Nombre del canal que se está configurando ("Web Mayorista"). */
  channelName: string | null;
  /** Mínimo global vigente; null si no hay default configurado. */
  defaultMinStock: number | null;
  /** `null` = volver al valor por defecto (borra las filas). */
  onSave: (minStock: number | null) => Promise<void>;
}

const MinimumStockModal = ({
  isOpen,
  onClose,
  selectedCount,
  channelName,
  defaultMinStock,
  onSave,
}: MinimumStockModalProps) => {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValue("");
  }, [isOpen]);

  const parsed = value.trim() === "" ? null : Number(value);
  const isValid =
    parsed !== null && Number.isInteger(parsed) && parsed >= 0 && parsed <= 10000;

  const handleSave = async (minStock: number | null) => {
    setIsSaving(true);
    try {
      await onSave(minStock);
      setValue("");
      onClose();
    } catch {
      // La página ya mostró el toast de error; el modal queda abierto.
    } finally {
      setIsSaving(false);
    }
  };

  const plural = `${selectedCount} variaci${selectedCount === 1 ? "ón" : "ones"}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>
            Stock mínimo{channelName ? ` — ${channelName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Las unidades reservadas dejan de venderse en la web mayorista: esa
            talla aparece agotada cuando el stock llega al mínimo. La web
            minorista, el POS, el ERP y el chatbot no se ven afectados.
          </p>

          <div className="space-y-2">
            <Label htmlFor="minimum-stock-value" className="text-sm font-medium">
              Unidades reservadas
            </Label>
            <Input
              id="minimum-stock-value"
              type="number"
              min={0}
              placeholder={
                defaultMinStock !== null
                  ? `Por defecto: ${defaultMinStock}`
                  : "Ej: 5"
              }
              value={value}
              onKeyDown={(e) => e.key === "-" && e.preventDefault()}
              onChange={(e) => setValue(e.target.value)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              0 deja la variación sin protección, y es distinto de volver al
              valor por defecto.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Se aplicará a {plural}.
          </p>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(null)}
              disabled={isSaving || selectedCount === 0}
            >
              Volver al valor por defecto
            </Button>
            <Button
              onClick={() => handleSave(parsed)}
              disabled={isSaving || !isValid || selectedCount === 0}
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

export default MinimumStockModal;
