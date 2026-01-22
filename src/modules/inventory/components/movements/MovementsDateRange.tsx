import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { MovementsFilters } from '../../types/Movements.types';

interface MovementsDateRangeProps {
    filters: MovementsFilters;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
}

const MovementsDateRange = ({ filters, onStartDateChange, onEndDateChange }: MovementsDateRangeProps) => {
    // Fecha actual (hoy)
    const hoy = new Date().toISOString().split("T")[0];
    // Calcula la fecha mínima (180 días atrás desde la fecha de inicio)
    const calcularMinFechaFin = (inicio: string) => {
        const date = new Date(inicio);
        date.setDate(date.getDate() - 180);
        return date.toISOString().split("T")[0];
    };

    return (
        <div className='flex flex-row gap-2'>
            <div className='flex-1 flex flex-col gap-2'>
                <Label className="text-sm font-medium">Fecha Inicio</Label>
                <div className="relative space-y-2">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="date"
                        placeholder="Fecha inicio"
                        className="w-full pl-9 cursor-pointer"
                        value={filters.start_date ?? ""}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        max={hoy}
                    />
                </div>
            </div>

            <div className='flex-1 flex flex-col gap-2'>
                <Label className="text-sm font-medium">Fecha Fin</Label>
                <div className="relative space-y-2">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="date"
                        placeholder="Fecha fin"
                        value={filters.end_date ?? ""}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="w-full pl-9 cursor-pointer"
                        disabled={!filters.start_date}
                        min={filters.start_date ? calcularMinFechaFin(filters.start_date) : ""}
                        max={filters.start_date || ""}
                    />
                </div>
            </div>
        </div>
    )
}

export default MovementsDateRange