import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar } from "lucide-react";
import { InventoryFilters } from "../../inventory.types";

interface MovementsFiltersProps {
    filters: InventoryFilters;
    onFilterChange: (filters: InventoryFilters) => void;
}

export const MovementsFilters: React.FC<MovementsFiltersProps> = ({
    filters,
    onFilterChange,
}) => {
    const handleClear = () => {
        onFilterChange({
            search: "",
            startDate: "",
            endDate: "",
        });
    };

    const hasActiveFilters = filters.search || filters.startDate || filters.endDate;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por producto o SKU..."
                        value={filters.search}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        placeholder="Fecha inicio"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                        className="pl-9"
                    />
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        placeholder="Fecha fin"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                        className="pl-9"
                    />
                </div>
            </div>

            {hasActiveFilters && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                >
                    Limpiar filtros
                </Button>
            )}
        </div>
    );
};
