import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Client, ClientsPagination, ClientsFilters, ClientsOrderBy } from '../types';
import { getClientsList } from '../services';
import { adaptClientsList } from '../adapters/client.adapter';

const initialFilters: ClientsFilters = {
  minPurchases: null,
  maxPurchases: null,
  minAmount: null,
  maxAmount: null,
  dateFrom: null,
  dateTo: null,
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<ClientsPagination>({
    page: 1,
    size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Valor del input
  const [search, setSearch] = useState(''); // Valor que dispara el fetch
  const [filters, setFilters] = useState<ClientsFilters>(initialFilters);
  const [order, setOrder] = useState<ClientsOrderBy>('date-desc');

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getClientsList({
        search,
        filters,
        order,
        page: pagination.page,
        size: pagination.size,
      });

      const adapted = adaptClientsList(response);
      setClients(adapted.clients);
      setPagination(adapted.pagination);
    } catch (error: any) {
      toast.error('Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [search, filters, order, pagination.page, pagination.size]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const executeSearch = () => {
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFiltersChange = (newFilters: ClientsFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleOrderChange = (newOrder: ClientsOrderBy) => {
    setOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = 
    filters.minPurchases !== null ||
    filters.maxPurchases !== null ||
    filters.minAmount !== null ||
    filters.maxAmount !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  return {
    clients,
    pagination,
    loading,
    searchInput,
    filters,
    order,
    hasActiveFilters,
    handleSearchInputChange,
    executeSearch,
    handleFiltersChange,
    handleOrderChange,
    handlePageChange,
    handlePageSizeChange,
    clearFilters,
    reload: fetchClients,
  };
};
