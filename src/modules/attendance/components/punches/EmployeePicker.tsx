import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getEmployeeOptionsApi } from "../../services/attendance.service";
import { EmployeeOption } from "../../types/attendance.types";

interface EmployeePickerProps {
  id?: string;
  value: EmployeeOption | null;
  onChange: (value: EmployeeOption) => void;
}

/** Buscador de trabajador (nombre, código o DNI) para el formulario de marca. */
export const EmployeePicker = ({ id, value, onChange }: EmployeePickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let vigente = true;
    setLoading(true);
    const t = window.setTimeout(() => {
      void getEmployeeOptionsApi(search)
        .then((r) => vigente && setOptions(r))
        .catch(() => vigente && setOptions([]))
        .finally(() => vigente && setLoading(false));
    }, 250);
    return () => {
      vigente = false;
      window.clearTimeout(t);
    };
  }, [open, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value ? `${value.name}${value.code ? ` · ${value.code}` : ""}` : "Busca al trabajador"}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Nombre, código o DNI..." value={search} onValueChange={setSearch} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontraron trabajadores.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {options.map((o) => (
                    <CommandItem
                      key={o.accountId}
                      value={String(o.accountId)}
                      onSelect={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div>
                        <div className="font-medium">{o.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[o.code, o.documentNumber].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
