import { useState, useEffect } from 'react';
import { returnsService } from '../services/Returns.service';
import { ReturnItem } from '../types/Returns.types';
import { toast } from 'sonner';

export const useReturns = () => {
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReturns = async () => {
        setLoading(true);
        try {
            const data = await returnsService.getReturns();
            setReturns(data || []);
        } catch (error: any) {
            console.error('Error loading returns:', error);
            toast.error('Error al cargar las devoluciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReturns();
    }, []);

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
        loadReturns,
        formatDate,
        formatCurrency
    };
};
