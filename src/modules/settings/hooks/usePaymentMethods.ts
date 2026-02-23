import { useEffect, useState } from 'react';
import { PaymentMethod, PaymentMethodPayload, PaymentMethodsFilters } from '../types/PaymentMethods.types';
import { CreatePaymentMethod, PaymentMethodsApi, UpdatePaymentMethod } from '../services/PaymentMethods.services';
import { PaymentMethodsAdapter } from '../adapters/PaymentMethods.adapter';
import { useToast } from '@/hooks/use-toast';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const usePaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
    const [openFormModal, setOpenFormModal] = useState(false);
    const [filters, setFilters] = useState<PaymentMethodsFilters>({
        page: 1,
        size: 20,
    });
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const { toast } = useToast();

    const load = async (filtersObj?: PaymentMethodsFilters) => {
        try {
            const dataResponse = await PaymentMethodsApi(filtersObj ?? filters);
            const { data, pagination: paginationData } = PaymentMethodsAdapter(dataResponse);
            setPaymentMethods(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los métodos de pago",
                variant: "destructive",
            });
        }
    };

    const loadInitial = async () => {
        setLoading(true);
        try {
            await load();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitial();
    }, []);

    const handleEditItemChange = (item: PaymentMethod | null) => {
        setEditingItem(item);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpenFormModal(isOpen);
    };

    const savePaymentMethod = async (payload: PaymentMethodPayload) => {
        setSaving(true);
        try {
            const isUpdate = payload.id != null;
            if (isUpdate) {
                await UpdatePaymentMethod(payload as PaymentMethod);
            } else {
                await CreatePaymentMethod(payload as Omit<PaymentMethod, 'id'>);
            }
            await load();
            toast({
                title: "Éxito",
                description: isUpdate ? "Método de pago actualizado" : "Método de pago creado",
            });
        } catch (error: any) {
            console.error("Error saving payment method:", error);
            toast({
                title: "Error",
                description: error.message || "Error al guardar",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
            setOpenFormModal(false);
        }
    };

    const handlePageChange = async (page: number) => {
        const newFilters = { ...filters, page };
        await load(newFilters);
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, p_page: page }));
    };

    const handleSizeChange = async (size: number) => {
        const newFilters = { ...filters, size, page: 1 };
        await load(newFilters);
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    };

    return {
        paymentMethods,
        loading,
        saving,
        editingItem,
        openFormModal,
        pagination,
        handleEditItemChange,
        handleOpenChange,
        savePaymentMethod,
        handlePageChange,
        handleSizeChange,
    };
}

export default usePaymentMethods;
