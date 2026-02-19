import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PriceListItem } from "../types/PriceList.types";

interface PriceListEditDialogProps {
  item: PriceListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const PriceListEditDialog = ({
  item,
  open,
  onOpenChange,
  onSaved,
}: PriceListEditDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState(0);
  const [web, setWeb] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCode(item.code ?? "");
      setLocation(item.location);
      setWeb(item.web);
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("price_list")
        .update({
          name: name.trim(),
          code: code.trim() || null,
          location,
          web,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Lista de precios actualizada");
      onSaved();
    } catch (err: any) {
      toast.error("Error al actualizar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lista de Precios</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="pl-name">Nombre</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl-code">Código</Label>
            <Input
              id="pl-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl-location">Ubicación</Label>
            <Input
              id="pl-location"
              type="number"
              value={location}
              onChange={(e) => setLocation(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pl-web">Web</Label>
            <Switch
              id="pl-web"
              checked={web}
              onCheckedChange={setWeb}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
