import { useEffect, useState } from 'react';
import { Role, RolesFilters } from '../types/Roles.types';
import { deleteRoleApi, rolesApi } from '../services/Roles.services';
import { rolesAdapter } from '../adapters/Roles.adapters';
import { useToast } from '@/shared/hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';
import { useNavigate } from 'react-router-dom';

const useRoles = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
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
    const navigate = useNavigate();

    const loadRoles = async (filtersObj: RolesFilters) => {
        try {
            setLoading(true);
            const dataRoles = await rolesApi(filtersObj);
            const { data, pagination: paginationData } = rolesAdapter(dataRoles);
            setRoles(data);
            setPagination(paginationData);
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
        const loadSearch = async () => {
            if (debouncedSearch !== filters.search) {
                setLoading(true)
                await loadRoles({ ...filters, search: debouncedSearch, page: 1 });
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

    const handleDeleteRole = (roleId: number) => {
        setSelectedRoleId(roleId);
        setIsOpenDeleteModal(true);
    };
    const handleDeleteConfirm = async () => {
        setDeleting(true);
        await deleteRoleApi(selectedRoleId);
        setDeleting(false);
        setIsOpenDeleteModal(false);
        await loadRoles(filters);
    };
    const handleCloseDeleteModal = () => {
        setIsOpenDeleteModal(false);
    };

    const handleEditRole = (roleId: number) => {
        navigate(`/settings/roles/edit/${roleId}`);
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
        isOpenDeleteModal,
        deleting,
        handleEditRole,
        handleDeleteRole,
        handleDeleteConfirm,
        handleCloseDeleteModal,
        handleSearchChange,
        handleOpenFilterModal,
        handleCloseFilterModal,
        handlePageChange,
        handleSizeChange,
        handleApplyFilter
    };
}

export default useRoles;