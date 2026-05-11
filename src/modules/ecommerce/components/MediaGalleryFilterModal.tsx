import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { MediaGalleryFilters } from "../types/MediaGallery.types";

interface MediaGalleryFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MediaGalleryFilters;
  onApply: (filters: MediaGalleryFilters) => void;
}

const MediaGalleryFilterModal = ({
  open,
  onOpenChange,
  filters,
  onApply,
}: MediaGalleryFilterModalProps) => {
  const [internalFilters, setInternalFilters] = useState<MediaGalleryFilters>(filters);

  useEffect(() => {
    if (open) setInternalFilters(filters);
  }, [open]);

  const handleApply = () => {
    onApply(internalFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setInternalFilters((prev) => ({
      ...prev,
      startDate: null,
      endDate: null,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={internalFilters.startDate ?? ""}
              onChange={(e) =>
                setInternalFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value || null,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de fin</Label>
            <Input
              id="endDate"
              type="date"
              value={internalFilters.endDate ?? ""}
              onChange={(e) =>
                setInternalFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value || null,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaGalleryFilterModal;
