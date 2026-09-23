import { useEffect, useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { addCalendarDays, getTodayDate } from "@/shared/utils/date";
import { getAuditActorsApi, getAuditLogApi } from "../services/auditLog.service";
import { auditLogAdapter } from "../adapters/auditLog.adapter";
import type {
  AuditActor,
  AuditLogEntry,
  AuditLogFilters,
  PaginationState,
} from "../types/AuditLog.types";

/** Por defecto: últimos 7 días en hora Lima (igual que el SP sin fechas). */
export const buildDefaultAuditFilters = (size = 20): AuditLogFilters => {
  const today = getTodayDate();
  return {
    page: 1,
    size,
    search: null,
    start_date: addCalendarDays(today, -6),
    end_date: today,
    table: null,
    action: null,
    actor_source: null,
    actor_id: null,
    entity: null,
    entity_id: null,
  };
};

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const useAuditLog = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AuditLogFilters>(() => buildDefaultAuditFilters());
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [actors, setActors] = useState<AuditActor[]>([]);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const load = async (current: AuditLogFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { entries: rows, pagination: page } = auditLogAdapter(await getAuditLogApi(current));
      setEntries(rows);
      setPagination(page);
    } catch (err) {
      console.error("Error loading audit log:", err);
      setEntries([]);
      setError(errorMessage(err, "Ocurrió un error al cargar la auditoría"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
    getAuditActorsApi()
      .then((res) => setActors(res.actors ?? []))
      .catch((err) => console.error("Error loading audit actors:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const value = debouncedSearch.trim() === "" ? null : debouncedSearch.trim();
    if (value !== filters.search) {
      const next = { ...filters, search: value, page: 1 };
      setFilters(next);
      load(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const apply = (next: AuditLogFilters) => {
    setFilters(next);
    load(next);
  };

  const onPageChange = (page: number) => apply({ ...filters, page });
  const onPageSizeChange = (size: number) => apply({ ...filters, size, page: 1 });

  const onApplyFilter = (next: AuditLogFilters) => {
    apply({ ...next, search: filters.search, page: 1, size: filters.size });
    setIsOpenFilterModal(false);
  };

  const onClearFilters = () => {
    setSearch("");
    apply(buildDefaultAuditFilters(filters.size));
  };

  const defaults = buildDefaultAuditFilters();
  const hasActiveFilters = !!(
    filters.table ||
    filters.action ||
    filters.actor_source ||
    filters.actor_id ||
    filters.entity ||
    filters.start_date !== defaults.start_date ||
    filters.end_date !== defaults.end_date
  );

  return {
    entries,
    pagination,
    loading,
    error,
    search,
    filters,
    actors,
    hasActiveFilters,
    isOpenFilterModal,
    selected,
    onSearchChange: setSearch,
    onOpenFilterModal: () => setIsOpenFilterModal(true),
    onCloseFilterModal: () => setIsOpenFilterModal(false),
    onApplyFilter,
    onClearFilters,
    onPageChange,
    onPageSizeChange,
    onSelect: setSelected,
    onCloseDetail: () => setSelected(null),
    refresh: () => load(filters),
  };
};
