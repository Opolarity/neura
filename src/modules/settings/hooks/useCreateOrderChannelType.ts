import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { CreateOrderChannelType, GetModules } from '../services/OrderChannelTypes.services';
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from '@/shared/services/service';

interface FormData {
    name: string;
    code: string;
}

interface PaymentMethodOption {
    id: number;
    name: string;
    business_accounts?: { name: string };
}

const useCreateOrderChannelType = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [ordModule, setOrdModule] = useState<{ id: number; code: string } | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Set<number>>(new Set());

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [modulesData, paymentMethodsData] = await Promise.all([
                    GetModules(),
                    getPaymentMethodsIsActiveTrueAndActiveTrue(),
                ]);
                const ord = modulesData.find(m => m.code === 'ORD') ?? null;
                setOrdModule(ord);
                setPaymentMethods(paymentMethodsData);
            } catch (error) {
                console.error("Error loading options:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las opciones",
                    variant: "destructive"
                });
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const togglePaymentMethod = (id: number) => {
        setSelectedPaymentMethods(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name || !formData.code) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        if (!ordModule) {
            toast({
                title: "Error",
                description: "No se encontró el módulo ORD",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            await CreateOrderChannelType({
                name: formData.name,
                code: formData.code,
                moduleID: ordModule.id,
                moduleCode: ordModule.code,
                paymentMethods: Array.from(selectedPaymentMethods),
            });
            toast({ title: "Éxito", description: "Tipo de canal creado correctamente" });
            navigate('/settings/order-channel-types');
        } catch (error: any) {
            console.error("Error creating order channel type:", error);
            toast({
                title: "Error",
                description: error.message || "Error al crear",
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
        paymentMethods,
        selectedPaymentMethods,
        handleChange,
        togglePaymentMethod,
        handleSubmit
    };
};

export default useCreateOrderChannelType;
