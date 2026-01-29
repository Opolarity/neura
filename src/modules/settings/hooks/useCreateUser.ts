import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/shared/hooks";
import {
    createUserApi,
    updateUserApi,
    getUserByIdApi,
    getUsersFormDataApi,
    getStatesListApi,
    getCitiesListApi,
    getNeighborhoodsListApi,
    getUserDocumentApi
} from '../services/Users.services';
import { FilterOption, DocumentLookupPayload } from '../types/Users.types';

interface FormData {
    name: string;
    middle_name: string;
    last_name: string;
    last_name2: string;
    document_type_id: string;
    document_number: string;
    email: string;
    password: string;
    warehouse_id: string;
    branches_id: string;
    phone: string;
    country_id: string;
    state_id: string;
    city_id: string;
    neighborhood_id: string;
    address: string;
    address_reference: string;
    show: boolean;
    type_ids: number[];
    role_ids: number[];
    profiles_id: string;
}

const useCreateUser = (id?: string | null, isEdit?: boolean) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Loading states
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [userDataLoaded, setUserDataLoaded] = useState(false);
    const [showPasswordField, setShowPasswordField] = useState(false);

    // Options state
    const [roles, setRoles] = useState<FilterOption[]>([]);
    const [warehouses, setWarehouses] = useState<FilterOption[]>([]);
    const [branches, setBranches] = useState<FilterOption[]>([]);
    const [documentTypes, setDocumentTypes] = useState<FilterOption[]>([]);
    const [accountTypes, setAccountTypes] = useState<FilterOption[]>([]);
    const [countries, setCountries] = useState<FilterOption[]>([]);
    const [states, setStates] = useState<FilterOption[]>([]);
    const [cities, setCities] = useState<FilterOption[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<FilterOption[]>([]);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        middle_name: '',
        last_name: '',
        last_name2: '',
        document_type_id: '',
        document_number: '',
        email: '',
        password: '',
        warehouse_id: '',
        branches_id: '',
        phone: '',
        country_id: '',
        state_id: '',
        city_id: '',
        neighborhood_id: '',
        address: '',
        address_reference: '',
        show: true,
        type_ids: [],
        role_ids: [],
        profiles_id: '',
    });

    // Computed values
    const isRUC = documentTypes.find(t => t.id.toString() === formData.document_type_id)?.name.includes('RUC') || false;

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setOptionsLoading(true);
                const data = await getUsersFormDataApi();
                setRoles(data.roles || []);
                setWarehouses(data.warehouses || []);
                setDocumentTypes(data.documentTypes || []);
                setAccountTypes(data.accountTypes || []);
                setCountries(data.countries || []);
                setBranches(data.branches || []);

                // Auto-select USE account type if not in edit mode
                if (!isEdit && data.accountTypes && data.accountTypes.length > 0) {
                    const useType = data.accountTypes.find((t: any) => t.name?.toUpperCase().includes('USE'));
                    if (useType) {
                        setFormData(prev => ({
                            ...prev,
                            type_ids: [useType.id]
                        }));
                    }
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

    // Load user data when editing
    useEffect(() => {
        if (isEdit && id && !optionsLoading) {
            const loadUserData = async () => {
                try {
                    setFetchingUser(true);
                    console.log("=== Fetching user for ID:", id, "===");

                    const response = await getUserByIdApi(parseInt(id));
                    console.log("=== Raw API Response ===", JSON.stringify(response, null, 2));

                    if (!response) {
                        throw new Error("No se recibió respuesta del servidor");
                    }

                    const user = response.user || response;
                    console.log("=== User Data ===", JSON.stringify(user, null, 2));

                    const profileData = user.profiles || user.profile;
                    const profile = Array.isArray(profileData) ? profileData[0] : profileData;
                    console.log("=== Profile Data ===", JSON.stringify(profile, null, 2));

                    const accountTypesData = user.account_types || [];
                    const accountTypesValues = accountTypesData.map((at: any) =>
                        at.account_type_id || at.id
                    );
                    console.log("=== Account Types ===", accountTypesValues);

                    const roleIds = user.role_ids || user.roles?.map((r: any) => r.id) || [];
                    console.log("=== Role IDs ===", roleIds);

                    const newFormData = {
                        name: user.name || '',
                        middle_name: user.middle_name || '',
                        last_name: user.last_name || '',
                        last_name2: user.last_name2 || '',
                        document_type_id: user.document_type_id?.toString() || '',
                        document_number: user.document_number || '',
                        email: user.email || '',
                        password: '',
                        show: user.show ?? true,
                        type_ids: accountTypesValues,
                        role_ids: roleIds,
                        warehouse_id: user.warehouse_id?.toString() || profile?.warehouse_id?.toString() || '',
                        branches_id: user.branch_id?.toString() || profile?.branch_id?.toString() || profile?.branches_id?.toString() || '',
                        phone: user.phone || profile?.phone || '',
                        country_id: user.country_id?.toString() || '',
                        state_id: user.state_id?.toString() || '',
                        city_id: user.city_id?.toString() || '',
                        neighborhood_id: user.neighborhood_id?.toString() || '',
                        address: user.address || profile?.address || '',
                        address_reference: user.address_reference || profile?.address_reference || '',
                        profiles_id: user.profiles_id || profile?.UID || profile?.uid || '',
                    };

                    console.log("=== Setting Form Data ===", JSON.stringify(newFormData, null, 2));
                    setFormData(newFormData);

                    // Load location data BEFORE marking as loaded
                    if (newFormData.country_id) {
                        try {
                            const statesData = await getStatesListApi(parseInt(newFormData.country_id));
                            setStates(statesData.states || statesData || []);

                            if (newFormData.state_id) {
                                const citiesData = await getCitiesListApi(
                                    parseInt(newFormData.country_id),
                                    parseInt(newFormData.state_id)
                                );
                                setCities(citiesData.cities || citiesData || []);

                                if (newFormData.city_id) {
                                    const neighborhoodsData = await getNeighborhoodsListApi(
                                        parseInt(newFormData.country_id),
                                        parseInt(newFormData.state_id),
                                        parseInt(newFormData.city_id)
                                    );
                                    setNeighborhoods(neighborhoodsData.neighborhoods || neighborhoodsData || []);
                                }
                            }
                        } catch (error) {
                            console.error('Error loading location data:', error);
                        }
                    }

                    // Mark as loaded AFTER everything
                    setUserDataLoaded(true);

                } catch (error) {
                    console.error('=== Error fetching user ===', error);
                    toast({
                        title: "Error",
                        description: "No se pudo cargar la información del usuario",
                        variant: "destructive",
                    });
                } finally {
                    setFetchingUser(false);
                }
            };

            loadUserData();
        }
    }, [isEdit, id, optionsLoading]);

    // Load states when country changes
    useEffect(() => {
        if (formData.country_id && userDataLoaded) {
            getStatesListApi(parseInt(formData.country_id)).then(data => {
                setStates(data.states || data || []);
            });
            if (formData.state_id || formData.city_id || formData.neighborhood_id) {
                setFormData(prev => ({ ...prev, state_id: '', city_id: '', neighborhood_id: '' }));
                setCities([]);
                setNeighborhoods([]);
            }
        }
    }, [formData.country_id]);

    // Load cities when state changes
    useEffect(() => {
        if (formData.country_id && formData.state_id && userDataLoaded) {
            getCitiesListApi(parseInt(formData.country_id), parseInt(formData.state_id)).then(data => {
                setCities(data.cities || data || []);
            });
            if (formData.city_id || formData.neighborhood_id) {
                setFormData(prev => ({ ...prev, city_id: '', neighborhood_id: '' }));
                setNeighborhoods([]);
            }
        }
    }, [formData.state_id]);

    // Load neighborhoods when city changes
    useEffect(() => {
        if (formData.country_id && formData.state_id && formData.city_id && userDataLoaded) {
            getNeighborhoodsListApi(
                parseInt(formData.country_id),
                parseInt(formData.state_id),
                parseInt(formData.city_id)
            ).then(data => {
                setNeighborhoods(data.neighborhoods || data || []);
            });
            if (formData.neighborhood_id) {
                setFormData(prev => ({ ...prev, neighborhood_id: '' }));
            }
        }
    }, [formData.city_id]);



    // Handlers
    const toggleRole = (id: number) => {
        setFormData(prev => ({
            ...prev,
            role_ids: prev.role_ids.includes(id)
                ? prev.role_ids.filter(r => r !== id)
                : [...prev.role_ids, id]
        }));
    };

    const toggleAccountType = (id: number) => {
        const accountType = accountTypes.find(t => t.id === id);
        const isUseType = accountType?.name?.toUpperCase().includes('USE');

        setFormData(prev => {
            if (isUseType && prev.type_ids.includes(id)) {
                toast({
                    title: "Tipo de cuenta obligatorio",
                    description: "El tipo de cuenta USE no puede ser removido",
                    variant: "destructive",
                });
                return prev;
            }

            return {
                ...prev,
                type_ids: prev.type_ids.includes(id)
                    ? prev.type_ids.filter(t => t !== id)
                    : [...prev.type_ids, id]
            };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBranchChange = (val: string) => {
        const selectedBranch = branches.find(b => b.id.toString() === val);
        if (selectedBranch && selectedBranch.warehouse_id) {
            setFormData(prev => ({
                ...prev,
                branches_id: val,
                warehouse_id: selectedBranch.warehouse_id.toString()
            }));
        } else {
            setFormData(prev => ({ ...prev, branches_id: val }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation
            const requiredFields: any = {
                name: formData.name,
                email: formData.email,
                role_ids: formData.role_ids.length > 0,
                warehouse_id: formData.warehouse_id,
                branches_id: formData.branches_id,
                type_ids: formData.type_ids.length > 0,
            };

            // last_name only required if NOT RUC
            if (!isRUC) {
                requiredFields['last_name'] = formData.last_name;
            }

            // Password optional in edit mode
            if (!isEdit) {
                requiredFields['password'] = formData.password;
            }

            const missingFields = Object.entries(requiredFields)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                console.log("Missing fields:", missingFields);
                toast({
                    title: "Campos requeridos",
                    description: "Por favor complete todos los campos obligatorios (*) o su formato es inválido",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                role_id: formData.role_ids[0],
                role_ids: formData.role_ids,
                document_type_id: formData.document_type_id ? parseInt(formData.document_type_id) : null,
                warehouse_id: parseInt(formData.warehouse_id),
                branch_id: parseInt(formData.branches_id),
                country_id: formData.country_id ? parseInt(formData.country_id) : null,
                state_id: formData.state_id ? parseInt(formData.state_id) : null,
                city_id: formData.city_id ? parseInt(formData.city_id) : null,
                neighborhood_id: formData.neighborhood_id ? parseInt(formData.neighborhood_id) : null,
            };

            if (isEdit && !formData.password) {
                delete payload.password;
            }

            console.log("=== Submitting payload ===", JSON.stringify(payload, null, 2));

            if (isEdit) {
                await updateUserApi(parseInt(id!), formData.profiles_id, payload);
                toast({
                    title: "Éxito",
                    description: "Usuario actualizado correctamente",
                });
            } else {
                await createUserApi(payload);
                toast({
                    title: "Éxito",
                    description: "Usuario creado correctamente",
                });
            }
            navigate('/settings/users');
        } catch (error: any) {
            console.error('=== Error saving user ===', error);
            toast({
                title: "Error",
                description: error.message || "No se pudo guardar el usuario",
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
        fetchingUser,
        roles,
        warehouses,
        branches,
        documentTypes,
        accountTypes,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSelectChange,
        handleBranchChange,
        toggleRole,
        toggleAccountType,
        handleSubmit,
        showPasswordField,
        setShowPasswordField,
        isRUC,
    };
};

export default useCreateUser;


export const useUserDocumentLookup = () => {
    const [lookupLoading, setLookupLoading] = useState(false);

    const lookupDocument = async (payload: DocumentLookupPayload) => {
        try {
            setLookupLoading(true);
            return await getUserDocumentApi(payload);
        } finally {
            setLookupLoading(false);
        }
    };

    return {
        lookupDocument,
        lookupLoading,
    };
};
