import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromotionalTextSectionProps {
  promotionalText: string;
  setPromotionalText: (value: string) => void;
  promotionalBgColor: string;
  setPromotionalBgColor: (value: string) => void;
  promotionalTextColor: string;
  setPromotionalTextColor: (value: string) => void;
  disabled?: boolean;
}

const PromotionalTextSection = ({
  promotionalText,
  setPromotionalText,
  promotionalBgColor,
  setPromotionalBgColor,
  promotionalTextColor,
  setPromotionalTextColor,
  disabled,
}: PromotionalTextSectionProps) => {
  return (
    <div className="space-y-3">
      <Label>Texto promocional</Label>
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={promotionalText}
            onChange={(e) => setPromotionalText(e.target.value)}
            placeholder="Ej: ¡Oferta especial!"
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="promotionalBgColor" className="text-xs whitespace-nowrap">Fondo</Label>
          <input
            id="promotionalBgColor"
            type="color"
            value={promotionalBgColor}
            onChange={(e) => setPromotionalBgColor(e.target.value)}
            disabled={disabled}
            className="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="promotionalTextColor" className="text-xs whitespace-nowrap">Texto</Label>
          <input
            id="promotionalTextColor"
            type="color"
            value={promotionalTextColor}
            onChange={(e) => setPromotionalTextColor(e.target.value)}
            disabled={disabled}
            className="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
          />
        </div>
      </div>
      {promotionalText && (
        <div
          className="rounded px-3 py-1.5 text-sm text-center"
          style={{ backgroundColor: promotionalBgColor, color: promotionalTextColor }}
        >
          {promotionalText}
        </div>
      )}
    </div>
  );
};

export default PromotionalTextSection;
