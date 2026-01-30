import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/shared/hooks";
import {
    CreateWarehouses,
    UpdateWarehouses,
    CounrtyApi,
    StateApi,
    CityApi,
    NeighborhoodApi,
    GetWarehousesDetails
} from '../services/Warehouses.services';
import { Warehouses, IdModalResponse } from '../types/Warehouses.types';

interface FormData {
    name: string;
    countries: number | null;
    states: number | null;
    cities: number | null;
    neighborhoods: number | null;
    address: string;
    address_reference: string;
    web: boolean;
}

const useCreateWarehouse = (warehouseId?: number | null, isEdit?: boolean) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Loading states
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [countries, setCountries] = useState<IdModalResponse[]>([]);
    const [states, setStates] = useState<IdModalResponse[]>([]);
    const [cities, setCities] = useState<IdModalResponse[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<IdModalResponse[]>([]);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        countries: null,
        states: null,
        cities: null,
        neighborhoods: null,
        address: '',
        address_reference: '',
        web: false,
    });
    const [initialData, setInitialData] = useState<FormData | null>(null);

    const hasChanges = () => {
        if (!initialData) return false;
        return (
            formData.name !== initialData.name ||
            Number(formData.countries) !== Number(initialData.countries) ||
            Number(formData.states) !== Number(initialData.states) ||
            Number(formData.cities) !== Number(initialData.cities) ||
            Number(formData.neighborhoods) !== Number(initialData.neighborhoods) ||
            formData.address !== initialData.address ||
            formData.address_reference !== initialData.address_reference ||
            formData.web !== initialData.web
        );
    };

    // 1. Cargar opciones iniciales (Países)
    useEffect(() => {
        const fetchOptions = async () => {
            setOptionsLoading(true);
            try {
                const [cRes] = await Promise.allSettled([
                    CounrtyApi()
                ]);

                if (cRes.status === 'fulfilled') {
                    setCountries(cRes.value || []);
                } else {
                    console.error('Failed to load countries:', cRes.reason);
                }

            } catch (error) {
                console.error('Error fetching options:', error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las opciones del formulario",
                    variant: "destructive",
                });
            } finally {
                setOptionsLoading(false);
            }
        };

        fetchOptions();
    }, []);

    // 2. Cargar detalles si es Edición
    useEffect(() => {
        if (isEdit && warehouseId) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const response = await GetWarehousesDetails(warehouseId);

                    if (response.warehouse) {
                        const warehouse = response.warehouse;

                        // Parseo seguro de IDs (evita NaN)
                        const countryId = warehouse.countries ? Number(warehouse.countries) : null;
                        const stateId = warehouse.states ? Number(warehouse.states) : null;
                        const cityId = warehouse.cities ? Number(warehouse.cities) : null;

                        // OJO: Si warehouse.neighborhoods viene null, asignamos null, no NaN ni 0.
                        const rawNeigh = warehouse.neighborhoods;
                        const neighborhoodId = (rawNeigh && !isNaN(Number(rawNeigh))) ? Number(rawNeigh) : null;

                        // --- CARGA EN CASCADA ---
                        // Cargamos las listas basándonos en los padres, no en si el hijo tiene valor.

                        if (countryId) {
                            const statesData = await StateApi(countryId);
                            setStates(statesData || []);
                        }

                        if (countryId && stateId) {
                            const citiesData = await CityApi(countryId, stateId);
                            setCities(citiesData || []);
                        }

                        // CORRECCIÓN CRÍTICA: Cargamos barrios si existe cityId, no solo si existe neighborhoodId
                        if (countryId && stateId && cityId) {
                            const neighborhoodsData = await NeighborhoodApi(countryId, stateId, cityId);
                            setNeighborhoods(neighborhoodsData || []);
                        }

                        const initialFormData: FormData = {
                            name: warehouse.name || "",
                            countries: countryId,
                            states: stateId,
                            cities: cityId,
                            neighborhoods: neighborhoodId,
                            address: warehouse.address || "",
                            address_reference: warehouse.address_reference || "",
                            web: warehouse.web || false,
                        };

                        setFormData(initialFormData);
                        setInitialData(initialFormData);
                    }
                } catch (error) {
                    console.error('Error fetching warehouse details:', error);
                    toast({
                        title: "Error",
                        description: "No se pudieron cargar los detalles del almacén",
                        variant: "destructive",
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        }
    }, [warehouseId, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, web: checked }));
    }

    // 3. Manejo de cambios en Selects (Blindado contra NaN)
    const handleSelectChange = async (field: string, value: string) => {
        const numericFields = ['branches', 'countries', 'states', 'cities', 'neighborhoods'];

        let numericValue: number | null = null;

        // Parseo seguro
        if (numericFields.includes(field)) {
            if (!value || value === "") {
                numericValue = null;
            } else {
                const parsed = Number(value);
                numericValue = isNaN(parsed) ? null : parsed;
            }
        }

        const finalValue = numericFields.includes(field) ? numericValue : value;

        // Lógica de Cascada
        if (field === 'countries') {
            setFormData(prev => ({
                ...prev,
                countries: numericValue,
                states: null,
                cities: null,
                neighborhoods: null
            }));
            setStates([]);
            setCities([]);
            setNeighborhoods([]);

            if (numericValue) {
                try {
                    const statesData = await StateApi(numericValue);
                    setStates(statesData || []);
                } catch (error) { console.error(error); }
            }

        } else if (field === 'states') {
            setFormData(prev => ({
                ...prev,
                states: numericValue,
                cities: null,
                neighborhoods: null
            }));
            setCities([]);
            setNeighborhoods([]);

            if (formData.countries && numericValue) {
                try {
                    const citiesData = await CityApi(formData.countries, numericValue);
                    setCities(citiesData || []);
                } catch (error) { console.error(error); }
            }

        } else if (field === 'cities') {
            setFormData(prev => ({
                ...prev,
                cities: numericValue,
                neighborhoods: null
            }));
            setNeighborhoods([]);

            // Al cambiar ciudad, cargamos los barrios
            if (formData.countries && formData.states && numericValue) {
                try {
                    const neighborhoodsData = await NeighborhoodApi(formData.countries, formData.states, numericValue);
                    setNeighborhoods(neighborhoodsData || []);
                } catch (error) { console.error(error); }
            }
        } else {
            // Cambio normal (ej: neighborhoods)
            setFormData(prev => ({ ...prev, [field]: finalValue }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validación
            if (!formData.name || !formData.countries || !formData.states || !formData.cities || !formData.neighborhoods) {
                toast({
                    title: "Campos requeridos",
                    description: "Por favor complete todos los campos obligatorios: nombre, país, estado, ciudad y distrito",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const payload: Warehouses = {
                id: warehouseId || 0,
                name: formData.name,
                countries: formData.countries!,
                states: formData.states || 0,
                cities: formData.cities,
                neighborhoods: formData.neighborhoods,
                address: formData.address,
                address_reference: formData.address_reference,
                web: formData.web,
            };

            if (isEdit && warehouseId) {
                await UpdateWarehouses(payload);
                toast({
                    title: "Éxito",
                    description: "Almacén actualizado correctamente",
                });
            } else {
                await CreateWarehouses(payload);
                toast({
                    title: "Éxito",
                    description: "Almacén creado correctamente",
                });
            }
            navigate('/settings/warehouses');
        } catch (error: any) {
            console.error('Error saving warehouse:', error);
            toast({
                title: "Error",
                description: error.message || "No se pudo guardar el almacén",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        loading,
        optionsLoading,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSwitchChange,
        handleSelectChange,
        handleSubmit,
        hasChanges: hasChanges()
    };
};

export default useCreateWarehouse;