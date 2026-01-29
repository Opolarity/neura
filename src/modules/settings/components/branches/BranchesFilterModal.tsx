import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BranchesFilters, IdNameResponse } from '../../types/Branches.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WarehousesAPI, CountryApi, StateApi, CityApi, NeighborhoodApi } from '../../services/Branches.services'

interface BranchesFilterModalProps {
    filters: BranchesFilters;
    isOpen: boolean;
    onClose: () => void;
    onApply?: (filters: BranchesFilters) => void;
}

const BranchesFilterModal = ({
    filters,
    isOpen,
    onClose,
    onApply,
}: BranchesFilterModalProps) => {
    const [internalFilters, setInternalFilters] = useState<BranchesFilters>(filters);
    const [warehouses, setWarehouses] = useState<IdNameResponse[]>([]);
    const [countries, setCountries] = useState<IdNameResponse[]>([]);
    const [states, setStates] = useState<IdNameResponse[]>([]);
    const [cities, setCities] = useState<IdNameResponse[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<IdNameResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (isOpen) {
                setLoading(true);
                try {
                    const [warehousesData, countriesData] = await Promise.all([
                        WarehousesAPI(),
                        CountryApi(),
                    ]);
                    setWarehouses(warehousesData);
                    setCountries(countriesData);

                    // If country is selected, load states
                    if (internalFilters.country) {
                        const statesData = await StateApi(internalFilters.country);
                        setStates(statesData);
                    }
                    // If state is selected, load cities
                    if (internalFilters.country && internalFilters.state) {
                        const citiesData = await CityApi(internalFilters.country, internalFilters.state);
                        setCities(citiesData);
                    }
                    // If city is selected, load neighborhoods
                    if (internalFilters.country && internalFilters.state && internalFilters.city) {
                        const neighborhoodsData = await NeighborhoodApi(internalFilters.country, internalFilters.state, internalFilters.city);
                        setNeighborhoods(neighborhoodsData);
                    }

                } catch (error) {
                    console.error('Error loading filter data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [isOpen]);

    // Load dependent data when selections change
    useEffect(() => {
        const loadStates = async () => {
            if (internalFilters.country) {
                try {
                    const statesData = await StateApi(internalFilters.country);
                    setStates(statesData || []);
                } catch (error) {
                    console.error('Error loading states:', error);
                }
            } else {
                setStates([]);
                setCities([]);
                setNeighborhoods([]);
            }
        };
        loadStates();
    }, [internalFilters.country]);

    useEffect(() => {
        const loadCities = async () => {
            if (internalFilters.state && internalFilters.country) {
                try {
                    const citiesData = await CityApi(internalFilters.country, internalFilters.state);
                    setCities(citiesData || []);
                } catch (error) {
                    console.error('Error loading cities:', error);
                }
            } else {
                setCities([]);
                setNeighborhoods([]);
            }
        };
        loadCities();
    }, [internalFilters.state]);

    useEffect(() => {
        const loadNeighborhoods = async () => {
            if (internalFilters.city && internalFilters.country && internalFilters.state) {
                try {
                    const neighborhoodsData = await NeighborhoodApi(internalFilters.country, internalFilters.state, internalFilters.city);
                    setNeighborhoods(neighborhoodsData || []);
                } catch (error) {
                    console.error('Error loading neighborhoods:', error);
                }
            } else {
                setNeighborhoods([]);
            }
        };
        loadNeighborhoods();
    }, [internalFilters.city]);


    const handleChange = (field: keyof BranchesFilters, value: string) => {
        const parsedValue = value ? parseInt(value) : null;
        setInternalFilters((prev) => {
            const newFilters = { ...prev, [field]: parsedValue };

            // Reset dependent fields
            if (field === 'country') {
                newFilters.state = null;
                newFilters.city = null;
                newFilters.neighborhood = null;
            } else if (field === 'state') {
                newFilters.city = null;
                newFilters.neighborhood = null;
            } else if (field === 'city') {
                newFilters.neighborhood = null;
            }

            return newFilters;
        });
    };

    const handleClear = () => {
        setInternalFilters({
            country: null,
            state: null,
            city: null,
            neighborhood: null,
            warehouse: null,
            search: null,
            page: 1,
            size: filters.size || 20,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filtrar Sucursales</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Almacén</Label>
                        <Select
                            value={internalFilters.warehouse?.toString()}
                            onValueChange={(value) => handleChange('warehouse', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar almacén" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((w) => (
                                    <SelectItem key={w.id} value={w.id.toString()}>
                                        {w.name}
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
                                disabled={!internalFilters.country}
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
                                disabled={!internalFilters.state}
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
                                value={internalFilters.neighborhood?.toString()}
                                onValueChange={(value) => handleChange('neighborhood', value)}
                                disabled={!internalFilters.city}
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
                    <Button onClick={() => { onApply?.(internalFilters); onClose(); }}>
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default BranchesFilterModal;