import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaginationState } from '@/shared/components/pagination/Pagination';
import { OrderChannelType } from '../types/OrderChannelTypes.types';
import { GetOrderChannelTypes } from '../services/OrderChannelTypes.services';
import { OrderChannelTypesAdapter } from '../adapters/OrderChannelTypes.adapter';
import { useDebounce } from '@/shared/hooks/useDebounce';

export const useOrderChannelTypes = () => {
    const { toast } = useToast();
    const [orderChannelTypes, setOrderChannelTypes] = useState<OrderChannelType[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const loadOrderChannelTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await GetOrderChannelTypes({
                page: pagination.p_page,
                size: pagination.p_size,
                search: debouncedSearch,
            });
            const { orderChannelTypes: data, pagination: paging } = OrderChannelTypesAdapter(response);
            setOrderChannelTypes(data);
            setPagination(paging);
        } catch (error) {
            console.error("Error loading order channel types:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los tipos de canales de pedido",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.p_page, pagination.p_size, debouncedSearch, toast]);

    useEffect(() => {
        loadOrderChannelTypes();
    }, [loadOrderChannelTypes]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, p_page: newPage }));
    };

    const handleSizeChange = (newSize: number) => {
        setPagination(prev => ({ ...prev, p_size: newSize, p_page: 1 }));
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, p_page: 1 }));
    };

    return {
        orderChannelTypes,
        loading,
        pagination,
        search,
        handlePageChange,
        handleSizeChange,
        handleSearchChange,
        refresh: loadOrderChannelTypes
    };
};

export default useOrderChannelTypes;
