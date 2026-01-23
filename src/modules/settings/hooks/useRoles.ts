import { useEffect, useState } from 'react';
import { Role, RolesFilters } from '../types/Roles.types';
import { rolesApi } from '../services/Roles.services';
import { rolesAdapter } from '../adapters/Roles.adapters';
import { useToast } from '@/shared/hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const useRoles = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<RolesFilters>({
        page: 1,
        size: 20,
        search: "",
        is_admin: null,
        minuser: null,
        maxuser: null,
    });
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
    const { toast } = useToast();

    const loadRoles = async (filtersObj: RolesFilters) => {
        setLoading(true);
        try {
            const dataRoles = await rolesApi(filtersObj);
            const { data, pagination: paginationData } = rolesAdapter(dataRoles);
            setRoles(data);
            setPagination(paginationData);
            console.log(dataRoles);

        } catch (error) {
            console.error('Error fetching roles:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los roles",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles(filters);
    }, []);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        const loadSearch = () => {
            setLoading(true);
            if (debouncedSearch !== filters.search) {
                setFilters((prev) => {
                    const newFilters = { ...prev, search: debouncedSearch, page: 1 };
                    loadRoles(newFilters);
                    return newFilters;
                });
            }
            setLoading(false);
        };

        loadSearch();
    }, [debouncedSearch]);

    const handleSearchChange = (text: string) => {
        setSearch(text);
    };

    const handleOpenFilterModal = () => {
        setIsOpenFilterModal(true);
    };

    const handleCloseFilterModal = () => {
        setIsOpenFilterModal(false);
    };

    const handleDeleteRole = async (roleId: number) => {
        // Implementation pending
        console.log("Delete role", roleId);
    };

    const handlePageChange = async (page: number) => {
        await loadRoles({ ...filters, page });
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleSizeChange = async (size: number) => {
        await loadRoles({ ...filters, size, page: 1 });
        setFilters((prev) => ({ ...prev, size, page: 1 }));
    };

    const handleApplyFilter = async (newFilters: RolesFilters) => {
        setPagination((prev) => ({ ...prev, p_page: 1 }));
        setFilters((prev) => {
            const updatedFilters = { ...newFilters, page: 1, size: prev.size };
            loadRoles(updatedFilters);

            return updatedFilters;
        });
        handleCloseFilterModal();


    };

    return {
        roles,
        loading,
        filters,
        search,
        pagination,
        isOpenFilterModal,
        handleDeleteRole,
        handleSearchChange,
        handleOpenFilterModal,
        handleCloseFilterModal,
        handlePageChange,
        handleSizeChange,
        handleApplyFilter
    };
}

export default useRoles;