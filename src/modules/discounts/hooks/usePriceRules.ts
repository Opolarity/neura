import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  PriceRule,
  PriceRuleFilters,
} from "../types/priceRule.types";
import {
  getPriceRules,
  deletePriceRule,
  deletePriceRulesBulk,
  updatePriceRule,
  updateBulkPriceRule,
} from "../services/PriceRule.services";
import { adaptPriceRulesListResponse } from "../adapters/priceRule.adapter";
import { toastError } from "@/shared/utils/toastError";

const DEFAULT_FILTERS: PriceRuleFilters = {
  page: 1,
  size: 20,
  search: "",
  rule_type: null,
  is_active: "true",
  price_list_id: null,
};

export function usePriceRules() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<PriceRuleFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PriceRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"true" | "false">("true");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const loadRules = useCallback(async (currentFilters: PriceRuleFilters) => {
    setLoading(true);
    try {
      const response = await getPriceRules(currentFilters);
      const { rules, pagination: pag } = adaptPriceRulesListResponse(response);
      setRules(rules);
      setPagination({
        p_page: pag.current,
        p_size: pag.size,
        total: pag.total,
      });
    } catch (error) {
      console.error("Error loading price rules:", error);
      toastError(error, "Error al cargar las reglas de precios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules(filters);
  }, [filters, loadRules]);

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  const onSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const onFilterChange = (key: keyof PriceRuleFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Tras eliminar, si la página actual se quedó sin filas hay que retroceder en
  // vez de mostrar una tabla vacía. Cambiar `filters` ya dispara el useEffect
  // que recarga, así que no hace falta llamar a loadRules a mano.
  // Mismo criterio que modules/settings/hooks/usePriceList.ts.
  const reloadAfterDelete = (deletedCount: number) => {
    if (deletedCount >= rules.length && filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
      return;
    }
    loadRules(filters);
  };

  const openDeleteDialog = (rule: PriceRule) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRule) return;
    const deletedId = selectedRule.id;
    setIsDeleting(true);
    try {
      await deletePriceRule(deletedId);
      toast({ title: "Regla de precios eliminada", variant: "success" });
      setDeleteDialogOpen(false);
      setSelectedRule(null);
      // Si la fila estaba marcada, sacarla de la selección: si no, quedaría en
      // selectedIds y acabaría en la siguiente acción masiva.
      setSelectedIds((prev) => {
        if (!prev.has(deletedId)) return prev;
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      reloadAfterDelete(1);
    } catch (error) {
      console.error("Error deleting price rule:", error);
      toastError(error, "Error al eliminar la regla de precios");
    } finally {
      setIsDeleting(false);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setIsBulkDeleting(true);
    try {
      const result = await deletePriceRulesBulk(ids);
      const deleted = result?.deleted ?? ids.length;

      toast({
        title: deleted === 1
          ? "Regla de precios eliminada"
          : `${deleted} reglas de precios eliminadas`,
        variant: "success",
      });
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      reloadAfterDelete(ids.length);
    } catch (error) {
      console.error("Error bulk deleting price rules:", error);
      toastError(error, "Error al eliminar las reglas de precios");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(rules.map((r) => r.id)) : new Set());
  };

  const toggleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setIsApplyingBulk(true);
    try {
      const ids = [...selectedIds];
      const result = await updateBulkPriceRule(ids, bulkStatus === "true");

      // El backend ignora las reglas eliminadas, así que puede actualizar menos
      // de las pedidas. Antes esto pasaba en silencio con un toast de éxito.
      const updated = typeof result?.updated === "number" ? result.updated : ids.length;
      if (updated < ids.length) {
        toast({
          title: `Se actualizaron ${updated} de ${ids.length} reglas. El resto ya no existe o fue eliminado.`,
          variant: "warning",
        });
      } else {
        toast({
          title: bulkStatus === "true"
            ? "Reglas activadas correctamente"
            : "Reglas desactivadas correctamente",
          variant: "success",
        });
      }
      setSelectedIds(new Set());
      loadRules(filters);
    } catch (error) {
      console.error("Error applying bulk status:", error);
      toastError(error, "Error al actualizar el estado de las reglas");
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const refresh = () => loadRules(filters);

  return {
    rules,
    loading,
    filters,
    pagination,
    deleteDialogOpen,
    selectedRule,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onFilterChange,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDelete,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    openBulkDeleteDialog,
    handleBulkDelete,
    isBulkDeleting,
    refresh,
    selectedIds,
    bulkStatus,
    setBulkStatus,
    isApplyingBulk,
    toggleSelectAll,
    toggleSelectRow,
    applyBulkStatus,
  };
}
