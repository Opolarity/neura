"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/shared/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;

  // 🆕 nuevos props
  showSearch?: boolean;
  showClear?: boolean;
  showSelectAll?: boolean;
  selectAllLabel?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",

  showSearch = false,
  showClear = false,
  showSelectAll = false,
  selectAllLabel = "Seleccionar todo",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allValues = React.useMemo(() => options.map((o) => o.value), [options]);

  const isAllSelected = value.length === options.length;

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allValues);
    }
  };

  const remove = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const clearAll = () => onChange([]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 h-auto min-h-10"
        >
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
            {value.length > 0 ? (
              value.map((val) => {
                const option = options.find((o) => o.value === val);
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option?.label}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm font-normal">
                {placeholder}
              </span>
            )}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          {/* 🔍 buscador opcional */}
          {showSearch && <CommandInput placeholder="Buscar..." />}

          <CommandEmpty>No encontrado.</CommandEmpty>

          <CommandGroup>
            {/* ✅ select all opcional */}
            {showSelectAll && (
              <CommandItem onSelect={toggleAll}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isAllSelected ? "opacity-100" : "opacity-0",
                  )}
                />
                {selectAllLabel}
              </CommandItem>
            )}

            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => toggle(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0",
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* 🧹 clear opcional */}
          {showClear && value.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={clearAll}
              >
                Limpiar selección
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
