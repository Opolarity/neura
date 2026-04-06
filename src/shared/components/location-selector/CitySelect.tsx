import React, { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocationSelector } from "./LocationContext";
import { getCities } from "@/shared/services/service";
import { cn } from "@/shared/utils/utils";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
};

export const CitySelect = React.memo(function CitySelect({
  value,
  onChange,
  invalid = false,
  placeholder,
  label,
  labelClassName,
}: Props) {
  const { city, setCity, state } = useLocationSelector();
  const id = useId();
  const labelId = `${id}-label`;
  // Controlled vs uncontrolled
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? (value ?? "") : city;

  const {
    data: cities = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cities", state],
    queryFn: () => getCities(Number(state)),
    enabled: !!state,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Prevent invalid selected value
  const selectedExists = cities.some((c) => String(c.id) === selectedValue);
  const safeValue = selectedExists ? selectedValue : undefined;

  const handleChange = (v: string) => {
    if (!isControlled) {
      setCity(v);
    }
    onChange?.(v);
  };

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground px-2 py-1">
      Cargando...
    </p>
  ) : isError ? (
    <p className="text-sm text-destructive px-2 py-1">
      Error al cargar
    </p>
  ) : cities.length === 0 ? (
    <p className="text-sm text-muted-foreground px-2 py-1">
      Sin resultados
    </p>
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
      disabled={!state || (!isLoading && cities.length === 0)}
    >
      <SelectTrigger
        id={id}
        aria-labelledby={labelId}
        className={cn(invalid && "border-destructive")}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>{content}</SelectContent>
    </Select>
  );

  if (!label) return selectNode;

  return (
    <div className={cn("relative flex flex-col gap-2 pb-5")}>
      <Label
        id={labelId}
        htmlFor={id}
        className={labelClassName}
      >
        {label}
      </Label>
      {selectNode}
    </div>
  );
});
