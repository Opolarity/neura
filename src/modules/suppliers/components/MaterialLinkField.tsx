import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";
import {
  createMaterialApi,
  measurementUnitsApi,
} from "../services/materials.service";
import { MeasurementUnit } from "../types/materials.types";
import { MaterialOption } from "../types/services.types";
import { MaterialClass } from "../types/materials.types";
import {
  MaterialLinkValue,
  emptyMaterialLink,
  selectExistingMaterial,
} from "../types/materialLink.types";

interface MaterialLinkFieldProps {
  value: MaterialLinkValue;
  onChange: (value: MaterialLinkValue) => void;
  materials: MaterialOption[];
  materialSearch: string;
  onMaterialSearchChange: (value: string) => void;
  /** Clases del módulo MAT, para el alta de un material nuevo. */
  materialClasses: MaterialClass[];
  materialClassSearch: string;
  onMaterialClassSearchChange: (value: string) => void;
  /** Proveedor con el que se crea el material nuevo. Sin proveedor, no se puede crear. */
  supplierId: number | null;
  /** Nombre sugerido al crear el material (normalmente la descripción). */
  nameSuggestion?: string;
  /** Se ejecuta cuando se crea un material desde el popup, para sumarlo a la lista del padre. */
  onMaterialCreated?: (material: MaterialOption) => void;
  disabled?: boolean;
  /** `cell` compacta el bloque para meterlo dentro de una celda de tabla. */
  layout?: "stacked" | "cell";
  /**
   * Sin casilla: la línea ES un material por definición y no hay nada que
   * decidir. Se usa en la Orden de Compra, donde desmarcarlo dejaría una línea
   * de compra sin material, que no es nada. Al quedar `linked` siempre activo,
   * `materialLinkError` convierte el material en obligatorio sin más código.
   */
  alwaysLinked?: boolean;
}

/**
 * Checkbox "Asignar material" + combobox de materiales existentes con un
 * botón "Crear material nuevo" al pie que abre un popup aparte — mismo
 * patrón que el alta de categoría en Ingresos/Gastos (AddMovementPage).
 *
 * El material creado desde el popup nace con stock 0 y sin costo, como
 * cualquier material nuevo: a partir de ahí se sincroniza igual que un
 * material existente (costo en QUOT-HDN, stock en REC-PHY).
 */
export const MaterialLinkField = ({
  value,
  onChange,
  materials,
  materialSearch,
  onMaterialSearchChange,
  materialClasses,
  materialClassSearch,
  onMaterialClassSearchChange,
  supplierId,
  nameSuggestion = "",
  onMaterialCreated,
  disabled = false,
  layout = "stacked",
  alwaysLinked = false,
}: MaterialLinkFieldProps) => {
  const isCell = layout === "cell";

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClassId, setNewClassId] = useState<number | null>(null);
  const [newUnit, setNewUnit] = useState("");
  const [units, setUnits] = useState<MeasurementUnit[]>([]);

  // El catalogo de unidades. Antes esto era un input de texto libre, que es
  // como acabaron conviviendo "m", "MTR" y "metros" para la misma unidad.
  useEffect(() => {
    measurementUnitsApi().then(setUnits).catch(console.error);
  }, []);
  const [creating, setCreating] = useState(false);

  const selectedClassName =
    materialClasses.find((cls) => cls.id === newClassId)?.name ?? "";

  const toggleLink = (linked: boolean) => {
    onChange(linked ? { ...value, linked: true } : emptyMaterialLink());
  };

  const openCreateDialog = () => {
    setPopoverOpen(false);

    // El disabled silencioso no avisaba por que no pasaba nada al hacer
    // click: mejor dejar clickear siempre y avisar con un toast.
    if (supplierId === null) {
      toast({ title: "Selecciona un proveedor primero", variant: "destructive" });
      return;
    }

    setNewName(nameSuggestion);
    setNewClassId(null);
    setNewUnit("");
    setCreateOpen(true);
  };

  const handleCreateMaterial = async () => {
    if (!newName.trim()) {
      toast({ title: "El nombre del material es obligatorio", variant: "destructive" });
      return;
    }
    if (newClassId === null) {
      toast({ title: "La clase del material es obligatoria", variant: "destructive" });
      return;
    }
    if (!newUnit) {
      toast({ title: "La unidad de medida es obligatoria", variant: "destructive" });
      return;
    }
    if (supplierId === null) {
      toast({ title: "Selecciona un proveedor primero", variant: "destructive" });
      return;
    }

    try {
      setCreating(true);
      const material = await createMaterialApi({
        name: newName.trim(),
        supplier_id: supplierId,
        material_class_id: newClassId,
        measurement_unit: newUnit,
        // Sin lineas de stock: el material nace en cero y lo recibe cuando
        // llegue la compra.
      });
      onMaterialCreated?.(material);
      onChange(selectExistingMaterial(material));
      setCreateOpen(false);
      toast({ title: "Material creado exitosamente", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error al crear material: " + error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("space-y-2", isCell && "space-y-1")}>
      {alwaysLinked ? (
        <Label className="font-normal">Material</Label>
      ) : (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={value.linked}
            onCheckedChange={(checked) => toggleLink(checked === true)}
            disabled={disabled}
            id="material-link-checkbox"
          />
          <Label htmlFor="material-link-checkbox" className="font-normal cursor-pointer">
            Asignar material
          </Label>
        </div>
      )}

      {value.linked && (
        <>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={disabled}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {value.materialName || "Seleccionar material..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command shouldFilter={false}>
                <div className="flex gap-2 p-2 border-b">
                  <Input
                    value={materialSearch}
                    onChange={(e) => onMaterialSearchChange(e.target.value)}
                    placeholder="Buscar material..."
                    className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <Button type="button" variant="outline" className="shrink-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <CommandList className="h-[160px] overflow-y-auto">
                  <CommandEmpty>Sin resultados</CommandEmpty>
                  <CommandGroup>
                    {materials.map((material) => (
                      <CommandItem
                        key={material.id}
                        value={material.name}
                        onSelect={() => {
                          onChange(selectExistingMaterial(material));
                          setPopoverOpen(false);
                          onMaterialSearchChange("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value.materialId === material.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{material.name}</span>
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
                    onClick={openCreateDialog}
                  >
                    <Plus className="h-4 w-4" />
                    Crear material nuevo
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
          {value.materialUnit && (
            <p className="text-xs text-muted-foreground">
              Unidad del material: {value.materialUnit}
            </p>
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-material-name">Nombre *</Label>
              <Input
                id="new-material-name"
                placeholder="Nombre del material"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Clase de material *</Label>
              <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedClassName || "Seleccionar clase..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="flex gap-2 p-2 border-b">
                      <Input
                        value={materialClassSearch}
                        onChange={(e) => onMaterialClassSearchChange(e.target.value)}
                        placeholder="Buscar clase..."
                        className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <Button type="button" variant="outline" className="shrink-0">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    <CommandList className="h-[160px] overflow-y-auto">
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {materialClasses
                          .filter((cls) =>
                            cls.name.toLowerCase().includes(materialClassSearch.toLowerCase())
                          )
                          .map((cls) => (
                            <CommandItem
                              key={cls.id}
                              value={cls.name}
                              onSelect={() => {
                                setNewClassId(cls.id);
                                setClassPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  newClassId === cls.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{cls.name}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-material-unit">Unidad de medida *</Label>
              <Select value={newUnit} onValueChange={setNewUnit}>
                <SelectTrigger id="new-material-unit">
                  <SelectValue placeholder="Seleccionar unidad..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.code}>
                      {unit.name} ({unit.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateMaterial} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialLinkField;
