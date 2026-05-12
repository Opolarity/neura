import { useState, useEffect } from "react";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import { getVisualEdits } from "../services/MediaGallery.service";
import { adaptMediaGalleryResponse } from "../adapters/MediaGallery.adapter";
import type { MediaGalleryFilters, MediaGalleryItem } from "../types/MediaGallery.types";

export const useMediaGallery = () => {
  const [items, setItems] = useState<MediaGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<MediaGalleryFilters>({
    page: 1,
    size: 20,
    startDate: null,
    endDate: null,
  });

  const loadData = async (currentFilters?: MediaGalleryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = currentFilters ?? filters;
      const response = await getVisualEdits(filtersToUse);
      const { items, pagination } = adaptMediaGalleryResponse(response);
      setItems(items);
      setPagination(pagination);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al cargar la galería");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const applyFilters = (newFilters: MediaGalleryFilters) => {
    const updated = { ...newFilters, page: 1 };
    setFilters(updated);
    loadData(updated);
  };

  const refetch = () => loadData();

  return {
    items,
    loading,
    error,
    filters,
    pagination,
    onPageChange,
    handlePageSizeChange,
    applyFilters,
    refetch,
  };
};
