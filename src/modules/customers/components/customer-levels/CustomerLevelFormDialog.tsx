import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCustomerLevelForm } from "@/modules/customers/hooks/useCustomerLevelForm";
import type { CustomerLevel, CustomerLevelPayload } from "@/modules/customers/types/customerLevels.types";

interface CustomerLevelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CustomerLevelPayload) => Promise<void>;
  editLevel?: CustomerLevel;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const CustomerLevelFormDialog = ({ open, onOpenChange, onSave, editLevel }: CustomerLevelFormDialogProps) => {
  const { form, errors, isEditing, saving, setField, handleSubmit } = useCustomerLevelForm({
    open,
    editLevel,
    onSave,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar nivel" : "Crear nivel"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej. Fly Bronce"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="minPoints">Puntos desde</Label>
              <Input
                id="minPoints"
                type="number"
                step="1"
                min="0"
                placeholder="150"
                value={form.minPoints}
                onChange={(e) => setField("minPoints", e.target.value)}
              />
              {errors.minPoints && <span className="text-xs text-destructive">{errors.minPoints}</span>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxPoints">Puntos hasta</Label>
              <Input
                id="maxPoints"
                type="number"
                step="1"
                min="0"
                placeholder="Sin tope"
                value={form.maxPoints}
                onChange={(e) => setField("maxPoints", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">Vacío = nivel más alto</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="discountPct">Descuento (%)</Label>
              <Input
                id="discountPct"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.discountPct}
                onChange={(e) => setField("discountPct", e.target.value)}
              />
              {errors.discountPct && <span className="text-xs text-destructive">{errors.discountPct}</span>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input
                id="sortOrder"
                type="number"
                step="1"
                min="0"
                placeholder="Auto"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Selector de color"
                value={HEX_RE.test(form.color) ? form.color : "#6b7280"}
                onChange={(e) => setField("color", e.target.value)}
                className="h-9 w-12 rounded border"
              />
              <Input
                id="color"
                placeholder="#cd7f32"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="imageUrl">Imagen (URL)</Label>
            <Input
              id="imageUrl"
              placeholder="/images/login/bronce-1.png"
              value={form.imageUrl}
              onChange={(e) => setField("imageUrl", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              placeholder="¡Ya eres parte de la Crew!"
              value={form.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="pr-4">
              <Label htmlFor="active">Activo</Label>
              <p className="text-xs text-muted-foreground">Un nivel inactivo no se aplica ni se muestra a los clientes.</p>
            </div>
            <Switch id="active" checked={form.active} onCheckedChange={(v) => setField("active", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
