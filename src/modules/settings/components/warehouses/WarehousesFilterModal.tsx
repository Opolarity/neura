import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { WarehousesFilters, IdModalResponse } from '../../types/Warehouses.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BranchesAPI, CounrtyApi, StateApi, CityApi, NeighborhoodApi } from '../../services/Warehouses.services'


interface WarehousesFilterModalProps {
    filters: WarehousesFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply?: (filters: WarehousesFilters) => void;
}

const WarehousesFilterModal = ({
    filters,
    isOpen,
    onClose,
    onApply,
}: WarehousesFilterModalProps) => {
    const [internalFilters, setInternalFilters] = useState<WarehousesFilters>(filters);
    const [branches, setBranches] = useState<IdModalResponse[]>([]);
    const [countries, setCountries] = useState<IdModalResponse[]>([]);
    const [states, setStates] = useState<IdModalResponse[]>([]);
    const [cities, setCities] = useState<IdModalResponse[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<IdModalResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (isOpen) {
                setLoading(true);
                try {
                    const [branchesData, countriesData] = await Promise.all([
                        BranchesAPI(),
                        CounrtyApi(),
                    ]);
                    setBranches(branchesData);
                    setCountries(countriesData);
                } catch (error) {
                    console.error('Error loading filter data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [isOpen]);

    const handleChange = (field: keyof WarehousesFilters, value: string) => {
        setInternalFilters((prev) => ({
            ...prev,
            [field]: value ? (field === 'search' ? value : parseInt(value)) : null,
        }));
    };

    const handleClear = () => {
        setInternalFilters({
            country: null,
            state: null,
            city: null,
            neighborhoods: null,
            branches: null,
            search: null,
            page: 1,
            size: filters.size || 20,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Almacenes</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Sucursales</Label>
                        <Select
                            value={internalFilters.branches?.toString()}
                            onValueChange={(value) => handleChange('branches', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sucursal" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>País</Label>
                            <Select
                                value={internalFilters.country?.toString()}
                                onValueChange={(value) => handleChange('country', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar país" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.id} value={country.id.toString()}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Estado</Label>
                            <Select
                                value={internalFilters.state?.toString()}
                                onValueChange={(value) => handleChange('state', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {states.map((state) => (
                                        <SelectItem key={state.id} value={state.id.toString()}>
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Ciudad</Label>
                            <Select
                                value={internalFilters.city?.toString()}
                                onValueChange={(value) => handleChange('city', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar ciudad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city.id} value={city.id.toString()}>
                                            {city.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Distrito</Label>
                            <Select
                                value={internalFilters.neighborhoods?.toString()}
                                onValueChange={(value) => handleChange('neighborhoods', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar barrio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {neighborhoods.map((neighborhood) => (
                                        <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                                            {neighborhood.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                    <Button onClick={() => onApply?.(internalFilters)}>
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default WarehousesFilterModal;