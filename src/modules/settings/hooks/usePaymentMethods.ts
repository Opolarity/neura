import { useEffect, useState } from 'react';
import { PaymentMethod, PaymentMethodsFilters } from '../types/PaymentMethods.types';
import { PaymentMethodsApi } from '../services/PaymentMethods.services';
import { PaymentMethodsAdapter } from '../adapters/PaymentMethods.adapter';
import { useToast } from '@/hooks/use-toast';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const usePaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
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

    const loadPaymentMethods = async (filtersObj: PaymentMethodsFilters) => {
        try {
            setLoading(true);
            const dataResponse = await PaymentMethodsApi(filtersObj);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPaymentMethods(filters);
    }, []);

    const handlePageChange = async (page: number) => {
        await loadPaymentMethods({ ...filters, page });
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleSizeChange = async (size: number) => {
        await loadPaymentMethods({ ...filters, size, page: 1 });
        setFilters((prev) => ({ ...prev, size, page: 1 }));
    };

    return {
        paymentMethods,
        loading,
        pagination,
        handlePageChange,
        handleSizeChange,
    };
}

export default usePaymentMethods;
