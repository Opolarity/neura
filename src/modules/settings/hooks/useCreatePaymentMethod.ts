import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import {
    CreatePaymentMethod,
    UpdatePaymentMethod,
    GetPaymentMethodDetails,
    BusinessAccountsApi
} from '../services/PaymentMethods.services';

interface PaymentMethodFormData {
    name: string;
    business_account_id: number | null;
    active: boolean;
}

const useCreatePaymentMethod = (paymentMethodId?: number | null, isEdit?: boolean) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [businessAccounts, setBusinessAccounts] = useState<{ id: number; name: string }[]>([]);

    const [formData, setFormData] = useState<PaymentMethodFormData>({
        name: '',
        business_account_id: null,
        active: true,
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const accounts = await BusinessAccountsApi();
                setBusinessAccounts(accounts);
            } catch (error) {
                console.error("Error loading business accounts:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las cuentas de negocio",
                    variant: "destructive"
                });
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, [toast]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (isEdit && paymentMethodId) {
                setLoading(true);
                try {
                    const { paymentMethod } = await GetPaymentMethodDetails(paymentMethodId);
                    if (paymentMethod) {
                        setFormData({
                            name: paymentMethod.name,
                            business_account_id: paymentMethod.business_account_id,
                            active: paymentMethod.active,
                        });
                    }
                } catch (error) {
                    console.error("Error fetching details:", error);
                    toast({
                        title: "Error",
                        description: "No se pudieron cargar los detalles",
                        variant: "destructive"
                    });
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [isEdit, paymentMethodId, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            business_account_id: Number(value)
        }));
    };

    const handleActiveChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            active: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name || !formData.business_account_id) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            if (isEdit && paymentMethodId) {
                await UpdatePaymentMethod({
                    id: paymentMethodId,
                    ...formData,
                    business_account_id: formData.business_account_id // Type assertion if needed, but it's number
                });
                toast({ title: "Éxito", description: "Método de pago actualizado" });
            } else {
                await CreatePaymentMethod({
                    ...formData,
                    business_account_id: formData.business_account_id
                });
                toast({ title: "Éxito", description: "Método de pago creado" });
            }
            navigate('/settings/payment-methods');
        } catch (error: any) {
            console.error("Error saving payment method:", error);
            toast({
                title: "Error",
                description: error.message || "Error al guardar",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        optionsLoading,
        businessAccounts,
        handleChange,
        handleSelectChange,
        handleActiveChange,
        handleSubmit
    };
};

export default useCreatePaymentMethod;
