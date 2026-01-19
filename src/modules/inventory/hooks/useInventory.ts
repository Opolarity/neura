import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  inventoryApi,
  updateInventoryApi,
  wareHouseListApi,
} from "../services/Inventory.service";
import { inventoryAdapter } from "../adapters/Inventory.adapter";
import {
  Inventory,
  InventoryFilters,
  InventoryPayload,
  Warehouse,
} from "../types/Inventory.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const useInventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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

  const { toast } = useToast();

  const loadInitial = async () => {
    setLoading(true);
    try {
      const dataWareHouses = await wareHouseListApi();
      setWarehouses(dataWareHouses);

      // Initial load uses default filters
      await loadInventory(filters);

    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (currentFilters: InventoryFilters = filters) => {
    try {
      const dataInventory = await inventoryApi(currentFilters);
      const { data, pagination: newPagination } = inventoryAdapter(dataInventory);

      setInventory(data);
      setPagination(newPagination);
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
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
    variationId: number,
    warehouseId: number,
    value: string,
  ) => {
    const key = getStockKey(variationId, warehouseId);
    const numericValue = value === "" ? null : parseInt(value) || 0;

    setStockChanges((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, numericValue);
      return newMap;
    });
  };

  const getStockValue = (
    variationId: number,
    warehouseId: number,
    originalStock: number,
  ) => {
    const key = getStockKey(variationId, warehouseId);
    if (stockChanges.has(key)) {
      const value = stockChanges.get(key);
      return value === null ? "" : value;
    }
    return originalStock;
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

        if (quantity !== undefined) {
          const stockInfo = item.stock_by_warehouse.find(
            (s) => s.id === warehouse.id,
          );

          payload.push({
            product_variation_id: item.variation_id,
            quantity: quantity,
            stock_type_code: stockInfo?.stock_type ?? "PRD",
            movement_type_code: "MAN",
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
      setStockChanges(new Map());

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


  return {
    inventory,
    warehouses,
    loading,
    isEditing,
    isSaving,
    hasChanges: stockChanges.size > 0,
    // Filter State & Handlers
    search,
    pagination,
    isOpenFilterModal,
    filters,
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
