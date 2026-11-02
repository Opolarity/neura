import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
    getUsersFormDataApi,
    getStatesListApi,
    getCitiesListApi,
    getNeighborhoodsListApi,
} from '@/modules/settings/services/Users.services';
import { FilterOption } from '@/modules/settings/types/Users.types';
import { toastError } from "@/shared/utils/toastError";
import { isValidLocalPhone, toLocalPhone } from "@/shared/utils/phone";
import { getMyProfileApi, updateMyProfileApi } from '../services/Profile.services';
import { MyProfileUpdate } from '../types/Profile.types';

// Mismos campos que el formulario de editar usuario (useCreateUser). Los que
// el usuario no puede cambiar de sí mismo se cargan igual, para mostrarlos.
interface FormData {
    user_name: string;
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
    role_ids: number[];
}

const useMyProfile = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [showPasswordField, setShowPasswordField] = useState(false);

    const [roles, setRoles] = useState<FilterOption[]>([]);
    const [warehouses, setWarehouses] = useState<FilterOption[]>([]);
    const [branches, setBranches] = useState<FilterOption[]>([]);
    const [documentTypes, setDocumentTypes] = useState<FilterOption[]>([]);
    const [countries, setCountries] = useState<FilterOption[]>([]);
    const [states, setStates] = useState<FilterOption[]>([]);
    const [cities, setCities] = useState<FilterOption[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<FilterOption[]>([]);

    const [formData, setFormData] = useState<FormData>({
        user_name: '',
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
        role_ids: [],
    });

    const isRUC = documentTypes.find(t => t.id.toString() === formData.document_type_id)?.name.includes('RUC') || false;

    // Los mismos asteriscos que en editar usuario: el celular se marca pero
    // no bloquea (hay usuarios antiguos sin teléfono) y la contraseña es
    // opcional.
    const requiredMarks = {
        document_type_id: true,
        document_number: true,
        name: true,
        last_name: !isRUC,
        user_name: true,
        email: true,
        password: false,
        phone: true,
        role_ids: true,
        branches_id: true,
        warehouse_id: true,
    };

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setOptionsLoading(true);
                const data = await getUsersFormDataApi();
                setRoles(data.roles || []);
                setWarehouses(data.warehouses || []);
                setDocumentTypes(data.documentTypes || []);
                setCountries(data.countries || []);
                setBranches(data.branches || []);
            } catch (error) {
                console.error('Error fetching options:', error);
                toastError(error, "No se pudieron cargar las opciones del formulario");
            } finally {
                setOptionsLoading(false);
            }
        };

        fetchOptions();
    }, []);

    // Load profile once the options are in
    useEffect(() => {
        if (optionsLoading) return;

        const loadProfile = async () => {
            try {
                setFetchingProfile(true);
                const user = await getMyProfileApi();

                const newFormData: FormData = {
                    user_name: user.user_name || '',
                    name: user.name || '',
                    middle_name: user.middle_name || '',
                    last_name: user.last_name || '',
                    last_name2: user.last_name2 || '',
                    document_type_id: user.document_type_id?.toString() || '',
                    document_number: user.document_number || '',
                    email: user.email || '',
                    password: '',
                    role_ids: user.role_ids || [],
                    warehouse_id: user.warehouse_id?.toString() || '',
                    branches_id: user.branch_id?.toString() || '',
                    phone: toLocalPhone(user.phone),
                    country_id: user.country_id?.toString() || '',
                    state_id: user.state_id?.toString() || '',
                    city_id: user.city_id?.toString() || '',
                    neighborhood_id: user.neighborhood_id?.toString() || '',
                    address: user.address || '',
                    address_reference: user.address_reference || '',
                };
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

                setProfileLoaded(true);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toastError(error, "No se pudo cargar tu perfil");
            } finally {
                setFetchingProfile(false);
            }
        };

        loadProfile();
    }, [optionsLoading]);

    // Load states when country changes
    useEffect(() => {
        if (formData.country_id && profileLoaded) {
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
        if (formData.country_id && formData.state_id && profileLoaded) {
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
        if (formData.country_id && formData.state_id && formData.city_id && profileLoaded) {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePasswordField = () => {
        // Al cancelar se descarta lo escrito, para no mandarlo sin querer.
        setFormData(prev => ({ ...prev, password: '' }));
        setShowPasswordField(prev => !prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Igual que al editar un usuario: el celular no es obligatorio, pero
        // si se llena tiene que estar bien. El "51" lo antepone el backend.
        if (formData.phone && !isValidLocalPhone(formData.phone)) {
            toast({
                title: "Celular inválido",
                description: "El celular debe tener 9 dígitos, sin el código de país.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const payload: MyProfileUpdate = {
                phone: formData.phone,
                country_id: formData.country_id ? parseInt(formData.country_id) : null,
                state_id: formData.state_id ? parseInt(formData.state_id) : null,
                city_id: formData.city_id ? parseInt(formData.city_id) : null,
                neighborhood_id: formData.neighborhood_id ? parseInt(formData.neighborhood_id) : null,
                address: formData.address,
                address_reference: formData.address_reference,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            await updateMyProfileApi(payload);
            toast({
                title: "Éxito",
                description: "Perfil actualizado correctamente",
                variant: "success",
            });
            setFormData(prev => ({ ...prev, password: '' }));
            setShowPasswordField(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            toastError(error, "No se pudo guardar tu perfil");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        requiredMarks,
        loading,
        optionsLoading,
        fetchingProfile,
        roles,
        warehouses,
        branches,
        documentTypes,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSelectChange,
        handleSubmit,
        showPasswordField,
        togglePasswordField,
        isRUC,
    };
};

export default useMyProfile;
