import { useEffect, useState } from 'react';
import { FilterOption, Users, UsersFilters } from '../types/Users.types';
import { UsersApi, createUserApi, deleteUserApi, updateUserApi, getRolesListApi, getWarehousesListApi, getBranchesListApi } from '../services/Users.services';
import { UsersAdapter } from '../adapters/Users.adapters';
import { useToast } from '@/shared/hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PaginationState } from '@/shared/components/pagination/Pagination';

const useUsers = () => {
    const [users, setUsers] = useState<Users[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UsersFilters>({
        page: 1,
        size: 20,
        search: "",
        person_type: null,
        role: null,
        warehouses: null,
        order: null,
    });
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);

    const [rolesOptions, setRolesOptions] = useState<FilterOption[]>([]);
    const [warehousesOptions, setWarehousesOptions] = useState<FilterOption[]>([]);
    const [branchesOptions, setBranchesOptions] = useState<FilterOption[]>([]);

    const { toast } = useToast();

    const loadUsers = async (filtersObj: UsersFilters) => {
        try {
            setLoading(true);
            const dataRoles = await UsersApi(filtersObj);
            const { data, pagination: paginationData } = UsersAdapter(dataRoles);
            setUsers(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los usuarios",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const [roles, warehouses, branches] = await Promise.all([
                getRolesListApi(),
                getWarehousesListApi(),
                getBranchesListApi(),
            ]);
            setRolesOptions(roles);
            setWarehousesOptions(warehouses);
            setBranchesOptions(branches);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    useEffect(() => {
        loadUsers(filters);
        fetchFilterOptions();
    }, []);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        const loadSearch = async () => {
            if (debouncedSearch !== filters.search) {
                setLoading(true)
                await loadUsers({ ...filters, search: debouncedSearch, page: 1 });
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

    const handleCreateUser = async (userData: any) => {
        try {
            await createUserApi(userData);
            toast({ title: "Éxito", description: "Usuario creado correctamente" });
            loadUsers(filters);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo crear el usuario", variant: "destructive" });
        }
    };

    const handleUpdateUser = async (userId: number, uid: string, userData: any) => {
        try {
            await updateUserApi(userId, uid, userData);
            toast({ title: "Éxito", description: "Usuario actualizado correctamente" });
            loadUsers(filters);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el usuario", variant: "destructive" });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUserApi(userId);
            toast({ title: "Éxito", description: "Usuario eliminado correctamente" });
            loadUsers(filters);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el usuario", variant: "destructive" });
        }
    };

    const handlePageChange = async (page: number) => {
        await loadUsers({ ...filters, page });
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleSizeChange = async (size: number) => {
        await loadUsers({ ...filters, size, page: 1 });
        setFilters((prev) => ({ ...prev, size, page: 1 }));
    };

    const handleApplyFilter = async (newFilters: UsersFilters) => {
        setPagination((prev) => ({ ...prev, p_page: 1 }));
        setFilters((prev) => {
            const updatedFilters = { ...newFilters, page: 1, size: prev.size };
            loadUsers(updatedFilters);
            return updatedFilters;
        });
        handleCloseFilterModal();
    };

    const hasActiveFilters = !!(
        filters.person_type ||
        filters.role ||
        filters.warehouses ||
        filters.branches
    );

    return {
        users,
        loading,
        filters,
        search,
        pagination,
        isOpenFilterModal,
        rolesOptions,
        warehousesOptions,
        branchesOptions,
        hasActiveFilters,
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,
        handleSearchChange,
        handleOpenFilterModal,
        handleCloseFilterModal,
        handlePageChange,
        handleSizeChange,
        handleApplyFilter
    };
}

export default useUsers;
