import React, { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import { useCities } from "../hooks/useCities";

type Props = {
  stateId?: string | null;
  value?: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  placeholder?: string;
  labelClassName?: string;
  invalid?: boolean;
};

export const CityField = function CitySelect({
  stateId,
  value,
  onChange,
  label,
  placeholder,
  labelClassName,
  invalid = false,
}: Props) {
  const id = useId();
  const { data: cities = [], isLoading, isError } = useCities(stateId);
  // Controlled vs uncontrolled
  const selectedValue = value ?? "";
  // Prevent invalid selected value
  const selectedExists = cities.some((c) => String(c.id) === selectedValue);
  const safeValue = selectedExists ? selectedValue : "";

  const handleChange = (v: string) => {
    onChange(v);
  };

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
  ) : isError ? (
    <p className="text-sm text-destructive px-2 py-1">Error al cargar</p>
  ) : cities.length === 0 ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Sin resultados</p>
  ) : (
    cities.map((c) => (
      <SelectItem key={c.id} value={String(c.id)}>
        {c.name}
      </SelectItem>
    ))
  );

  const selectNode = (
    <Select
      value={safeValue}
      onValueChange={handleChange}
      disabled={!stateId || (!isLoading && cities.length === 0)}
    >
      <SelectTrigger id={id} className={cn(invalid && "border-destructive")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>{content}</SelectContent>
    </Select>
  );

  if (!label) return selectNode;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {selectNode}
    </div>
  );
};
