import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: number | null;
  options: { id: number; name: string }[];
  onChange: (id: number) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

/** Select compacto de catálogo (id numérico) para el panel angosto del pedido. */
export const NumberSelect = ({ value, options, onChange, placeholder, label, disabled, className }: Props) => (
  <Select
    value={value ? String(value) : undefined}
    onValueChange={(v) => onChange(Number(v))}
    disabled={disabled || options.length === 0}
  >
    <SelectTrigger className={className ?? "h-8 text-xs"} aria-label={label}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o.id} value={String(o.id)} className="text-xs">
          {o.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
