import { useState, useEffect } from 'react';
import { returnsService } from '../services/Returns.service';
import { ReturnItem } from '../types/Returns.types';
import { toast } from 'sonner';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';

export const useReturns = () => {
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and Pagination states
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });

    const loadReturns = async (currentPage = pagination.p_page, currentSize = pagination.p_size, currentSearch = debouncedSearch) => {
        setLoading(true);
        try {
            const { data, total } = await returnsService.getReturns({
                page: currentPage,
                size: currentSize,
                search: currentSearch || undefined,
            });
            setReturns(data || []);
            setPagination((prev) => ({ ...prev, p_page: currentPage, p_size: currentSize, total }));
        } catch (error: any) {
            console.error('Error loading returns:', error);
            toast.error('Error al cargar las devoluciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReturns(1, pagination.p_size, debouncedSearch);
    }, [debouncedSearch]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handlePageChange = (page: number) => {
        loadReturns(page, pagination.p_size, debouncedSearch);
    };

    const handlePageSizeChange = (size: number) => {
        loadReturns(1, size, debouncedSearch);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return {
        returns,
        loading,
        loadReturns,
        formatDate,
        formatCurrency,
        search,
        handleSearchChange,
        pagination,
        handlePageChange,
        handlePageSizeChange
    };
};
