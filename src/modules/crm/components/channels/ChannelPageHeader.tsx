import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import { RANGE_LABELS, type RangePreset } from "../../hooks/useChannelMetrics";

interface Props {
  title: string;
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  loading: boolean;
  onReload: () => void;
  /** Acciones extra a la derecha (p. ej. "Registrar gasto"). */
  children?: React.ReactNode;
}

/** Header de Rendimiento y Costos: título, rango y actualizar. */
export const ChannelPageHeader = ({ title, preset, onPresetChange, loading, onReload, children }: Props) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <h1 className="text-2xl font-bold text-foreground">{title}</h1>

    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as RangePreset)}>
        <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(RANGE_LABELS) as RangePreset[]).map((k) => (
            <SelectItem key={k} value={k} className="text-xs">
              {RANGE_LABELS[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={onReload} disabled={loading}>
        <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
        Actualizar
      </Button>

      {children}
    </div>
  </div>
);
