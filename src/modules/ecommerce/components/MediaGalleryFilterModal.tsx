import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, DateRangeValue } from "@/shared/components/date-range";
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

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
    setInternalFilters((prev) => ({ ...prev, startDate, endDate }));
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DateRangeFilter
            startDate={internalFilters.startDate ?? null}
            endDate={internalFilters.endDate ?? null}
            onChange={handleDateChange}
            startLabel="Fecha de inicio"
            endLabel="Fecha de fin"
          />
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
