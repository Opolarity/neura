import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/shared/hooks";
import {
    CreateWarehouses,
    UpdateWarehouses,
    CounrtyApi,
    StateApi,
    CityApi,
    NeighborhoodApi
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

    // Options state
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

    // Load states when country changes
    useEffect(() => {
        const loadStates = async () => {
            if (formData.countries) {
                try {
                    const statesData = await StateApi(formData.countries);
                    setStates(statesData || []);
                    // Reset dependent fields
                    setFormData(prev => ({ ...prev, states: null, cities: null, neighborhoods: null }));
                    setCities([]);
                    setNeighborhoods([]);
                } catch (error) {
                    console.error('Error loading states:', error);
                }
            }
        };

        if (!optionsLoading) {
            loadStates();
        }
    }, [formData.countries]);

    // Load cities when state changes
    useEffect(() => {
        const loadCities = async () => {
            if (formData.states && formData.countries) {
                try {
                    const citiesData = await CityApi(formData.countries, formData.states);
                    setCities(citiesData || []);
                    // Reset dependent fields
                    setFormData(prev => ({ ...prev, cities: null, neighborhoods: null }));
                    setNeighborhoods([]);
                } catch (error) {
                    console.error('Error loading cities:', error);
                }
            }
        };

        if (!optionsLoading) {
            loadCities();
        }
    }, [formData.states]);

    // Load neighborhoods when city changes
    useEffect(() => {
        const loadNeighborhoods = async () => {
            if (formData.cities && formData.countries && formData.states) {
                try {
                    const neighborhoodsData = await NeighborhoodApi(formData.countries, formData.states, formData.cities);
                    setNeighborhoods(neighborhoodsData || []);
                    setFormData(prev => ({ ...prev, neighborhoods: null }));
                } catch (error) {
                    console.error('Error loading neighborhoods:', error);
                }
            }
        };

        if (!optionsLoading) {
            loadNeighborhoods();
        }
    }, [formData.cities]);


    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, web: checked }));
    }

    const handleSelectChange = (field: string, value: string) => {
        const numericFields = ['branches', 'countries', 'states', 'cities', 'neighborhoods'];
        const parsedValue = numericFields.includes(field) ? parseInt(value) : value;
        setFormData(prev => ({ ...prev, [field]: parsedValue }));
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
    };
};

export default useCreateWarehouse;
