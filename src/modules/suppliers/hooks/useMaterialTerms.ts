import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  createMaterialTermGroupApi,
  createMaterialTermApi,
  deleteMaterialTermGroupApi,
  deleteMaterialTermApi,
  materialTermsApi,
  updateMaterialTermGroupApi,
  updateMaterialTermApi,
} from "../services/materialTerms.service";
import {
  MaterialTermGroup,
  MaterialTerm,
  SaveMaterialTermGroupData,
  SaveMaterialTermData,
} from "../types/materialTerms.types";

/** Lo que se va a desactivar, para el diálogo de confirmación. */
export type MaterialTermDeleteTarget =
  | { kind: "group"; item: MaterialTermGroup }
  | { kind: "term"; item: MaterialTerm };

/**
 * El catálogo de atributos de material.
 *
 * Se trae entero y se pagina en el cliente sobre los atributos, igual que las
 * clases: son pocos (Color, Largo, Talla) y así un término no puede quedar en
 * otra página que su atributo. La búsqueda sí va al backend, que mira también
 * el nombre de los términos ("negro" encuentra Color).
 */
export const useMaterialTerms = () => {
  const [groups, setGroups] = useState<MaterialTermGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MaterialTermGroup | null>(null);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  /** El término que se edita, con el atributo al que pertenece. */
  const [editingTerm, setEditingTerm] = useState<
    (MaterialTerm & { groupId: number }) | null
  >(null);
  /** Atributo con el que se abre "Nuevo término" desde su fila. */
  const [termGroupId, setTermGroupId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MaterialTermDeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setGroups(await materialTermsApi(search || undefined));
    } catch (error) {
      toastError(error, "No se pudieron cargar los atributos de material");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPagination((prev) =>
      prev.total === groups.length ? prev : { ...prev, total: groups.length },
    );
  }, [groups.length]);

  const pageGroups = useMemo(() => {
    const desde = (pagination.p_page - 1) * pagination.p_size;
    return groups.slice(desde, desde + pagination.p_size);
  }, [groups, pagination.p_page, pagination.p_size]);

  const onSearchChange = (value: string) => {
    setSearch(value.trim());
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const onPageChange = (page: number) =>
    setPagination((prev) => ({ ...prev, p_page: page }));

  const onPageSizeChange = (size: number) =>
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ---- Atributos ----------------------------------------------------------

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const openEditGroup = (group: MaterialTermGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const saveGroup = async (values: SaveMaterialTermGroupData) => {
    try {
      setSaving(true);
      if (editingGroup) {
        await updateMaterialTermGroupApi({ ...values, id: editingGroup.id });
        toast({ title: "Atributo actualizado", variant: "success" });
      } else {
        await createMaterialTermGroupApi(values);
        toast({ title: "Atributo creado", variant: "success" });
      }
      setGroupDialogOpen(false);
      await load();
    } catch (error) {
      toastError(error, "No se pudo guardar el atributo");
    } finally {
      setSaving(false);
    }
  };

  // ---- Términos ------------------------------------------------------------

  const openCreateTerm = (groupId: number | null = null) => {
    setEditingTerm(null);
    setTermGroupId(groupId);
    setTermDialogOpen(true);
  };

  const openEditTerm = (value: MaterialTerm, groupId: number) => {
    setEditingTerm({ ...value, groupId });
    setTermGroupId(groupId);
    setTermDialogOpen(true);
  };

  const saveTerm = async (values: SaveMaterialTermData) => {
    try {
      setSaving(true);
      if (editingTerm) {
        await updateMaterialTermApi({ ...values, id: editingTerm.id });
        toast({ title: "Término actualizado", variant: "success" });
      } else {
        await createMaterialTermApi(values);
        toast({ title: "Término creado", variant: "success" });
      }
      setTermDialogOpen(false);
      // El atributo del término queda abierto: es lo que se estaba mirando.
      setExpanded((prev) => new Set(prev).add(values.material_term_group_id));
      await load();
    } catch (error) {
      toastError(error, "No se pudo guardar el término");
    } finally {
      setSaving(false);
    }
  };

  // ---- Desactivar ---------------------------------------------------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.kind === "group") {
        await deleteMaterialTermGroupApi(deleteTarget.item.id);
        toast({ title: "Atributo desactivado", variant: "success" });
      } else {
        await deleteMaterialTermApi(deleteTarget.item.id);
        toast({ title: "Término desactivado", variant: "success" });
      }
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toastError(error, "No se pudo desactivar");
    } finally {
      setDeleting(false);
    }
  };

  return {
    groups,
    pageGroups,
    loading,
    search,
    onSearchChange,
    expanded,
    toggle,
    pagination,
    onPageChange,
    onPageSizeChange,
    saving,
    groupDialogOpen,
    setGroupDialogOpen,
    editingGroup,
    openCreateGroup,
    openEditGroup,
    saveGroup,
    termDialogOpen,
    setTermDialogOpen,
    editingTerm,
    termGroupId,
    openCreateTerm,
    openEditTerm,
    saveTerm,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
  };
};
