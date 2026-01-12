import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoriesFilters } from '../../types/Categories.type';

interface CategoriesFilterModalProps {
  open: boolean;
  filters: CategoriesFilters;
  minProductsRange: number;
  maxProductsRange: number;
  onClose: () => void;
  onFiltersChange: (updates: Partial<CategoriesFilters>) => void;
  onApply: () => void;
  onClear: () => void;
}

const booleanOptions = [
  { value: 'null', label: 'Todos' },
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
];

export const CategoriesFilterModal = ({
  open,
  filters,
  minProductsRange,
  maxProductsRange,
  onClose,
  onFiltersChange,
  onApply,
  onClear,
}: CategoriesFilterModalProps) => {
  const getBooleanValue = (value: boolean | null): string => {
    if (value === null) return 'null';
    return value ? 'true' : 'false';
  };

  const parseBooleanValue = (value: string): boolean | null => {
    if (value === 'null') return null;
    return value === 'true';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Categorías</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Products range */}
          <div className="space-y-2">
            <Label>Rango de productos ({minProductsRange} - {maxProductsRange})</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Mín"
                  min={0}
                  value={filters.minProducts ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      minProducts: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Máx"
                  min={0}
                  value={filters.maxProducts ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      maxProducts: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Has Description */}
          <div className="space-y-2">
            <Label>Tiene descripción</Label>
            <Select
              value={getBooleanValue(filters.hasDescription)}
              onValueChange={(value) =>
                onFiltersChange({ hasDescription: parseBooleanValue(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {booleanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Has Image */}
          <div className="space-y-2">
            <Label>Tiene imagen</Label>
            <Select
              value={getBooleanValue(filters.hasImage)}
              onValueChange={(value) =>
                onFiltersChange({ hasImage: parseBooleanValue(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {booleanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Is Parent Category */}
          <div className="space-y-2">
            <Label>Tipo de categoría</Label>
            <Select
              value={getBooleanValue(filters.isParent)}
              onValueChange={(value) =>
                onFiltersChange({ isParent: parseBooleanValue(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Todas</SelectItem>
                <SelectItem value="true">Solo categorías padre</SelectItem>
                <SelectItem value="false">Solo subcategorías</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button onClick={onApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
