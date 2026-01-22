import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { MovementsFilters } from '../../types/Movements.types';
import { useState } from 'react';
import MovementsDateRange from './MovementsDateRange';

interface InventoryFilterModalProps {
    filters: MovementsFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply?: (filters: MovementsFilters) => void;
}

const MovementsFilterModal = ({
    filters,
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

    const handleClear = () => {
        setInternalFilters((prev) => (
            {
                ...prev,
                start_date: null,
                end_date: null,
                page: 1,
                size: prev.size,
                search: null,
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