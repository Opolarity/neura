import {
  ChevronDown,
  Maximize,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
  clampZoom,
  stepZoom,
} from "../lib/zoom";
import { numberRule, type Validator } from "../lib/validators";
import { CommitInput } from "./commit-input";
import { UnitText } from "./unit-text";

const toPercent = (scale: number) => Math.round(scale * 100);

const validatePercent = numberRule({ positive: true });

/** Un porcentaje mayor que 0 (con o sin "%"), llevado a los límites del zoom. */
const validateZoom: Validator<number> = (text) => {
  const percent = validatePercent(text.replace("%", ""));
  return percent && { value: clampZoom(percent.value / 100) };
};

function ZoomOption({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-full justify-start gap-2 px-2 text-[12px] font-normal"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/**
 * Zoom del lienzo: el botón muestra el porcentaje (solo lectura) y abre las
 * opciones; el porcentaje se escribe en el campo de dentro.
 */
export function ZoomControl({
  scale,
  onZoomChange,
  onFit,
}: {
  scale: number;
  onZoomChange: (scale: number) => void;
  onFit: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-[88px] justify-between gap-1 text-[12px] tabular-nums"
        >
          {toPercent(scale)}%
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[200px] p-1.5">
        <div className="relative px-0.5 pb-1.5">
          <CommitInput
            inputMode="numeric"
            value={scale}
            format={(value) => String(toPercent(value))}
            validate={validateZoom}
            onCommit={onZoomChange}
            aria-label="Zoom en porcentaje"
            className="h-8 pr-7 text-[12px] md:text-[12px]"
          />
          <UnitText
            unit="%"
            label="Zoom, en porcentaje"
            className="absolute right-3 top-[16px] -translate-y-1/2"
          />
        </div>
        <div className="flex flex-col border-t border-border pt-1.5">
          <ZoomOption
            icon={ZoomIn}
            label="Acercar"
            onClick={() => onZoomChange(stepZoom(scale, ZOOM_STEP))}
            disabled={scale >= MAX_ZOOM}
          />
          <ZoomOption
            icon={ZoomOut}
            label="Alejar"
            onClick={() => onZoomChange(stepZoom(scale, -ZOOM_STEP))}
            disabled={scale <= MIN_ZOOM}
          />
          <ZoomOption
            icon={Maximize}
            label="Ajustar a la pantalla"
            onClick={onFit}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
