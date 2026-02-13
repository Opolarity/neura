import { useState, useEffect } from 'react';
import { returnsService } from '../services/Returns.service';
import { ReturnItem } from '../types/Returns.types';
import { toast } from 'sonner';
import { PaginationState } from '@/shared/components/pagination/Pagination';

export const useReturns = () => {
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 10,
        total: 0
    });

    const loadReturns = async (page: number = pagination.p_page, size: number = pagination.p_size) => {
        setLoading(true);
        try {
            const result = await returnsService.getReturns(page, size);
            setReturns(result.data);
            setPagination(result.pagination);
        } catch (error: any) {
            console.error('Error loading returns:', error);
            toast.error('Error al cargar las devoluciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReturns();
    }, [pagination.p_page, pagination.p_size]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, p_page: newPage }));
    };

    const handlePageSizeChange = (newSize: number) => {
        setPagination(prev => ({ ...prev, p_size: newSize, p_page: 1 }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '-';
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
        pagination,
        handlePageChange,
        handlePageSizeChange,
        loadReturns,
        formatDate,
        formatCurrency
    };
};
