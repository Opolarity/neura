import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Movement,
  MovementFilters,
  MovementType,
  MovementCategory,
  PaymentMethod,
  BusinessAccount,
  PaginationState,
  MovementSummary,
} from "../types/Movements.types";
import {
  movementsApi,
  movementTypesApi,
  movementCategoriesApi,
  paymentMethodsApi,
  businessAccountsApi,
} from "../services/movements.service";
import {
  movementAdapter,
  calculateMovementSummary,
} from "../adapters/Movement.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";

const DEFAULT_FILTERS: MovementFilters = {
  search: null,
  page: 1,
  size: 20,
  type: null,
  class: null,
  bussines_account: null,
  payment_method: null,
  start_date: null,
  end_date: null,
  branches: null,
  order: null,
};

export const useMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MovementFilters>(DEFAULT_FILTERS);
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);

  const [selectedMovements, setSelectedMovements] = useState<number[]>([]);

  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [categories, setCategories] = useState<MovementCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>(
    []
  );

  const [summary, setSummary] = useState<MovementSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 500);

  const loadMovements = async (currentFilters?: MovementFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await movementsApi(currentFilters);
      const { movements: formattedMovements, pagination: paginationData } =
        movementAdapter(response);

      setMovements(formattedMovements);
      setPagination(paginationData);

      const summaryData = calculateMovementSummary(formattedMovements);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error loading movements:", err);
      setError("Ocurrió un error al cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [types, cats, payments, accounts] = await Promise.all([
          movementTypesApi(),
          movementCategoriesApi(),
          paymentMethodsApi(),
          businessAccountsApi(),
        ]);

        setMovementTypes(types);
        setCategories(cats);
        setPaymentMethods(payments);
        setBusinessAccounts(accounts);
      } catch (err) {
        console.error("Error loading reference data:", err);
      }
    };

    loadReferenceData();
    loadMovements(filters);
  }, []);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch, page: 1 };
      setFilters(newFilters);
      loadMovements(newFilters);
    }
  }, [debouncedSearch]);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadMovements(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadMovements(newFilters);
  };

  const onOrderChange = (order: string) => {
    const newFilters = { ...filters, order: order === "none" ? null : order };
    setFilters(newFilters);
    loadMovements(newFilters);
  };

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };

  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const onApplyFilter = (newFilters: MovementFilters) => {
    const updatedFilters = { ...newFilters, page: 1, size: filters.size };
    setFilters(updatedFilters);
    loadMovements(updatedFilters);
    setIsOpenFilterModal(false);
  };

  const onClearFilters = () => {
    const clearedFilters = { ...DEFAULT_FILTERS, size: filters.size };
    setFilters(clearedFilters);
    setSearch("");
    loadMovements(clearedFilters);
  };

  const toggleSelectAll = () => {
    if (selectedMovements.length === movements.length) {
      setSelectedMovements([]);
    } else {
      setSelectedMovements(movements.map((m) => m.id));
    }
  };

  const toggleMovementSelection = (movementId: number) => {
    setSelectedMovements((prev) =>
      prev.includes(movementId)
        ? prev.filter((id) => id !== movementId)
        : [...prev, movementId]
    );
  };

  const goToAddExpense = () => {
    navigate("/movements/add/expenses");
  };

  const goToAddIncome = () => {
    navigate("/movements/add/income");
  };

  const goToMovementDetail = (id: number) => {
    navigate(`/movements/detail/${id}`);
  };

  const refreshMovements = () => {
    loadMovements(filters);
  };

  const hasActiveFilters = !!(
    filters.type ||
    filters.class ||
    filters.bussines_account ||
    filters.payment_method ||
    filters.start_date ||
    filters.end_date ||
    filters.branches
  );

  return {
    movements,
    pagination,
    summary,
    loading,
    error,
    hasActiveFilters,
    search,
    filters,
    isOpenFilterModal,

    movementTypes,
    categories,
    paymentMethods,
    businessAccounts,

    selectedMovements,

    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onClearFilters,
    onOrderChange,

    onPageChange,
    handlePageSizeChange,

    toggleSelectAll,
    toggleMovementSelection,

    goToAddExpense,
    goToAddIncome,
    goToMovementDetail,

    refreshMovements,
  };
};
