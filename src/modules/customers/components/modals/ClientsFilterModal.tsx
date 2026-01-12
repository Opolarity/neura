import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientsFilters } from '../../types';

interface ClientsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ClientsFilters;
  onFilterChange: <K extends keyof ClientsFilters>(key: K, value: ClientsFilters[K]) => void;
  onApply: () => void;
  onClear: () => void;
}

export const ClientsFilterModal = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
}: ClientsFilterModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Cantidad de compras */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cantidad de compras</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.minPurchases ?? ''}
                onChange={(e) => onFilterChange('minPurchases', e.target.value ? Number(e.target.value) : null)}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.maxPurchases ?? ''}
                onChange={(e) => onFilterChange('maxPurchases', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>

          {/* Monto gastado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Monto gastado</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.minAmount ?? ''}
                onChange={(e) => onFilterChange('minAmount', e.target.value ? Number(e.target.value) : null)}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.maxAmount ?? ''}
                onChange={(e) => onFilterChange('maxAmount', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>

          {/* Fecha de creación */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha de creación</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Desde"
                value={filters.dateFrom ?? ''}
                onChange={(e) => onFilterChange('dateFrom', e.target.value || null)}
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.dateTo ?? ''}
                onChange={(e) => onFilterChange('dateTo', e.target.value || null)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClear}>
            Limpiar
          </Button>
          <Button onClick={onApply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
