import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  PriceRule,
  PriceRuleFilters,
} from "../types/priceRule.types";
import { getPriceRules, deletePriceRule } from "../services/PriceRule.services";
import { adaptPriceRulesListResponse } from "../adapters/priceRule.adapter";

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
      toast.error("Error al cargar las reglas de precios");
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

  const openDeleteDialog = (rule: PriceRule) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRule) return;
    setIsDeleting(true);
    try {
      await deletePriceRule(selectedRule.id);
      toast.success("Regla de precios desactivada");
      setDeleteDialogOpen(false);
      setSelectedRule(null);
      loadRules(filters);
    } catch (error) {
      console.error("Error deleting price rule:", error);
      toast.error("Error al desactivar la regla de precios");
    } finally {
      setIsDeleting(false);
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
    refresh,
  };
}
