import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCostsFilters } from "../../types/ProductCosts.types";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProdutCostsFilterModalProps {
    filters: ProductCostsFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: ProductCostsFilters) => void;
}

const ProdutCostsFilterModal = ({
    filters,
    isOpen,
    onClose,
    onApply,
}: ProdutCostsFilterModalProps) => {
    const [internalFilters, setInternalFilters] =
        useState<ProductCostsFilters>(filters);

    useEffect(() => {
        if (isOpen) {
            setInternalFilters(filters);
        }
    }, [isOpen, filters]);

    const handleMinCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, mincost: value }));
    };

    const handleMaxCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, maxcost: value }));
    };

    const handleCostChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            cost: value === "none" ? null : value === "true",
        }));
    };

    const handleClear = () => {
        setInternalFilters({
            page: 1,
            size: filters.size,
            search: null,
            mincost: null,
            maxcost: null,
            order: null,
            cost: null,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Costos</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Rango de Costo</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Mínimo"
                                value={internalFilters.mincost ?? ""}
                                onChange={handleMinCostChange}
                            />
                            <Input
                                type="number"
                                placeholder="Máximo"
                                value={internalFilters.maxcost ?? ""}
                                onChange={handleMaxCostChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Costos</Label>
                        <div className="flex gap-2">
                            <Select
                                value={
                                    internalFilters.cost == null
                                        ? "none"
                                        : String(internalFilters.cost)
                                }
                                onValueChange={handleCostChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas los costos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Todos los costos</SelectItem>
                                    <SelectItem value="true">Con costo</SelectItem>
                                    <SelectItem value="false">Sin costo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                    <Button onClick={() => onApply(internalFilters)}>
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProdutCostsFilterModal;
