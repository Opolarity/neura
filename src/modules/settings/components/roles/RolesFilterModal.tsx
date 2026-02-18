import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RolesFilters, RolesFilterDraft } from '../../types/Roles.types';
import { useState } from 'react';

interface RolesFilterModalProps {
  filters: RolesFilters;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: RolesFilters) => void;
}

const RolesFilterModal = ({
  filters,
  isOpen,
  onClose,
  onApply,
}: RolesFilterModalProps) => {
    const [internalFilters, setInternalFilters] = useState<RolesFilterDraft>({
        minuser: filters.minuser,
        maxuser: filters.maxuser,
        is_admin: filters.is_admin,
    });

  const handleIsAdminChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      is_admin: value === "true" ? true : value === "false" ? false : null,
    }));
  };

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? parseInt(clean) : null;
  };

  const handleMinUserChange = (value: string) => {
    setInternalFilters((prev) => ({ ...prev, minuser: parsePositive(value) }));
  };

  const handleMaxUserChange = (value: string) => {
    setInternalFilters((prev) => ({ ...prev, maxuser: parsePositive(value) }));
  };

    const handleClear = () => {
        setInternalFilters({
            minuser: null,
            maxuser: null,
            is_admin: null,
        });
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="is_admin">Tipo de Rol</Label>
            <Select
              value={
                internalFilters.is_admin?.toString() == null
                  ? "none"
                  : String(internalFilters.is_admin.toString())
              }
              onValueChange={handleIsAdminChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                <SelectItem value="true">Administrador</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minuser">Min. Usuarios</Label>
              <Input
                id="minuser"
                type="number"
                placeholder="0"
                min={0}
                value={internalFilters.minuser || ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={(e) => handleMinUserChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxuser">Max. Usuarios</Label>
              <Input
                id="maxuser"
                type="number"
                placeholder="100"
                min={0}
                value={internalFilters.maxuser || ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={(e) => handleMaxUserChange(e.target.value)}
              />
            </div>
          </div>
        </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                    <Button onClick={() => onApply({ ...filters, ...internalFilters, page: 1 })}>
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RolesFilterModal;
