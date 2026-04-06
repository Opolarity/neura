import { useId } from "react";
import { useCountries } from "../hooks/useCountries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";

type Props = {
  value?: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  placeholder?: string;
  labelClassName?: string;
  invalid?: boolean;
};

export function CountryField({
  value,
  onChange,
  label,
  placeholder,
  labelClassName,
  invalid = false,
}: Props) {
  const id = useId();
  const { data: countries = [], isLoading, isError } = useCountries();
  // State controlled
  const selectedValue = value ?? "";
  // Prevent invalid selected value
  const selectedExists = countries.some((c) => String(c.id) === selectedValue);
  const safeValue = selectedExists ? selectedValue : "";

  const handleChange = (v: string) => {
    onChange(v);
  };

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
  ) : isError ? (
    <p className="text-sm text-destructive px-2 py-1">Error al cargar</p>
  ) : countries.length === 0 ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Sin resultados</p>
  ) : (
    countries.map((c) => (
      <SelectItem key={c.id} value={String(c.id)}>
        {c.name}
      </SelectItem>
    ))
  );

  const selectNode = (
    <Select value={safeValue} onValueChange={handleChange}>
      <SelectTrigger id={id} className={cn(invalid && "border-destructive")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{content}</SelectContent>
    </Select>
  );

  if (!label) return selectNode;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelClassName}>{label}</Label>
      {selectNode}
    </div>
  );
}
