import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
        web: null,
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

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            setOptionsLoading(true);
            try {
                // Fetch independently to allow partial success
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

    // Fetch details if isEdit
    useEffect(() => {
        if (isEdit && warehouseId) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const response = await GetWarehousesDetails(warehouseId);

                    if (response.warehouse) {
                        const warehouse = response.warehouse;
                        const countryId = Number(warehouse.countries);
                        const stateId = Number(warehouse.states);
                        const cityId = Number(warehouse.cities);
                        const neighborhoodId = Number(warehouse.neighborhoods);

                        // PRIMERO cargar todas las opciones en cascada
                        const statesData = await StateApi(countryId);
                        setStates(statesData || []);

                        const citiesData = await CityApi(countryId, stateId);
                        setCities(citiesData || []);

                        const neighborhoodsData = neighborhoodId
                            ? await NeighborhoodApi(countryId, stateId, cityId)
                            : [];
                        setNeighborhoods(neighborhoodsData || []);

                        const initialFormData = {
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

    const handleSelectChange = async (field: string, value: string) => {
        const numericFields = ['branches', 'countries', 'states', 'cities', 'neighborhoods'];
        const parsedValue = numericFields.includes(field) ? parseInt(value) : value;
        const numericValue = typeof parsedValue === 'number' ? parsedValue : 0;

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

            try {
                const statesData = await StateApi(numericValue);
                setStates(statesData || []);
            } catch (error) { console.error(error); }

        } else if (field === 'states') {
            setFormData(prev => ({
                ...prev,
                states: numericValue,
                cities: null,
                neighborhoods: null
            }));
            setCities([]);
            setNeighborhoods([]);

            // Load cities
            if (formData.countries) {
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

            // Load neighborhoods
            if (formData.countries && formData.states) {
                try {
                    const neighborhoodsData = await NeighborhoodApi(formData.countries, formData.states, numericValue);
                    setNeighborhoods(neighborhoodsData || []);
                } catch (error) { console.error(error); }
            }
        } else {
            // Normal update
            setFormData(prev => ({ ...prev, [field]: parsedValue }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation: !name || !countryID || !stateID || !cityID || !neighborhoodsID
            if (!formData.name || !formData.countries || !formData.states || !formData.cities || !formData.neighborhoods) {
                toast({
                    title: "Campos requeridos",
                    description: "Por favor complete todos los campos obligatorios: nombre, país, estado, ciudad y vecindario",
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
