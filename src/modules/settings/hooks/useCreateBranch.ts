import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import {
    CreateBranch,
    UpdateBranch,
    WarehousesAPI,
    CountryApi,
    StateApi,
    CityApi,
    NeighborhoodApi,
    GetBranchDetails
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

    const [loading, setLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const [warehouses, setWarehouses] = useState<IdNameResponse[]>([]);
    const [countries, setCountries] = useState<IdNameResponse[]>([]);
    const [states, setStates] = useState<IdNameResponse[]>([]);
    const [cities, setCities] = useState<IdNameResponse[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<IdNameResponse[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '', warehouse: null, countries: null, states: null, cities: null, neighborhoods: null, address: '', address_reference: '',
    });

    const [initialData, setInitialData] = useState<FormData | null>(null);

    const hasChanges = useCallback(() => {
        if (!initialData) return true;
        return JSON.stringify(formData) !== JSON.stringify(initialData);
    }, [formData, initialData]);

    // Effect for loading base options (warehouses, countries)
    useEffect(() => {
        const fetchBaseOptions = async () => {
            try {
                const [warehousesRes, countriesRes] = await Promise.all([
                    WarehousesAPI(),
                    CountryApi()
                ]);
                setWarehouses(warehousesRes || []);
                setCountries(countriesRes || []);
            } catch (error) {
                console.error("Error loading base options:", error);
                toast({ title: "Error", description: "No se pudieron cargar las opciones del formulario", variant: "destructive" });
            }
        };
        fetchBaseOptions();
    }, [toast]);

    // Effect for loading branch details in edit mode
    useEffect(() => {
        const fetchBranchDetails = async () => {
            if (isEdit && branchId) {
                setIsInitializing(true);
                try {
                    const response = await GetBranchDetails(branchId);
                    if (response.branch) {
                        const b = response.branch;
                        const loadedData = {
                            name: b.name || '',
                            warehouse: Number(b.warehouse) || null,
                            countries: Number(b.countries) || null,
                            states: Number(b.states) || null,
                            cities: Number(b.cities) || null,
                            neighborhoods: b.neighborhoods ? Number(b.neighborhoods) : null,
                            address: b.address || '',
                            address_reference: b.address_reference || ''
                        };

                        // Load location data in cascade BEFORE setting form data
                        if (loadedData.countries) {
                            try {
                                const statesData = await StateApi(loadedData.countries);
                                setStates(statesData || []);

                                if (loadedData.states) {
                                    const citiesData = await CityApi(loadedData.countries, loadedData.states);
                                    setCities(citiesData || []);

                                    if (loadedData.cities) {
                                        const neighborhoodsData = await NeighborhoodApi(loadedData.countries, loadedData.states, loadedData.cities);
                                        setNeighborhoods(neighborhoodsData || []);
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading location data:', error);
                            }
                        }

                        setFormData(loadedData);
                        setInitialData(loadedData);

                        toast({
                            title: "Sucursal cargada",
                            description: "Los datos de la sucursal se han cargado correctamente"
                        });
                    }
                } catch (error) {
                    console.error("Error fetching branch details:", error);
                    toast({ title: "Error", description: "No se pudieron cargar los detalles de la sucursal", variant: "destructive" });
                } finally {
                    setIsInitializing(false);
                }
            } else {
                setIsInitializing(false);
            }
        };
        fetchBranchDetails();
    }, [branchId, isEdit, toast]);

    // Cascading effect for states
    useEffect(() => {
        const fetchStates = async () => {
            if (formData.countries && !isInitializing) {
                setStates([]);
                setCities([]);
                setNeighborhoods([]);
                const res = await StateApi(formData.countries);
                setStates(res || []);
            }
        };
        fetchStates();
    }, [formData.countries, isInitializing]);

    // Cascading effect for cities
    useEffect(() => {
        const fetchCities = async () => {
            if (formData.countries && formData.states && !isInitializing) {
                setCities([]);
                setNeighborhoods([]);
                const res = await CityApi(formData.countries, formData.states);
                setCities(res || []);
            }
        };
        fetchCities();
    }, [formData.states, isInitializing]);
    
    // Cascading effect for neighborhoods
    useEffect(() => {
        const fetchNeighborhoods = async () => {
            if (formData.countries && formData.states && formData.cities && !isInitializing) {
                setNeighborhoods([]);
                const res = await NeighborhoodApi(formData.countries, formData.states, formData.cities);
                setNeighborhoods(res || []);
            }
        };
        fetchNeighborhoods();
    }, [formData.cities, isInitializing]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: keyof FormData, value: string) => {
        const numValue = value ? parseInt(value, 10) : null;

        setFormData(prev => {
            const newState = { ...prev, [field]: numValue };
            if (field === 'countries') {
                newState.states = null;
                newState.cities = null;
                newState.neighborhoods = null;
            } else if (field === 'states') {
                newState.cities = null;
                newState.neighborhoods = null;
            } else if (field === 'cities') {
                newState.neighborhoods = null;
            }
            return newState;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!formData.name || !formData.warehouse || !formData.countries || !formData.states || !formData.cities) {
                toast({
                    title: "Campos requeridos",
                    description: "Por favor complete todos los campos obligatorios.",
                    variant: "destructive",
                });
                return;
            }

            const payload: Branch = {
                id: branchId,
                name: formData.name,
                warehouse: Number(formData.warehouse),
                countries: Number(formData.countries),
                states: Number(formData.states),
                cities: Number(formData.cities),
                neighborhoods: formData.neighborhoods ? Number(formData.neighborhoods) : undefined,
                address: formData.address,
                address_reference: formData.address_reference,
            };

            if (isEdit) {
                await UpdateBranch(payload);
                toast({ title: "Éxito", description: "Sucursal actualizada correctamente" });
            } else {
                await CreateBranch(payload);
                toast({ title: "Éxito", description: "Sucursal creada correctamente" });
            }
            navigate('/settings/branches');
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "No se pudo guardar la sucursal", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        optionsLoading: isInitializing,
        warehouses, countries, states, cities, neighborhoods,
        handleChange,
        handleSelectChange,
        handleSubmit,
        hasChanges: hasChanges()
    };
};

export default useCreateBranch;