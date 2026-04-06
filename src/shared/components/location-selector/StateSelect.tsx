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
import { getStates } from "@/shared/services/service";
import { cn } from "@/shared/utils/utils";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
};

export const StateSelect = React.memo(function StateSelect({
  value,
  onChange,
  invalid = false,
  placeholder,
  label,
  labelClassName,
}: Props) {
  const { state, setState, country } = useLocationSelector();
  const id = useId();
  const labelId = `${id}-label`;
  // Controlled vs uncontrolled
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? (value ?? "") : state;

  const {
    data: states = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["states", country],
    queryFn: () => getStates(Number(country)),
    enabled: !!country,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Prevent invalid selected value
  const selectedExists = states.some((s) => String(s.id) === selectedValue);
  const safeValue = selectedExists ? selectedValue : undefined;

  const handleChange = (v: string) => {
    if (!isControlled) {
      setState(v);
    }
    onChange?.(v);
  };

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
  ) : isError ? (
    <p className="text-sm text-destructive px-2 py-1">Error al cargar</p>
  ) : states.length === 0 ? (
    <p className="text-sm text-muted-foreground px-2 py-1">Sin resultados</p>
  ) : (
    states.map((s) => (
      <SelectItem key={s.id} value={String(s.id)}>
        {s.name}
      </SelectItem>
    ))
  );

  const selectNode = (
    <Select
      value={safeValue}
      onValueChange={handleChange}
      disabled={!country || (!isLoading && states.length === 0)}
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
      <Label id={labelId} htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {selectNode}
    </div>
  );
});
