import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getTags } from "@/shared/services/service";
import { TagsResponse } from "@/shared/types/type";
import { type MassiveBrandsMode } from "@/modules/products/services/products.service";
import { Loader2 } from "lucide-react";

interface AssignBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (brandIds: number[], mode: MassiveBrandsMode) => Promise<void>;
}

const AssignBrandsModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: AssignBrandsModalProps) => {
  const [brands, setBrands] = useState<TagsResponse[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<MassiveBrandsMode>("assign");

  const isUnassign = mode === "unassign";

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBrands([]);
    setSearch("");
    setMode("assign");
    setLoadingBrands(true);
    getTags()
      // La tabla tags guarda etiquetas y marcas; aqui solo se ofrecen las
      // marcas para no tocar una etiqueta por error. El backend valida lo
      // mismo, esto solo evita mostrarlas.
      .then((data) =>
        setBrands(
          data
            .filter((t) => t.type === "brand")
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
      )
      .catch((error) => console.error("Error loading brands:", error))
      .finally(() => setLoadingBrands(false));
  }, [isOpen]);

  const visibleBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(query));
  }, [brands, search]);

  const toggleBrand = (id: number) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  // Al cambiar de modo se limpia la selección: lo marcado para agregar no debe
  // convertirse por inercia en lo que se va a quitar.
  const handleModeChange = (value: string) => {
    if (value !== "assign" && value !== "unassign") return; // el toggle no permite deseleccionar
    if (value === mode) return;
    setMode(value);
    setSelectedBrands([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedBrands, mode);
      setSelectedBrands([]);
      onClose();
    } catch {
      // La página ya mostró el toast de error; el modal queda abierto con la selección
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>
            {isUnassign ? "Desasignar Marcas" : "Asignar Marcas"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={handleModeChange}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            disabled={isSaving}
          >
            <ToggleGroupItem value="assign" className="flex-1">
              Asignar
            </ToggleGroupItem>
            <ToggleGroupItem value="unassign" className="flex-1">
              Desasignar
            </ToggleGroupItem>
          </ToggleGroup>

          <p className="text-xs text-muted-foreground">
            {isUnassign
              ? "Se quitarán solo las marcas marcadas. Las demás marcas y las etiquetas del producto no se modifican. Si un producto no tiene la marca, se ignora."
              : "Las marcas se agregan; no se elimina ninguna asignación existente. Si un producto ya tiene la marca, se ignora."}
          </p>

          <Input
            placeholder="Buscar marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loadingBrands}
          />

          {loadingBrands ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {brands.length === 0
                ? "No hay marcas disponibles."
                : "No se encontraron marcas."}
            </p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {visibleBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center space-x-2 rounded-md px-1 py-1 hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    id={`massive-brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => toggleBrand(brand.id)}
                  />
                  <Label
                    htmlFor={`massive-brand-${brand.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {brand.name}
                  </Label>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {selectedBrands.length} marca{selectedBrands.length === 1 ? "" : "s"}{" "}
            · {selectedCount} producto{selectedCount === 1 ? "" : "s"}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedBrands.length === 0}
              className={
                isUnassign
                  ? "bg-red-500 hover:bg-red-600 text-white disabled:opacity-60"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
              }
            >
              {isSaving
                ? isUnassign
                  ? "Quitando..."
                  : "Guardando..."
                : `${isUnassign ? "Quitar" : "Guardar"}${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignBrandsModal;
