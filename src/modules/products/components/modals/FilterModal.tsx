import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ProductFilters } from "../../products.types";
import { getCategories } from "../../services/products.service";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: ProductFilters) => void;
    onClear: () => void;
    initialFilters: ProductFilters;
}

const FilterModal = ({
    isOpen,
    onClose,
    onApply,
    onClear,
    initialFilters,
}: FilterModalProps) => {
    const [localFilters, setLocalFilters] =
        useState<ProductFilters>(initialFilters);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>(
        []
    );

    useEffect(() => {
        setLocalFilters(initialFilters);
    }, [initialFilters, isOpen]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (field: keyof ProductFilters, value: any) => {
        setLocalFilters((prev) => ({
            ...prev,
            [field]: value === "" || value === "none" ? undefined : value,
        }));
    };

    const handleApply = () => {
        onApply(localFilters);
    };

    const handleClear = () => {
        setLocalFilters({});
        onClear();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filtrar Productos</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Categoría
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={String(localFilters.category || "none")}
                                onValueChange={(value) =>
                                    handleChange("category", value === "none" ? undefined : Number(value))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las categorías" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Todas las categorías</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="min_price" className="text-right">
                            Precio Min
                        </Label>
                        <Input
                            id="min_price"
                            type="number"
                            value={localFilters.minprice || ""}
                            onChange={(e) =>
                                handleChange("minprice", e.target.value === "" ? undefined : Number(e.target.value))
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="max_price" className="text-right">
                            Precio Max
                        </Label>
                        <Input
                            id="max_price"
                            type="number"
                            value={localFilters.maxprice || ""}
                            onChange={(e) =>
                                handleChange("maxprice", e.target.value === "" ? undefined : Number(e.target.value))
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minstock" className="text-right">
                            Stock Min
                        </Label>
                        <Input
                            id="minstock"
                            type="number"
                            value={localFilters.minstock || ""}
                            onChange={(e) =>
                                handleChange("minstock", e.target.value === "" ? undefined : Number(e.target.value))
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxstock" className="text-right">
                            Stock Max
                        </Label>
                        <Input
                            id="maxstock"
                            type="number"
                            value={localFilters.maxstock || ""}
                            onChange={(e) =>
                                handleChange("maxstock", e.target.value === "" ? undefined : Number(e.target.value))
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Estado</Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <Switch
                                checked={localFilters.status || false}
                                onCheckedChange={(checked) => handleChange("status", checked)}
                            />
                            <Label>{localFilters.status ? "Activo" : "Inactivo"}</Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Web</Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <Switch
                                checked={localFilters.web || false}
                                onCheckedChange={(checked) => handleChange("web", checked)}
                            />
                            <Label>{localFilters.web ? "Visible" : "Oculto"}</Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="order" className="text-right">
                            Ordenar por
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={localFilters.order || "none"}
                                onValueChange={(value) =>
                                    handleChange("order", value === "none" ? undefined : value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar orden" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin orden específico</SelectItem>
                                    <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
                                    <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
                                    <SelectItem value="pri-asc">Precio más bajo</SelectItem>
                                    <SelectItem value="pri-dec">Precio más alto</SelectItem>
                                    <SelectItem value="sto-asc">Stock más bajo</SelectItem>
                                    <SelectItem value="sto-dsc">Stock más alto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar Filtros
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApply}>Aplicar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FilterModal;
