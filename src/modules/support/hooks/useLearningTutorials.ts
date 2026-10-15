/**
 * Catálogo de tutoriales de "Aprender".
 *
 * Se pide todo una sola vez y se filtra en el cliente: son pocos videos y así
 * cambiar de categoría o escribir en el buscador es instantáneo, sin una
 * consulta por tecla. Mismo modelo useState/useEffect que el resto del módulo
 * de soporte (sin React Query).
 *
 * El error de carga se muestra dentro de la vista y es reintentable: sin
 * toast, igual que el listado de tickets.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { adaptLearningTutorials } from "../adapters/learningTutorials.adapter";
import { getLearningTutorials } from "../services/LearningTutorials.service";
import type { SupportServiceError } from "../types/Support.types";
import type {
  LearningCatalog,
  LearningFilters,
  LearningTutorial,
} from "../types/Learning.types";

const EMPTY_CATALOG: LearningCatalog = { categories: [], tags: [], tutorials: [] };
const DEFAULT_FILTERS: LearningFilters = { search: "", category: null, tag: null };

export interface LearningErrorState {
  message: string;
  code: string;
}

/** Minúsculas y sin tildes, para que "configuracion" encuentre "Configuración". */
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const matchesSearch = (tutorial: LearningTutorial, term: string) => {
  if (!term) return true;
  const haystack = normalize(
    [
      tutorial.title,
      tutorial.description ?? "",
      tutorial.category?.name ?? "",
      ...tutorial.tags.map((t) => t.name),
    ].join(" "),
  );
  return haystack.includes(term);
};

export const useLearningTutorials = () => {
  const [catalog, setCatalog] = useState<LearningCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [errorState, setErrorState] = useState<LearningErrorState | null>(null);
  const [filters, setFilters] = useState<LearningFilters>(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const next = adaptLearningTutorials(await getLearningTutorials());
        if (cancelled) return;
        setCatalog(next);
        setErrorState(null);
        setLoaded(true);
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading learning tutorials:", error);
        const err = error as SupportServiceError;
        setErrorState({
          message: err?.message || "No se pudieron cargar los tutoriales.",
          code: err?.code ?? "unknown",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const tutorials = useMemo(() => {
    const term = normalize(filters.search);
    return catalog.tutorials.filter(
      (t) =>
        (!filters.category || t.category?.slug === filters.category) &&
        (!filters.tag || t.tags.some((tag) => tag.slug === filters.tag)) &&
        matchesSearch(t, term),
    );
  }, [catalog.tutorials, filters]);

  const hasActiveFilters =
    filters.search.trim() !== "" || filters.category !== null || filters.tag !== null;

  return {
    catalog,
    tutorials,
    loading,
    /** Ya hubo al menos una carga correcta (para no tapar la vista al reintentar). */
    loaded,
    errorState,
    filters,
    hasActiveFilters,
    refetch: useCallback(() => setReloadKey((k) => k + 1), []),
    onSearchChange: useCallback(
      (search: string) => setFilters((prev) => ({ ...prev, search })),
      [],
    ),
    onCategoryChange: useCallback(
      (category: string | null) => setFilters((prev) => ({ ...prev, category })),
      [],
    ),
    onTagChange: useCallback(
      (tag: string | null) => setFilters((prev) => ({ ...prev, tag })),
      [],
    ),
    clearFilters: useCallback(() => setFilters(DEFAULT_FILTERS), []),
  };
};
