import { useState, useCallback } from "react";

type UseControllableStateProps<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
};

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateProps<T>) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const currentValue = isControlled ? value! : internalValue;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof next === "function"
          ? (next as (prev: T) => T)(currentValue)
          : next;

      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      onChange?.(resolvedValue);
    },
    [isControlled, currentValue, onChange],
  );

  return [currentValue, setValue] as const;
}

// USO EN LocationSelector.tsx
// REEMPLAZAR
/*
const isControlled = value !== undefined;
const [internalValue, setInternalValue] = useState<LocationValue>(
  defaultValue ?? initialValue,
);
const currentValue = isControlled ? value ?? initialValue : internalValue;
*/
// USAR
/*
const [currentValue, setValue] = useControllableState<LocationValue>({
  value,
  defaultValue: defaultValue ?? initialValue,
  onChange,
});

const updateValue = (newValue: LocationValue) => {
  setValue(newValue);
};
*/