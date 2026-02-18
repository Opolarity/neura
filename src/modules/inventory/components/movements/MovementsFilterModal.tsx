import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { MovementsFilters } from '../../types/Movements.types';
import { useState } from 'react';
import MovementsDateRange from './MovementsDateRange';
import { SimpleWarehouses, MovementsTypes, SimpleUsers } from '../../types/Movements.types';

interface InventoryFilterModalProps {
    filters: MovementsFilters;
    warehouses: SimpleWarehouses[];
    users: SimpleUsers[];
    movementsTypes: MovementsTypes[];
    isOpen: boolean;
    onClose: () => void;
    onApply?: (filters: MovementsFilters) => void;
}

const MovementsFilterModal = ({
    filters,
    warehouses,
    users,
    movementsTypes,
    isOpen,
    onClose,
    onApply,
}: InventoryFilterModalProps) => {
    const [internalFilters, setInternalFilters] =
        useState<MovementsFilters>(filters);

    const calculateMinimumEndDate = (start_date: string) => {
        const date = new Date(start_date);
        date.setDate(date.getDate() - 180);
        return date.toISOString().split("T")[0];
    };

    const handleStartDateChange = (value: string) => {
        setInternalFilters((prev) => {
            const startDate = value || null;
            const endDate = prev.end_date;

            const isEndDateInvalid =
                endDate &&
                (
                    new Date(endDate) > new Date(value) ||
                    new Date(endDate) < new Date(calculateMinimumEndDate(value))
                );

            return {
                ...prev,
                start_date: startDate,
                end_date: isEndDateInvalid ? "" : endDate,
            };
        });
    };

    const handleEndDateChange = (value: string) => {
        const dateValue = value || null;
        setInternalFilters((prev) => ({ ...prev, end_date: dateValue }))
    };

    const handleWarehouseChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            warehouse: value ? Number(value) : null,
        }));
    };

    const handleOriginChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            origin: value ? Number(value) : null,
        }));
    };

    const handleUserChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            user: value ? Number(value) : null,
        }));
    };

    const handleInOutChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            in_out: value === "true" ? true : value === "false" ? false : null,
        }));
    };

    const handleClear = () => {
        setInternalFilters((prev) => (
            {
                ...prev,
                warehouse: null,
                origin: null,
                start_date: null,
                end_date: null,
                in_out: null,
                page: 1,
                size: prev.size,
                search: null,
                user: null,

            }
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Movimientos</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <MovementsDateRange
                        filters={internalFilters}
                        onStartDateChange={handleStartDateChange}
                        onEndDateChange={handleEndDateChange}
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="warehouse">Almacén</Label>
                        <Select
                            value={
                                internalFilters.warehouse?.toString() == null
                                    ? "none"
                                    : String(internalFilters.warehouse.toString())
                            }
                            onValueChange={(value) => handleWarehouseChange(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar almacén" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                        {warehouse.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Origen</Label>
                        <Select
                            value={
                                internalFilters.origin?.toString() == null
                                    ? "none"
                                    : String(internalFilters.origin.toString())
                            }
                            onValueChange={(value) => handleOriginChange(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar origen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {movementsTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user">Usuario</Label>
                        <Select
                            value={
                                internalFilters.user?.toString() == null
                                    ? "none"
                                    : String(internalFilters.user.toString())
                            }
                            onValueChange={(value) => handleUserChange(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label htmlFor="in_out">Movimiento</Label>
                        <Select
                            value={
                                internalFilters.in_out?.toString() == null
                                    ? "none"
                                    : String(internalFilters.in_out.toString())
                            }
                            onValueChange={(value) => handleInOutChange(value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar movimiento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ambos</SelectItem>
                                <SelectItem value="true">Ingreso</SelectItem>
                                <SelectItem value="false">Egreso</SelectItem>
                            </SelectContent>
                        </Select>
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
    )
}

export default MovementsFilterModal