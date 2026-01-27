import { RolePayload } from '../types/Roles.types';
import { createRoleApi, updateRoleApi } from '../services/Roles.services';
import { useState } from 'react';

const useCreateRole = () => {
    const [role, setRole] = useState<RolePayload>({
        id: undefined,
        name: "",
        admin: false,
        functions: []
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    const createRole = async (role: RolePayload) => {
        setCreateLoading(true);
        try {
            await createRoleApi(role);
        } catch (error) {
            console.error(error);
        } finally {
            setCreateLoading(false);
        }
    };

    const updateRole = async (role: RolePayload) => {
        setUpdateLoading(true);
        try {
            await updateRoleApi(role);
        } catch (error) {
            console.error(error);
        } finally {
            setUpdateLoading(false);
        }
    };

    return {
        createLoading,
        updateLoading,
        role,
        updateRole,
        createRole,
    }
}

export default useCreateRole