import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/shared/hooks";
import {
    CreateBranch,
    UpdateBranch,
    WarehousesAPI,
    CountryApi,
    StateApi,
    CityApi,
    NeighborhoodApi
} from '../services/Branches.services';
import { Branch, IdNameResponse } from '../types/Branches.types';

interface FormData {
    name: string;
    warehouse: number | null;
    countries: number | null;
    states: number | null;
    cities: number | null;
    neighborhoods: number | null;
    address: string;
    address_reference: string;
}

const useCreateBranch = (branchId?: number | null, isEdit?: boolean) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Loading states
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);

    // Options state
    const [warehouses, setWarehouses] = useState<IdNameResponse[]>([]);
    const [countries, setCountries] = useState<IdNameResponse[]>([]);
    const [states, setStates] = useState<IdNameResponse[]>([]);
    const [cities, setCities] = useState<IdNameResponse[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<IdNameResponse[]>([]);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        warehouse: null,
        countries: null,
        states: null,
        cities: null,
        neighborhoods: null,
        address: '',
        address_reference: '',
    });

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            setOptionsLoading(true);
            try {
                // Fetch independently to allow partial success
                const [wRes, cRes] = await Promise.allSettled([
                    WarehousesAPI(),
                    CountryApi()
                ]);

                if (wRes.status === 'fulfilled') {
                    setWarehouses(wRes.value || []);
                } else {
                    console.error('Failed to load warehouses:', wRes.reason);
                }

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

    const handleSelectChange = (field: string, value: string) => {
        const numericFields = ['warehouse', 'countries', 'states', 'cities', 'neighborhoods'];
        const parsedValue = numericFields.includes(field) ? parseInt(value) : value;
        setFormData(prev => ({ ...prev, [field]: parsedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation: !name || !warehouseID || !countryID || !stateID || !cityID || !neighborhoodsID
            if (!formData.name || !formData.warehouse || !formData.countries || !formData.states || !formData.cities || !formData.neighborhoods) {
                toast({
                    title: "Campos requeridos",
                    description: "Por favor complete todos los campos obligatorios: nombre, almacén, país, estado, ciudad y vecindario",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const payload: Branch = {
                id: branchId || 0,
                name: formData.name,
                warehouse: Number(formData.warehouse),
                countries: Number(formData.countries!),
                states: Number(formData.states!),
                cities: Number(formData.cities!),
                neighborhoods: Number(formData.neighborhoods),
                address: formData.address,
                address_reference: formData.address_reference,
            };

            console.log("=== Submitting branch payload ===", JSON.stringify(payload, null, 2));

            if (isEdit && branchId) {
                await UpdateBranch(payload);
                toast({
                    title: "Éxito",
                    description: "Sucursal actualizada correctamente",
                });
            } else {
                await CreateBranch(payload);
                toast({
                    title: "Éxito",
                    description: "Sucursal creada correctamente",
                });
            }
            navigate('/settings/branches');
        } catch (error: any) {
            console.error('Error saving branch:', error);
            toast({
                title: "Error",
                description: error.message || "No se pudo guardar la sucursal",
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
        warehouses,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSelectChange,
        handleSubmit,
    };
};

export default useCreateBranch;
