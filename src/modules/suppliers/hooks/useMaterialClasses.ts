import { useCallback, useEffect, useMemo, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  createMaterialClassApi,
  deleteMaterialClassApi,
  materialClassesApi,
  updateMaterialClassApi,
} from "../services/materials.service";
import { MaterialClass } from "../types/materials.types";
import {
  MaterialClassNode,
  buildMaterialClassTree,
  flattenMaterialClassTree,
} from "../utils/materialClassTree";

/**
 * El catálogo de clases de materiales.
 *
 * Las tres llamadas ya existían —las usa el alta de material en línea— así que
 * aquí no hay servicio nuevo: lo que faltaba era una pantalla desde donde
 * mirarlas todas en vez de descubrirlas a mitad de dar de alta un material.
 *
 * ## Por qué se pagina por FAMILIA y no por clase
 *
 * Con el mismo reparto que la pantalla de atributos de producto: la página
 * corta el nivel de arriba —las familias, TELA y AVIOS— y lo de dentro sale al
 * desplegar. Paginar la lista aplanada dejaría a un color de jersey en la
 * página siguiente que su jersey, que es justo el dato que se viene a ver.
 *
 * El corte es en el cliente porque `materialClassesApi` devuelve el árbol
 * entero: son decenas de filas por tenant, y pedir por página obligaría a un
 * endpoint nuevo para no ganar nada.
 */
export const useMaterialClasses = () => {
  const [classes, setClasses] = useState<MaterialClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Qué familias están abiertas. Todas cerradas al entrar. */
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  /** La clase que se está editando, o null si se está creando. */
  const [editing, setEditing] = useState<MaterialClass | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /** La clase que se va a eliminar, o null si no hay confirmación abierta. */
  const [deleteTarget, setDeleteTarget] = useState<MaterialClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setClasses(await materialClassesApi());
    } catch (error) {
      toastError(error, "No se pudieron cargar las clases de materiales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** El árbol aplanado, en el orden en que se pinta y con su nivel. */
  const tree = useMemo(
    () => flattenMaterialClassTree(buildMaterialClassTree(classes)),
    [classes],
  );

  /** Las familias: lo que se pagina. */
  const roots = useMemo(() => tree.filter((nodo) => nodo.level === 0), [tree]);

  useEffect(() => {
    setPagination((prev) =>
      prev.total === roots.length ? prev : { ...prev, total: roots.length },
    );
  }, [roots.length]);

  const pageRoots = useMemo(() => {
    const desde = (pagination.p_page - 1) * pagination.p_size;
    return roots.slice(desde, desde + pagination.p_size);
  }, [roots, pagination.p_page, pagination.p_size]);

  /**
   * Lo que cuelga de una familia, a cualquier profundidad.
   *
   * El árbol viene aplanado en orden de pintado, así que los descendientes de
   * un nodo son las filas siguientes con nivel mayor que el suyo, hasta la
   * primera que vuelve a su altura.
   */
  const descendantsOf = useCallback(
    (id: number): MaterialClassNode[] => {
      const desde = tree.findIndex((nodo) => nodo.id === id);
      if (desde === -1) return [];
      const nivel = tree[desde].level;
      const salida: MaterialClassNode[] = [];
      for (let i = desde + 1; i < tree.length && tree[i].level > nivel; i++) {
        salida.push(tree[i]);
      }
      return salida;
    },
    [tree],
  );

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (materialClass: MaterialClass) => {
    setEditing(materialClass);
    setDialogOpen(true);
  };

  const save = async (name: string, parentClassId: number | null) => {
    try {
      setSaving(true);
      if (editing) {
        await updateMaterialClassApi(editing.id, name, parentClassId);
        toast({ title: "Clase actualizada", variant: "success" });
      } else {
        await createMaterialClassApi(name, parentClassId);
        toast({ title: "Clase creada", variant: "success" });
        // La nueva cuelga de su familia: se abre para que se vea dónde cayó.
        if (parentClassId !== null) {
          setExpanded((prev) => new Set(prev).add(parentClassId));
        }
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toastError(
        error,
        editing ? "No se pudo actualizar la clase" : "No se pudo crear la clase",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---- Eliminar (baja lógica) ---------------------------------------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteMaterialClassApi(deleteTarget.id);
      toast({ title: "Clase eliminada", variant: "success" });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toastError(error, "No se pudo eliminar la clase");
    } finally {
      setDeleting(false);
    }
  };

  return {
    tree,
    pageRoots,
    descendantsOf,
    expanded,
    toggle,
    pagination,
    onPageChange: (page: number) =>
      setPagination((prev) => ({ ...prev, p_page: page })),
    onPageSizeChange: (size: number) =>
      setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 })),
    loading,
    saving,
    editing,
    dialogOpen,
    setDialogOpen,
    openCreate,
    openEdit,
    save,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
    reload: load,
  };
};
