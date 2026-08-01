import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeLabelLayout } from "../types/Barcodes.types";
import { LABEL_LAYOUT_PRESETS, getLabelWidth, getMaxGapX } from "../constants/labelLayouts";

interface LabelLayoutSelectorProps {
  layout: BarcodeLabelLayout;
  onChange: (layout: BarcodeLabelLayout) => void;
}

const LabelLayoutSelector = ({ layout, onChange }: LabelLayoutSelectorProps) => {
  const selectedId =
    LABEL_LAYOUT_PRESETS.find((preset) => preset.layout.columns === layout.columns)?.id ??
    LABEL_LAYOUT_PRESETS[0].id;

  return (
    <div className="space-y-2">
      <Label htmlFor="labelLayout">Formato de etiqueta</Label>
      <Select
        value={selectedId}
        onValueChange={(id) => {
          const preset = LABEL_LAYOUT_PRESETS.find((p) => p.id === id);
          if (preset) onChange(preset.layout);
        }}
      >
        <SelectTrigger id="labelLayout">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LABEL_LAYOUT_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Configura la impresora con papel de {layout.paperWidth}x{layout.labelHeight}mm.
      </p>

      {layout.columns > 1 && (
        <div className="space-y-1 pt-1">
          <Label htmlFor="layoutGapX" className="text-xs font-normal">
            Separación entre columnas (mm)
          </Label>
          <Input
            id="layoutGapX"
            type="number"
            min={0}
            max={getMaxGapX(layout.paperWidth, layout.columns)}
            step={0.5}
            value={layout.gapX}
            onChange={(e) => onChange({ ...layout, gapX: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">
            Si las etiquetas se van corriendo hacia la izquierda columna a columna,
            subí este valor. No cambia el tamaño del papel: reparte las{" "}
            {layout.columns} etiquetas ({getLabelWidth(layout).toFixed(1)}mm cada una)
            hacia los bordes.
          </p>
        </div>
      )}
    </div>
  );
};

export default LabelLayoutSelector;
