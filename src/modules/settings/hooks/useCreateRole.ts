import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  createRoleApi,
  roleDetailApi,
  updateRoleApi,
} from "../services/Roles.services";
import { permissionsCatalogApi } from "../services/Permissions.services";
import { roleDetailAdapter } from "../adapters/Roles.adapters";
import { permissionsCatalogAdapter } from "../adapters/Permissions.adapters";
import { PermissionTree } from "../types/Permissions.types";
import { RolePayload } from "../types/Roles.types";

const EMPTY_TREE: PermissionTree = {
  permissions: [],
  allPermissionIds: [],
  parentOf: new Map(),
  descendantsOf: new Map(),
};

const useCreateRole = (roleId?: number) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEdit = Boolean(roleId);

  const [formData, setFormData] = useState<RolePayload>({
    name: "",
    admin: false,
    permissions: [],
  });
  const [tree, setTree] = useState<PermissionTree>(EMPTY_TREE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");

  /**
   * Selección vigente antes de marcar "Rol de Administrador". Permite
   * restaurarla al desmarcarlo, en lugar de dejar el rol en cero como hacía la
   * versión anterior.
   */
  const previousSelection = useRef<number[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [catalogResponse, detailResponse] = await Promise.all([
          permissionsCatalogApi(),
          isEdit && roleId ? roleDetailApi(roleId) : Promise.resolve(null),
        ]);

        const permissionTree = permissionsCatalogAdapter(catalogResponse);
        setTree(permissionTree);

        if (detailResponse) {
          const detail = roleDetailAdapter(detailResponse);
          previousSelection.current = detail.permissions;
          setFormData({
            id: detail.id,
            name: detail.name,
            admin: detail.admin,
            // Un rol admin no guarda asignaciones: se muestran todas marcadas.
            permissions: detail.admin
              ? permissionTree.allPermissionIds
              : detail.permissions,
          });
        }
      } catch (error) {
        console.error("Error loading role form:", error);
        toast({
          title: "Error",
          description: isEdit
            ? "No se pudieron cargar el rol y los permisos"
            : "No se pudieron cargar los permisos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [roleId, isEdit]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
  };

  /**
   * Cascada de selección: marcar un hijo marca toda su cadena de padres (un
   * permiso hijo sin su padre no tiene sentido) y desmarcar un padre desmarca
   * a todos sus descendientes.
   */
  const buildNextSelection = useCallback(
    (current: number[], id: number) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
        (tree.descendantsOf.get(id) ?? []).forEach((childId) =>
          next.delete(childId)
        );
      } else {
        next.add(id);
        let parentId = tree.parentOf.get(id) ?? null;
        while (parentId !== null && !next.has(parentId)) {
          next.add(parentId);
          parentId = tree.parentOf.get(parentId) ?? null;
        }
      }

      return Array.from(next);
    },
    [tree]
  );

  const togglePermission = useCallback(
    (id: number) => {
      setFormData((prev) => ({
        ...prev,
        permissions: buildNextSelection(prev.permissions, id),
      }));
    },
    [buildNextSelection]
  );

  const handleToggleAdmin = (isAdmin: boolean) => {
    setFormData((prev) => {
      if (isAdmin) {
        previousSelection.current = prev.permissions;
        return {
          ...prev,
          admin: true,
          permissions: tree.allPermissionIds,
        };
      }

      return {
        ...prev,
        admin: false,
        permissions: previousSelection.current,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol es requerido",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Un rol admin recibe todos los permisos por su flag; sp_save_role
      // ignora el array en ese caso, así que no se envía nada.
      const payload: RolePayload = {
        name: formData.name.trim(),
        admin: formData.admin,
        permissions: formData.admin ? [] : formData.permissions,
      };

      if (isEdit && roleId) {
        await updateRoleApi({ ...payload, id: roleId });
        toast({ title: "Éxito", description: "Rol actualizado correctamente", variant: "success" });
      } else {
        await createRoleApi(payload);
        toast({ title: "Éxito", description: "Rol creado correctamente", variant: "success" });
      }

      navigate("/settings/roles");
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo guardar el rol",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    isEdit,
    formData,
    loading,
    saving,
    permissionNodes: tree.permissions,
    permissionSearch,
    setPermissionSearch,
    handleNameChange,
    handleToggleAdmin,
    togglePermission,
    handleSubmit,
  };
};

export default useCreateRole;
