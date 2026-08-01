import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeLabelLayout } from "../types/Barcodes.types";
import { LABEL_LAYOUT_PRESETS, getPaperSize } from "../constants/labelLayouts";

interface LabelLayoutSelectorProps {
  layout: BarcodeLabelLayout;
  onChange: (layout: BarcodeLabelLayout) => void;
}

const LabelLayoutSelector = ({ layout, onChange }: LabelLayoutSelectorProps) => {
  const selectedId =
    LABEL_LAYOUT_PRESETS.find((preset) => preset.layout.columns === layout.columns)?.id ??
    LABEL_LAYOUT_PRESETS[0].id;
  const paper = getPaperSize(layout);

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
        Configura la impresora con papel de {paper.width}x{paper.height}mm.
      </p>
    </div>
  );
};

export default LabelLayoutSelector;
