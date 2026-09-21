import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  classesByModuleCode,
  getWarehousesIsActiveTrue,
  typesByModuleCode,
} from "@/shared/services/service";
import { Class, Type } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import {
  getMaterialStockMovementDetailApi,
  getMaterialStockMovementsApi,
} from "../services/materialMovements.service";
import {
  materialMovementDetailAdapter,
  materialMovementsAdapter,
} from "../adapters/materialMovements.adapter";
import {
  MaterialMovement,
  MaterialMovementDetail,
  MaterialMovementsFilters,
} from "../types/materialMovements.types";

/** Los cuatro tipos de movimiento que son de materia prima. */
const MATERIAL_TYPE_CODES = ["MAT-BUY", "MAT-CON", "MAT-ADJ", "MAT-TRS"];

export const useMaterialMovements = () => {
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [movementTypes, setMovementTypes] = useState<Type[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materialClasses, setMaterialClasses] = useState<Class[]>([]);
  const [stockTypes, setStockTypes] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MaterialMovementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<MaterialMovementsFilters>({
    page: 1,
    size: 20,
    search: null,
    material_id: null,
    material_class_id: null,
    warehouse_id: null,
    stock_type_id: null,
    movement_type_id: null,
    start_date: null,
    end_date: null,
    in_out: null,
    order: null,
  });

  const { toast } = useToast();

  const loadMovements = async (
    currentFilters: MaterialMovementsFilters = filters,
  ) => {
    setLoading(true);
    try {
      const response = await getMaterialStockMovementsApi(currentFilters);
      const { data, pagination: newPagination } =
        materialMovementsAdapter(response);
      setMovements(data);
      setPagination(newPagination);
    } catch (error) {
      console.error("Error loading material movements:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos de materiales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [dataTypes, dataWarehouses, dataClasses, dataStockTypes] =
        await Promise.all([
          typesByModuleCode("STM"),
          getWarehousesIsActiveTrue(),
          classesByModuleCode("MAT"),
          classesByModuleCode("STK"),
        ]);

      // STM también contiene los tipos de producto (MER, TRS, PRD...). En
      // esta pantalla solo tienen sentido los de material.
      setMovementTypes(
        (dataTypes ?? []).filter((t) => MATERIAL_TYPE_CODES.includes(t.code)),
      );
      setWarehouses(dataWarehouses);
      setMaterialClasses(dataClasses);
      setStockTypes(dataStockTypes);

      await loadMovements(filters);
    } catch (error) {
      console.error("Error loading initial material movements data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos de materiales",
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
        loadMovements(next);
        return next;
      });
    }
  }, [debouncedSearch]);

  const onViewDetail = async (movementId: number) => {
    setSelectedMovementId(movementId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await getMaterialStockMovementDetailApi(movementId);
      setDetail(materialMovementDetailAdapter(response));
    } catch (error) {
      console.error("Error loading material movement detail:", error);
      setDetailError("No se pudo cargar el detalle del movimiento");
    } finally {
      setDetailLoading(false);
    }
  };

  const onCloseDetail = () => {
    setSelectedMovementId(null);
    setDetail(null);
    setDetailError(null);
  };

  const onSearchChange = (value: string) => setSearch(value);
  const onOpenFilterModal = () => setIsOpenFilterModal(true);
  const onCloseFilterModal = () => setIsOpenFilterModal(false);

  const onApplyFilterModal = async (newFilters: MaterialMovementsFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
    setIsOpenFilterModal(false);
    await loadMovements(updated);
  };

  const onOrderChange = (order: string) => {
    const next = { ...filters, order, page: 1 };
    setFilters(next);
    loadMovements(next);
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const next = { ...prev, page };
      loadMovements(next);
      return next;
    });
  };

  const onPageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const next = { ...prev, size, page: 1 };
      loadMovements(next);
      return next;
    });
  };

  const hasActiveFilters =
    (filters.material_class_id ?? null) !== null ||
    (filters.warehouse_id ?? null) !== null ||
    (filters.stock_type_id ?? null) !== null ||
    (filters.movement_type_id ?? null) !== null ||
    (filters.start_date ?? null) !== null ||
    (filters.end_date ?? null) !== null ||
    (filters.in_out ?? null) !== null;

  return {
    movements,
    movementTypes,
    warehouses,
    materialClasses,
    stockTypes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    selectedMovementId,
    detail,
    detailLoading,
    detailError,
    onViewDetail,
    onCloseDetail,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilterModal,
    onOrderChange,
    onPageChange,
    onPageSizeChange,
  };
};
