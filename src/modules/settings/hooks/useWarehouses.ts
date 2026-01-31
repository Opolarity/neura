import { useEffect, useState } from 'react';
import { WarehouseView, WarehousesFilters } from '../types/Warehouses.types';
import { WareApi, DeleteWarehouses } from '../services/Warehouses.services';
import { WarehousesAdapter } from '../adapters/Warehouses.adapters';
import { useToast } from '@/shared/hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const useWarehouses = () => {
    const [warehouses, setWarehouses] = useState<WarehouseView[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<WarehousesFilters>({
        page: 1,
        size: 20,
        search: "",
        country: null,
        state: null,
        city: null,
        neighborhoods: null,
        branches: "",
    });
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
    const { toast } = useToast();

    const loadWarehouses = async (filtersObj: WarehousesFilters) => {
        try {
            setLoading(true);
            const dataRoles = await WareApi(filtersObj);
            const { data, pagination: paginationData } = WarehousesAdapter(dataRoles);
            setWarehouses(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los almacenes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWarehouses(filters);
    }, []);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        const loadSearch = async () => {
            if (debouncedSearch !== filters.search) {
                setLoading(true)
                await loadWarehouses({ ...filters, search: debouncedSearch, page: 1 });
                setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
                setLoading(false)
            }
        };

        loadSearch();
    }, [debouncedSearch]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handleOpenFilterModal = () => {
        setIsOpenFilterModal(true);
    };

    const handleCloseFilterModal = () => {
        setIsOpenFilterModal(false);
    };

    const handleDeleteWarehouse = async (warehouseId: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este almacén?')) {
            return;
        }

        try {
            await DeleteWarehouses(warehouseId);

            toast({
                title: "Éxito",
                description: "Almacén eliminado correctamente",
            });

            await loadWarehouses(filters);
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el almacén",
                variant: "destructive",
            });
        }
    };

    const handlePageChange = async (page: number) => {
        await loadWarehouses({ ...filters, page });
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleSizeChange = async (size: number) => {
        await loadWarehouses({ ...filters, size, page: 1 });
        setFilters((prev) => ({ ...prev, size, page: 1 }));
    };

    const handleApplyFilter = async (newFilters: WarehousesFilters) => {
        setPagination((prev) => ({ ...prev, p_page: 1 }));
        setFilters((prev) => {
            const updatedFilters = { ...newFilters, page: 1, size: prev.size };
            loadWarehouses(updatedFilters);

            return updatedFilters;
        });
        handleCloseFilterModal();


    };

    const hasActiveFilters = !!(
        filters.country ||
        filters.state ||
        filters.city ||
        filters.neighborhoods ||
        filters.branches
    );

    return {
        warehouses,
        loading,
        filters,
        search,
        pagination,
        isOpenFilterModal,
        hasActiveFilters,
        handleDeleteWarehouse,
        handleSearchChange,
        handleOpenFilterModal,
        handleCloseFilterModal,
        handlePageChange,
        handleSizeChange,
        handleApplyFilter
    };
}

export default useWarehouses;