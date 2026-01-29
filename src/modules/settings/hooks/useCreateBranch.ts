import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from "@/shared/hooks";
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
    const [initialData, setInitialData] = useState<FormData | null>(null);

    const hasChanges = () => {
        if (!initialData) return false;
        return (
            formData.name !== initialData.name ||
            Number(formData.warehouse) !== Number(initialData.warehouse) ||
            Number(formData.countries) !== Number(initialData.countries) ||
            Number(formData.states) !== Number(initialData.states) ||
            Number(formData.cities) !== Number(initialData.cities) ||
            Number(formData.neighborhoods) !== Number(initialData.neighborhoods) ||
            formData.address !== initialData.address ||
            formData.address_reference !== initialData.address_reference
        );
    };

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

    // Fetch details if isEdit
    // Fetch details if isEdit
    useEffect(() => {
        if (isEdit && branchId) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const response = await GetBranchDetails(branchId);

                    if (response.branch) {
                        const branch = response.branch;
                        const warehouseId = Number(branch.warehouse);
                        const countryId = Number(branch.countries);
                        const stateId = Number(branch.states);
                        const cityId = Number(branch.cities);
                        const neighborhoodId = branch.neighborhoods ? Number(branch.neighborhoods) : null;

                        const [statesData, citiesData, neighborhoodsData] = await Promise.all([
                            StateApi(countryId),
                            CityApi(countryId, stateId),
                            neighborhoodId ? NeighborhoodApi(countryId, stateId, cityId) : Promise.resolve([])
                        ]);

                        setStates(statesData);
                        setCities(citiesData);
                        setNeighborhoods(neighborhoodsData);

                        const initialFormData = {
                            name: branch.name || "",
                            warehouse: branch.warehouse || null,
                            countries: countryId,
                            states: stateId,
                            cities: cityId,
                            neighborhoods: neighborhoodId,
                            address: branch.address || "",
                            address_reference: branch.address_reference || "",
                        };
                        setFormData(initialFormData);
                        setInitialData(initialFormData);
                    }
                } catch (error) {
                    console.error('Error fetching branch details:', error);
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
    }, [branchId, isEdit]);



    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = async (field: string, value: string) => {
        const numericFields = ['warehouse', 'countries', 'states', 'cities', 'neighborhoods'];
        const parsedValue = numericFields.includes(field) ? parseInt(value) : value;
        const numericValue = typeof parsedValue === 'number' ? parsedValue : 0;

        // Update form state and handle cascading resets
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

            // Load states
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

            // Load neighborhoods
            if (formData.countries && formData.states && numericValue) {
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
        hasChanges: hasChanges()
    };
};

export default useCreateBranch;
