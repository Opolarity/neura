import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  classesByModuleCode,
  getWarehousesIsActiveTrue,
} from "@/shared/services/service";
import { Class } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import { getMaterialInventoryApi } from "../services/materialInventory.service";
import { updateMaterialApi } from "../services/materials.service";
import { supplierOptionsApi } from "../services/materials.service";
import { materialInventoryAdapter } from "../adapters/materialInventory.adapter";
import {
  MaterialInventoryFilters,
  MaterialInventoryRow,
  MaterialInventoryWarehouse,
} from "../types/materialInventory.types";
import { SupplierOption } from "../types/materials.types";

/**
 * La lista de inventario de materia prima.
 *
 * Misma forma que la de productos: una fila por material y una columna por
 * almacén. Y misma mecánica de filtros — buscador y orden en la barra, el
 * resto en el modal del botón «Filtrar» —, que es la de todas las tablas del
 * ERP.
 *
 * Las COLUMNAS vienen del backend, no de un catálogo aparte: con el filtro de
 * dueño puesto, qué almacenes salen es parte de la consulta, y resolverlo
 * también aquí sería tener dos sitios donde equivocarse.
 */
export const useMaterialInventory = () => {
  const [rows, setRows] = useState<MaterialInventoryRow[]>([]);
  const [columns, setColumns] = useState<MaterialInventoryWarehouse[]>([]);
  /** Para el modal: el catálogo, que no cambia con el filtro. */
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [stockTypes, setStockTypes] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<MaterialInventoryFilters>({
    page: 1,
    size: 20,
    search: null,
    // Arranca en MIS almacenes. Es lo que se viene a ver aquí: lo que tengo a
    // mano. Lo que está en un taller se mira cuando se pregunta por ello, no
    // mezclado con lo propio en la misma rejilla.
    owner: "mine",
    warehouse_id: null,
    supplier_id: null,
    material_id: null,
    // Lo pone loadInitial con el PRD del tenant. Un tipo CONCRETO no es un
    // capricho: con «todos», la celda sumaría producción y fallido y editarla
    // sería ambiguo -- ¿a cuál de los dos va la diferencia?
    stock_type_id: null,
    min_stock: null,
    max_stock: null,
    order: null,
  });

  // ---- Edición en la rejilla, como en el inventario de productos ----------
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** Lo tecleado, por `materialId:warehouseId`. Vacío = sin tocar. */
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const loadRows = async (
    currentFilters: MaterialInventoryFilters = filters,
  ) => {
    setLoading(true);
    try {
      const response = await getMaterialInventoryApi(currentFilters);
      const {
        data,
        warehouses: cols,
        pagination: newPagination,
      } = materialInventoryAdapter(response);
      setRows(data);
      setColumns(cols);
      setPagination(newPagination);
    } catch (error) {
      console.error("Error loading material inventory:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario de materiales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      // getWarehousesIsActiveTrue trae TODOS los almacenes del tenant, los de
      // proveedor incluidos: son la misma fila con `supplier_id` puesto o nulo.
      const [dataWarehouses, dataSuppliers, dataStockTypes] = await Promise.all([
        getWarehousesIsActiveTrue(),
        supplierOptionsApi(),
        classesByModuleCode("STK"),
      ]);

      setWarehouses(dataWarehouses);
      setSuppliers(dataSuppliers);
      setStockTypes(dataStockTypes);

      // PRD es el stock de producción, el que se compra y se consume. Si el
      // tenant no lo tuviera, el primero que haya: mejor un tipo cualquiera
      // que ninguno, porque sin tipo la celda no se puede editar.
      const prd =
        dataStockTypes.find((tipo) => tipo.code === "PRD") ?? dataStockTypes[0];
      const inicial = { ...filters, stock_type_id: prd?.id ?? null };
      setFilters(inicial);
      await loadRows(inicial);
    } catch (error) {
      console.error("Error loading initial material inventory data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario de materiales",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const searchTerm = debouncedSearch || null;
    if (searchTerm !== filters.search) {
      setFilters((prev) => {
        const next = { ...prev, search: searchTerm, page: 1 };
        loadRows(next);
        return next;
      });
    }
  }, [debouncedSearch]);

  // ---- Editar el saldo ---------------------------------------------------
  //
  // La misma mecánica que el inventario de productos: se entra en modo
  // edición, se teclea sobre la rejilla y se guarda. Por detrás no es un
  // UPDATE: `update-material` manda un AJUSTE con el saldo que debe QUEDAR y
  // el backend apunta la diferencia como movimiento, que es la única forma en
  // que este stock se mueve (ver el comentario de material_stock).

  const claveCelda = (materialId: number, warehouseId: number) =>
    `${materialId}:${warehouseId}`;

  /** Lo tecleado si se tocó; si no, el saldo que vino. */
  const getStockValue = (
    materialId: number,
    warehouseId: number,
    base: number | undefined,
  ): string => {
    const tecleado = edits[claveCelda(materialId, warehouseId)];
    if (tecleado !== undefined) return tecleado;
    // Sin fila en material_stock el saldo es CERO, y así se dice. El guion
    // dejaba la duda de si era cero o «no se sabe», y aquí siempre se sabe.
    return String(base ?? 0);
  };

  const handleStockChange = (
    materialId: number,
    warehouseId: number,
    value: string,
  ) =>
    setEdits((prev) => ({
      ...prev,
      [claveCelda(materialId, warehouseId)]: value,
    }));

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setEdits({});
    setIsEditing(false);
  };

  /** Solo lo que de verdad cambió: un número igual al que había no es un ajuste. */
  const cambios = Object.entries(edits).flatMap(([clave, valor]) => {
    const [materialId, warehouseId] = clave.split(":").map(Number);
    if (valor.trim() === "") return [];
    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad)) return [];
    const fila = rows.find((row) => row.materialId === materialId);
    const actual = fila?.stockByWarehouse[warehouseId] ?? 0;
    if (cantidad === actual) return [];
    return [{ materialId, warehouseId, cantidad }];
  });

  const hasChanges = cambios.length > 0;

  const handleSave = async () => {
    if (!hasChanges || filters.stock_type_id == null) return;
    setIsSaving(true);
    try {
      // Agrupado por material: `update-material` recibe un material y sus
      // líneas de stock, así que un material con tres almacenes tocados es
      // UNA llamada, no tres.
      const porMaterial = new Map<number, typeof cambios>();
      cambios.forEach((cambio) => {
        const grupo = porMaterial.get(cambio.materialId);
        if (grupo) grupo.push(cambio);
        else porMaterial.set(cambio.materialId, [cambio]);
      });

      // En serie: si la tercera falla, las dos primeras YA se guardaron y hay
      // que decirlo con el número real en vez de dejar creer que no entró
      // ninguna.
      let guardados = 0;
      for (const [materialId, lineas] of porMaterial) {
        await updateMaterialApi({
          id: materialId,
          stock: lineas.map((linea) => ({
            warehouse_id: linea.warehouseId,
            stock_type_id: filters.stock_type_id ?? null,
            quantity: linea.cantidad,
          })),
        });
        guardados += 1;
      }

      toast({
        title:
          guardados === 1
            ? "Stock actualizado"
            : `Stock actualizado en ${guardados} materiales`,
        variant: "success",
      });
      setEdits({});
      setIsEditing(false);
      await loadRows(filters);
    } catch (error) {
      console.error("Error saving material stock:", error);
      toast({
        title: "No se pudo guardar el stock",
        description: "Revisa las cantidades y vuelve a intentarlo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSearchChange = (value: string) => setSearch(value);
  const onOpenFilterModal = () => setIsOpenFilterModal(true);
  const onCloseFilterModal = () => setIsOpenFilterModal(false);

  const onApplyFilter = async (newFilters: MaterialInventoryFilters) => {
    // Cambiar de filtro rehace la rejilla: lo tecleado dejaria de tener fila a
    // la que pertenecer.
    handleCancel();
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
    setIsOpenFilterModal(false);
    await loadRows(updated);
  };

  const onOrderChange = (order: string) => {
    const next = { ...filters, order: order === "none" ? null : order, page: 1 };
    setFilters(next);
    loadRows(next);
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const next = { ...prev, page };
      loadRows(next);
      return next;
    });
  };

  const onPageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const next = { ...prev, size, page: 1 };
      loadRows(next);
      return next;
    });
  };

  // Tiñe el botón «Filtrar». El orden y el buscador no cuentan: viven en la
  // barra, a la vista, y no hay nada escondido que avisar.
  const hasActiveFilters =
    (filters.owner ?? "all") !== "all" ||
    (filters.warehouse_id ?? null) !== null ||
    (filters.supplier_id ?? null) !== null ||
    (filters.stock_type_id ?? null) !== null ||
    (filters.min_stock ?? null) !== null ||
    (filters.max_stock ?? null) !== null;

  return {
    rows,
    columns,
    isEditing,
    isSaving,
    hasChanges,
    getStockValue,
    handleStockChange,
    handleEdit,
    handleCancel,
    handleSave,
    warehouses,
    suppliers,
    stockTypes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onOrderChange,
    onPageChange,
    onPageSizeChange,
  };
};
