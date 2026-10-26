import { ListFilter, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import POSListFilterModal, { type ModalFilters } from "./POSListFilterModal";
import type { POSSessionUser } from "../types/POSList.types";

interface POSListFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  users: POSSessionUser[];
  appliedModalFilters: ModalFilters;
  onApplyModalFilters: (filters: ModalFilters) => void;
  onResetModalFilters: () => void;
}

export default function POSListFilterBar({
  search,
  onSearchChange,
  users,
  appliedModalFilters,
  onApplyModalFilters,
  onResetModalFilters,
}: POSListFilterBarProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = Object.values(appliedModalFilters).some((v) => v !== "");

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            type="text"
            placeholder="Buscar sesiones..."
            className="pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-[300px]"
          />
        </div>
        <TooltipIconButton
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setOpen(true)}
          icon={<ListFilter className="w-4 h-4" />}
          label="Filtrar"
        />
      </div>

      <POSListFilterModal
        open={open}
        onOpenChange={setOpen}
        users={users}
        appliedFilters={appliedModalFilters}
        onApply={onApplyModalFilters}
        onReset={onResetModalFilters}
      />
    </>
  );
}
