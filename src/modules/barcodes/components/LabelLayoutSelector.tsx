import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { BarcodeLabelLayout } from "../types/Barcodes.types";
import { LABEL_LAYOUT_PRESETS, findPresetId } from "../constants/labelLayouts";

interface LabelLayoutSelectorProps {
  layout: BarcodeLabelLayout;
  onChange: (layout: BarcodeLabelLayout) => void;
}

const CUSTOM_ID = "custom";

const LabelLayoutSelector = ({ layout, onChange }: LabelLayoutSelectorProps) => {
  const presetId = findPresetId(layout);
  const [advancedOpen, setAdvancedOpen] = useState(presetId === CUSTOM_ID);

  const handlePresetChange = (id: string) => {
    if (id === CUSTOM_ID) {
      setAdvancedOpen(true);
      return;
    }
    const preset = LABEL_LAYOUT_PRESETS.find((p) => p.id === id);
    if (preset) onChange(preset.layout);
  };

  const handleFieldChange = (field: keyof BarcodeLabelLayout, value: string) => {
    onChange({ ...layout, [field]: Number(value) });
  };

  const pageWidth =
    layout.marginX * 2 +
    layout.columns * layout.labelWidth +
    (layout.columns - 1) * layout.gapX;
  const pageHeight = layout.marginY * 2 + layout.labelHeight;

  return (
    <div className="space-y-2">
      <Label htmlFor="labelLayout">Formato de etiqueta</Label>
      <Select value={presetId} onValueChange={handlePresetChange}>
        <SelectTrigger id="labelLayout">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LABEL_LAYOUT_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_ID}>Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <p className="text-sm text-muted-foreground">
        Papel de {pageWidth}x{pageHeight}mm ·{" "}
        {layout.columns === 1
          ? "1 etiqueta por fila"
          : `${layout.columns} etiquetas por fila`}
      </p>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
          Ajustar medidas del papel
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-cols-2 gap-3 pt-3">
          <div className="space-y-1">
            <Label htmlFor="layoutColumns" className="text-xs font-normal">
              Columnas
            </Label>
            <Input
              id="layoutColumns"
              type="number"
              min={1}
              max={10}
              value={layout.columns}
              onChange={(e) => handleFieldChange("columns", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutGapX" className="text-xs font-normal">
              Separación entre columnas (mm)
            </Label>
            <Input
              id="layoutGapX"
              type="number"
              min={0}
              step={0.5}
              value={layout.gapX}
              onChange={(e) => handleFieldChange("gapX", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutWidth" className="text-xs font-normal">
              Ancho de etiqueta (mm)
            </Label>
            <Input
              id="layoutWidth"
              type="number"
              min={10}
              step={0.5}
              value={layout.labelWidth}
              onChange={(e) => handleFieldChange("labelWidth", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutHeight" className="text-xs font-normal">
              Alto de fila (mm)
            </Label>
            <Input
              id="layoutHeight"
              type="number"
              min={8}
              step={0.5}
              value={layout.labelHeight}
              onChange={(e) => handleFieldChange("labelHeight", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutMarginX" className="text-xs font-normal">
              Margen lateral (mm)
            </Label>
            <Input
              id="layoutMarginX"
              type="number"
              min={0}
              step={0.5}
              value={layout.marginX}
              onChange={(e) => handleFieldChange("marginX", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutMarginY" className="text-xs font-normal">
              Margen superior/inferior (mm)
            </Label>
            <Input
              id="layoutMarginY"
              type="number"
              min={0}
              step={0.5}
              value={layout.marginY}
              onChange={(e) => handleFieldChange("marginY", e.target.value)}
            />
          </div>

          <div className="col-span-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Si la impresión sale corrida, movela sin tocar las medidas:
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutOffsetX" className="text-xs font-normal">
              Correr horizontal (mm, + derecha)
            </Label>
            <Input
              id="layoutOffsetX"
              type="number"
              step={0.5}
              value={layout.offsetX}
              onChange={(e) => handleFieldChange("offsetX", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="layoutOffsetY" className="text-xs font-normal">
              Correr vertical (mm, + abajo)
            </Label>
            <Input
              id="layoutOffsetY"
              type="number"
              step={0.5}
              value={layout.offsetY}
              onChange={(e) => handleFieldChange("offsetY", e.target.value)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default LabelLayoutSelector;
