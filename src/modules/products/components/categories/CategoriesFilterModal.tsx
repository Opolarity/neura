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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { CategoryFilters } from "../../types/Categories.types";

interface CategoriesFilterModalProps {
    filters: CategoryFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: CategoryFilters) => void;
}

const CategoriesFilterModal = ({
    filters,
    isOpen,
    onClose,
    onApply,
}: CategoriesFilterModalProps) => {
    const [internalFilters, setInternalFilters] =
        useState<CategoryFilters>(filters);

    useEffect(() => {
        if (isOpen) {
            setInternalFilters(filters);
        }
    }, [isOpen, filters]);

    const handleDescriptionChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            description: value === "none" ? null : value === "true",
        }));
    };

    const handleMinProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, minproducts: value }));
    };

    const handleMaxProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, maxproducts: value }));
    };

    const handleParentCategoryChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            parentcategory: value === "none" ? null : value === "true",
        }));
    };

    const handleImageChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            image: value === "none" ? null : value === "true",
        }));
    };

    const handleClear = () => {
        setInternalFilters({
            page: 1,
            size: filters.size,
            search: null,
            minproducts: null,
            maxproducts: null,
            description: null,
            parentcategory: null,
            image: null,
            order: null,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Categoría</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Descripción</Label>
                        <div className="flex gap-2">
                            <Select
                                value={
                                    internalFilters.description == null
                                        ? "none"
                                        : String(internalFilters.description)
                                }
                                onValueChange={handleDescriptionChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin especificar</SelectItem>
                                    <SelectItem value="true">Con descripción</SelectItem>
                                    <SelectItem value="false">Sin descripción</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Productos</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Mínimo"
                                value={internalFilters.minproducts ?? ""}
                                onChange={handleMinProductsChange}
                            />
                            <Input
                                type="number"
                                placeholder="Máximo"
                                value={internalFilters.maxproducts ?? ""}
                                onChange={handleMaxProductsChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Categoría padre</Label>
                        <div className="flex gap-2">
                            <Select
                                value={
                                    internalFilters.parentcategory == null
                                        ? "none"
                                        : String(internalFilters.parentcategory)
                                }
                                onValueChange={handleParentCategoryChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin especificar</SelectItem>
                                    <SelectItem value="true">Con Cat. Padre</SelectItem>
                                    <SelectItem value="false">Sin Cat. Padre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Imagen</Label>
                        <div className="flex gap-2">
                            <Select
                                value={
                                    internalFilters.image == null
                                        ? "none"
                                        : String(internalFilters.image)
                                }
                                onValueChange={handleImageChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin especificar</SelectItem>
                                    <SelectItem value="true">Con imagen</SelectItem>
                                    <SelectItem value="false">Sin imagen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                    <Button onClick={() => onApply && onApply(internalFilters)}>
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CategoriesFilterModal;
