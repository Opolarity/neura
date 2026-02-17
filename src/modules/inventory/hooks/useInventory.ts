import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  inventoryApi,
  inventoryTypesApi,
  updateInventoryApi,
} from "../services/Inventory.service";
import {
  inventoryAdapter,
  inventoryTypesAdapter,
} from "../adapters/Inventory.adapter";
import {
  Inventory,
  InventoryFilters,
  InventoryPayload,
  InventoryTypes,
  Warehouse,
} from "../types/Inventory.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";

export const useInventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stockChanges, setStockChanges] = useState<Map<string, number | null>>(
    new Map(),
  );

  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    size: 20,
    search: null,
    warehouse: null,
    types: undefined,
    order: null,
    minstock: null,
    maxstock: null,
  });
  const [typeId, setTypeId] = useState<number>();

  const { toast } = useToast();

  const loadInitial = async () => {
    setLoading(true);
    try {
      const dataWareHouses = await getWarehousesIsActiveTrue();
      setWarehouses(dataWareHouses);
      const dataTypes = await inventoryTypesApi();
      const types = inventoryTypesAdapter(dataTypes);
      setInventoryTypes(types);

      // Initial load uses default filters
      await loadInventory(filters, true);
    } catch (error: any) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario inicial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (
    currentFilters: InventoryFilters = filters,
    isInitial: boolean = false,
  ) => {
    try {
      const dataInventory = await inventoryApi(currentFilters);
      const {
        data,
        pagination: newPagination,
        type_id,
      } = inventoryAdapter(dataInventory);

      setInventory(data);
      setPagination(newPagination);
      setFilters((prev) => ({ ...prev, types: type_id }));

      if (isInitial) {
        setTypeId(type_id);
      }
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
    } finally {
      setStockChanges(new Map());
    }
  };

  useEffect(() => {
    loadInitial();
  }, []); // Run once on mount

  // Debounced Search Effect
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      // Avoid resetting if null vs empty string difference unless semantic
      const searchTerm = debouncedSearch || null;
      if (searchTerm !== filters.search) {
        setFilters((prev) => {
          const newFilters = { ...prev, search: searchTerm, page: 1 };
          loadInventory(newFilters);
          return newFilters;
        });
      }
    }
  }, [debouncedSearch]);

  const getStockKey = (variationId: number, warehouseId: number) => {
    return `${variationId}-${warehouseId}`;
  };

  const handleStockChange = (
    item: Inventory,
    warehouseId: number,
    value: string,
  ) => {
    const key = getStockKey(item.variation_id, warehouseId);
    const newValue = value === "" ? null : parseInt(value, 10);
    const originalValue = getOriginalStock(item, warehouseId);

    setStockChanges((prev) => {
      const newMap = new Map(prev);
      // Si vuelve al valor original → eliminar cambio
      if (newValue === originalValue) {
        newMap.delete(key);
      } else {
        newMap.set(key, newValue);
      }
      return newMap;
    });
  };

  const getStockValue = (
    item: Inventory,
    warehouseId: number,
    originalStock?: number | null,
  ): number | "" => {
    const key = getStockKey(item.variation_id, warehouseId);
    if (stockChanges.has(key)) {
      // Si es null, retornar string vacío para el input, cuando se borre el valor
      return stockChanges.get(key) ?? "";
    }
    return originalStock ?? "";
  };

  const getOriginalStock = (
    item: Inventory,
    warehouseId: number,
  ): number | null => {
    return (
      item.stock_by_warehouse.find((w) => w.id === warehouseId)?.stock ?? null
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
    setStockChanges(new Map());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStockChanges(new Map());
  };

  const prepareInventoryPayload = () => {
    const payload: InventoryPayload[] = [];

    inventory.forEach((item) => {
      warehouses.forEach((warehouse) => {
        const key = getStockKey(item.variation_id, warehouse.id);
        const quantity = stockChanges.get(key);

        // Solo incluir si hubo cambios
        if (quantity !== undefined) {
          payload.push({
            product_variation_id: item.variation_id,
            movement_type_code: "MAN",
            movements_type_id: 6,
            stock_type_id: filters.types,
            quantity: quantity,
            warehouse_id: warehouse.id,
          });
        }
      });
    });

    return payload;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = prepareInventoryPayload();

      if (payload.length === 0) {
        setIsEditing(false);
        return;
      }

      console.log("Enviando a API:", payload);

      await updateInventoryApi(payload);

      toast({
        title: "Éxito",
        description: "Inventario actualizado correctamente",
      });

      setIsEditing(false);

      await loadInventory();
    } catch (error: any) {
      console.error("Error saving inventory:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Handlers
  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const newFilters = { ...prev, page };
      loadInventory(newFilters);
      return newFilters;
    });
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const newFilters = { ...prev, size, page: 1 };
      loadInventory(newFilters);
      return newFilters;
    });
  };

  const onOrderChange = (order: string) => {
    const orderValue = order === "none" ? null : order;
    setFilters((prev) => {
      const newFilters = { ...prev, order: orderValue, page: 1 };
      loadInventory(newFilters);
      return newFilters;
    });
  };

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };

  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const onApplyFilter = (newFilters: InventoryFilters) => {
    if (newFilters.search === null && search !== "") {
      setSearch("");
    }

    setPagination((prev) => ({ ...prev, p_page: 1 }));
    setFilters((prev) => {
      const updatedFilters = { ...newFilters, page: 1, size: prev.size };
      loadInventory(updatedFilters);
      return updatedFilters;
    });
    setIsOpenFilterModal(false);
  };

  const hasActiveFilters =
    filters.minstock !== null ||
    filters.maxstock !== null ||
    filters.warehouse !== null ||
    filters.types !== null;
  return {
    inventory,
    warehouses,
    inventoryTypes,
    typeId,
    loading,
    isEditing,
    isSaving,
    hasChanges: stockChanges.size > 0,
    // Filter State & Handlers
    search,
    pagination,
    isOpenFilterModal,
    filters,
    hasActiveFilters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    // Stock Handlers
    handleStockChange,
    getStockValue,
    handleEdit,
    handleCancel,
    handleSave,
  };
};