import { useEffect, useState } from 'react';
import { BranchView, BranchesFilters } from '../types/Branches.types';
import { BranchesApi, DeleteBranch } from '../services/Branches.services';
import { BranchesAdapter } from '../adapters/Branches.adapter';
import { useToast } from '@/shared/hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const useBranches = () => {
    const [branches, setBranches] = useState<BranchView[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<BranchesFilters>({
        page: 1,
        size: 20,
        search: "",
        country: null,
        state: null,
        city: null,
        neighborhood: null,
        warehouse: null,
    });
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
    const { toast } = useToast();

    const loadBranches = async (filtersObj: BranchesFilters) => {
        try {
            setLoading(true);
            const dataBranches = await BranchesApi(filtersObj);
            const { data, pagination: paginationData } = BranchesAdapter(dataBranches);
            setBranches(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las sucursales",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches(filters);
    }, []);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        const loadSearch = async () => {
            if (debouncedSearch !== filters.search) {
                setLoading(true)
                await loadBranches({ ...filters, search: debouncedSearch, page: 1 });
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

    const handleDeleteBranch = async (branchId: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
            return;
        }

        try {
            await DeleteBranch(branchId);

            toast({
                title: "Éxito",
                description: "Sucursal eliminada correctamente",
            });

            await loadBranches(filters);
        } catch (error) {
            console.error('Error deleting branch:', error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la sucursal",
                variant: "destructive",
            });
        }
    };

    const handlePageChange = async (page: number) => {
        await loadBranches({ ...filters, page });
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleSizeChange = async (size: number) => {
        await loadBranches({ ...filters, size, page: 1 });
        setFilters((prev) => ({ ...prev, size, page: 1 }));
    };

    const handleApplyFilter = async (newFilters: BranchesFilters) => {
        setPagination((prev) => ({ ...prev, p_page: 1 }));
        setFilters((prev) => {
            const updatedFilters = { ...newFilters, page: 1, size: prev.size };
            loadBranches(updatedFilters);

            return updatedFilters;
        });
        handleCloseFilterModal();
    };


    return {
        branches,
        loading,
        filters,
        search,
        pagination,
        isOpenFilterModal,
        handleDeleteBranch,
        handleSearchChange,
        handleOpenFilterModal,
        handleCloseFilterModal,
        handlePageChange,
        handleSizeChange,
        handleApplyFilter
    };
}

export default useBranches;
