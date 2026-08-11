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
import { Loader2 } from "lucide-react";

export type TagMassiveMode = "assign" | "unassign";

interface AssignTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (tagIds: number[], mode: TagMassiveMode) => Promise<void>;
}

const AssignTagsModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}: AssignTagsModalProps) => {
  const [tags, setTags] = useState<TagsResponse[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<TagMassiveMode>("assign");

  const isUnassign = mode === "unassign";

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTags([]);
    setSearch("");
    setMode("assign");
    setLoadingTags(true);
    getTags()
      // La tabla tags guarda etiquetas y marcas; aqui solo se ofrecen las
      // etiquetas para no asignar una marca por error. El backend valida lo
      // mismo, esto solo evita mostrarlas.
      .then((data) =>
        setTags(
          data
            .filter((t) => t.type === "tag")
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
      )
      .catch((error) => console.error("Error loading tags:", error))
      .finally(() => setLoadingTags(false));
  }, [isOpen]);

  const visibleTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(query));
  }, [tags, search]);

  const toggleTag = (id: number) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  // Al cambiar de modo se limpia la selección: lo marcado para agregar no debe
  // convertirse por inercia en lo que se va a quitar.
  const handleModeChange = (value: string) => {
    if (value !== "assign" && value !== "unassign") return; // el toggle no permite deseleccionar
    if (value === mode) return;
    setMode(value);
    setSelectedTags([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedTags, mode);
      setSelectedTags([]);
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
            {isUnassign ? "Desasignar Etiquetas" : "Asignar Etiquetas"}
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
              ? "Se quitarán solo las etiquetas marcadas. Las demás etiquetas del producto no se modifican. Si un producto no tiene la etiqueta, se ignora."
              : "Las etiquetas se agregan; no se elimina ninguna asignación existente. Si un producto ya tiene la etiqueta, se ignora."}
          </p>

          <Input
            placeholder="Buscar etiqueta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loadingTags}
          />

          {loadingTags ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleTags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tags.length === 0
                ? "No hay etiquetas disponibles."
                : "No se encontraron etiquetas."}
            </p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {visibleTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 rounded-md px-1 py-1 hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    id={`massive-tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <Label
                    htmlFor={`massive-tag-${tag.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {selectedTags.length} etiqueta{selectedTags.length === 1 ? "" : "s"}{" "}
            · {selectedCount} producto{selectedCount === 1 ? "" : "s"}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedTags.length === 0}
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

export default AssignTagsModal;
