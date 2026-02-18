import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { CreateOrderChannelType, GetModules, GetOrderChannelTypeDetails, UpdateOrderChannelType } from '../services/OrderChannelTypes.services';
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
    const { id: channelTypeId } = useParams();
    const isEdit = Boolean(channelTypeId);
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
                const promises: Promise<any>[] = [
                    GetModules(),
                    getPaymentMethodsIsActiveTrueAndActiveTrue(),
                ];

                if (isEdit && channelTypeId) {
                    promises.push(GetOrderChannelTypeDetails(parseInt(channelTypeId)));
                }

                const results = await Promise.all(promises);
                const modulesData = results[0];
                const paymentMethodsData = results[1];

                const ord = modulesData.find((m: any) => m.code === 'ORD') ?? null;
                setOrdModule(ord);
                setPaymentMethods(paymentMethodsData);

                if (isEdit && results[2]) {
                    const details = results[2];
                    setFormData({
                        name: details.chanelType.name,
                        code: details.chanelType.code,
                    });
                    setSelectedPaymentMethods(new Set(details.paymentMethodIds));
                    if (details.chanelType.moduleId && details.chanelType.moduleCode) {
                        setOrdModule({ id: details.chanelType.moduleId, code: details.chanelType.moduleCode });
                    }
                }
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
    }, [toast, isEdit, channelTypeId]);

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
            if (isEdit && channelTypeId) {
                await UpdateOrderChannelType({
                    id: parseInt(channelTypeId),
                    name: formData.name,
                    code: formData.code,
                    moduleID: ordModule.id,
                    moduleCode: ordModule.code,
                    paymentMethods: Array.from(selectedPaymentMethods),
                });
                toast({ title: "Éxito", description: "Tipo de canal actualizado correctamente" });
            } else {
                await CreateOrderChannelType({
                    name: formData.name,
                    code: formData.code,
                    moduleID: ordModule.id,
                    moduleCode: ordModule.code,
                    paymentMethods: Array.from(selectedPaymentMethods),
                });
                toast({ title: "Éxito", description: "Tipo de canal creado correctamente" });
            }
            navigate('/settings/order-channel-types');
        } catch (error: any) {
            console.error("Error saving order channel type:", error);
            toast({
                title: "Error",
                description: error.message || (isEdit ? "Error al actualizar" : "Error al crear"),
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
        isEdit,
        handleChange,
        togglePaymentMethod,
        handleSubmit
    };
};

export default useCreateOrderChannelType;
