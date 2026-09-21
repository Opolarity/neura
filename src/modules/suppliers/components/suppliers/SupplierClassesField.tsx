import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import { SupplierClass } from "../../types/suppliers.types";

interface SupplierClassesFieldProps {
  classes: SupplierClass[];
  selectedIds: number[];
  onToggle: (classId: number) => void;
  /** Crea la clase y la devuelve ya seleccionada. La provee el hook. */
  onCreateClass: (name: string) => Promise<void>;
  creatingClass: boolean;
}

/**
 * Multi-select de clases de proveedor, con creación inline.
 *
 * Vive aparte porque lo usan el alta y la edición, y son 100 líneas de
 * combobox: duplicarlas garantizaba que las dos pantallas se separaran a la
 * primera corrección. El estado que guarda es solo de presentación (el popover
 * abierto, el texto de búsqueda); las clases y su alta las manda el hook.
 */
export const SupplierClassesField = ({
  classes,
  selectedIds,
  onToggle,
  onCreateClass,
  creatingClass,
}: SupplierClassesFieldProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = classes.filter((cls) => selectedIds.includes(cls.id));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateClass(newName.trim());
    setNewName("");
    setNewDialogOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>
        Clases *{" "}
        <span className="text-muted-foreground text-xs font-normal">
          (mínimo 1)
        </span>
      </Label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((cls) => (
            <Badge key={cls.id} variant="secondary" className="gap-1">
              {cls.name}
              <button
                type="button"
                onClick={() => onToggle(cls.id)}
                className="ml-1 rounded-full hover:bg-muted"
                aria-label={`Quitar ${cls.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            {selectedIds.length === 0
              ? "Seleccionar clases..."
              : `${selectedIds.length} clase${selectedIds.length > 1 ? "s" : ""} seleccionada${selectedIds.length > 1 ? "s" : ""}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar clase..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="h-[160px] overflow-y-auto">
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {classes
                  .filter((cls) =>
                    cls.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((cls) => (
                    <CommandItem
                      key={cls.id}
                      value={cls.name}
                      onSelect={() => {
                        onToggle(cls.id);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(cls.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {cls.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => {
                  setSearchOpen(false);
                  setNewDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Añadir nueva clase
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog: crear nueva clase */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva clase de proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nombre de la clase *</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Costura, Estampado, Lavandería..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creatingClass || !newName.trim()}
            >
              {creatingClass ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierClassesField;
