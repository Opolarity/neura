import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MovementsFilters } from '../../types/Movements.types';
import { useState } from 'react';
import { DateRangeFilter, DateRangeValue } from '@/shared/components/date-range';
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

    // El rango de movimientos no puede abarcar más de 180 días.
    const MAX_RANGE_DAYS = 180;

    const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
        setInternalFilters((prev) => ({
            ...prev,
            start_date: startDate,
            end_date: endDate,
        }));
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

    // null = todos · true = culminados · false = pendientes
    const handleCompletedChange = (value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            completed: value === "true" ? true : value === "false" ? false : null,
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
                completed: null,
                page: 1,
                size: prev.size,
                search: null,
                user: null,

            }
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Filtrar Movimientos</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="completed">Estado del movimiento</Label>
                        <Select
                            value={
                                internalFilters.completed == null
                                    ? "all"
                                    : String(internalFilters.completed)
                            }
                            onValueChange={handleCompletedChange}
                        >
                            <SelectTrigger id="completed">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="true">Culminados</SelectItem>
                                <SelectItem value="false">Pendientes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DateRangeFilter
                        startDate={internalFilters.start_date ?? null}
                        endDate={internalFilters.end_date ?? null}
                        onChange={handleDateChange}
                        startLabel="Fecha Inicio"
                        endLabel="Fecha Fin"
                        maxRangeDays={MAX_RANGE_DAYS}
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
