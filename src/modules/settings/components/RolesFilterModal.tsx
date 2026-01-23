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

export interface RoleFilters {
    is_admin: string | null;
    minprice: number | null; // Using minprice as expected by edge function URL params
    maxprice: number | null; // Using maxprice as expected by edge function URL params
}

interface RolesFilterModalProps {
    filters: RoleFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: RoleFilters) => void;
}

const RolesFilterModal = ({
    filters,
    isOpen,
    onClose,
    onApply,
}: RolesFilterModalProps) => {
    const [internalFilters, setInternalFilters] = useState<RoleFilters>(filters);

    useEffect(() => {
        if (isOpen) {
            setInternalFilters(filters);
        }
    }, [isOpen, filters]);

    const handleIsAdminChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            is_admin: value === "none" ? null : value,
        }));
    };

    const handleMinUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, minprice: value }));
    };

    const handleMaxUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        setInternalFilters((prev) => ({ ...prev, maxprice: value }));
    };

    const handleClear = () => {
        const cleared = {
            is_admin: null,
            minprice: null,
            maxprice: null,
        };
        setInternalFilters(cleared);
        onApply(cleared);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Roles</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de Rol</Label>
                        <Select
                            value={internalFilters.is_admin || "none"}
                            onValueChange={handleIsAdminChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Todos los tipos</SelectItem>
                                <SelectItem value="true">Administrador</SelectItem>
                                <SelectItem value="false">Regular</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Cantidad de Usuarios</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Mínimo"
                                value={internalFilters.minprice ?? ""}
                                onChange={handleMinUsersChange}
                            />
                            <Input
                                type="number"
                                placeholder="Máximo"
                                value={internalFilters.maxprice ?? ""}
                                onChange={handleMaxUsersChange}
                            />
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

export default RolesFilterModal;
