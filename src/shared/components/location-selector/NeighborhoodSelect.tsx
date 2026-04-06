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
import { getNeighborhoods } from "@/shared/services/service";
import { cn } from "@/shared/utils/utils";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
};

export const NeighborhoodSelect = React.memo(function NeighborhoodSelect({
  value,
  onChange,
  invalid = false,
  placeholder,
  label,
  labelClassName,
}: Props) {
  const { neighborhood, setNeighborhood, city } = useLocationSelector();
  const id = useId();
  const labelId = `${id}-label`;
  // Controlled vs uncontrolled
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? (value ?? "") : neighborhood;

  const { data: neighborhoods = [], isLoading, isError } = useQuery({
    queryKey: ["neighborhoods", city],
    queryFn: () => getNeighborhoods(Number(city)),
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Prevent invalid selected value
  const selectedExists = neighborhoods.some(
    (n) => String(n.id) === selectedValue
  );
  const safeValue = selectedExists ? selectedValue : undefined;

  const handleChange = (v: string) => {
    if (!isControlled) {
      setNeighborhood(v);
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
  ) : neighborhoods.length === 0 ? (
    <p className="text-sm text-muted-foreground px-2 py-1">
      Sin resultados
    </p>
  ) : (
    neighborhoods.map((n) => (
      <SelectItem key={n.id} value={String(n.id)}>
        {n.name}
      </SelectItem>
    ))
  );

  const selectNode = (
    <Select
      value={safeValue}
      onValueChange={handleChange}
      disabled={!city || (!isLoading && neighborhoods.length === 0)}
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
