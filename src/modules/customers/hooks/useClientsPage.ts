import { useState } from 'react';
import { ClientsFilters, ClientsOrderBy } from '../types';

interface UseClientsPageProps {
  filters: ClientsFilters;
  order: ClientsOrderBy;
  hasActiveFilters: boolean;
  onFiltersChange: (filters: ClientsFilters) => void;
  onOrderChange: (order: ClientsOrderBy) => void;
  clearFilters: () => void;
}

export const useClientsPage = (props: UseClientsPageProps) => {
  const { filters, onFiltersChange, clearFilters } = props;
  
  // Estado del modal de filtros
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Estado temporal del formulario de filtros
  const [tempFilters, setTempFilters] = useState<ClientsFilters>(filters);

  // Abrir modal de filtros
  const openFilterModal = () => {
    setTempFilters(filters);
    setIsFilterModalOpen(true);
  };

  // Cerrar modal de filtros
  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFiltersChange(tempFilters);
    closeFilterModal();
  };

  // Limpiar filtros desde el modal
  const handleClearFilters = () => {
    clearFilters();
    closeFilterModal();
  };

  // Actualizar filtro temporal
  const updateTempFilter = <K extends keyof ClientsFilters>(
    key: K,
    value: ClientsFilters[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    // Modal de filtros
    isFilterModalOpen,
    openFilterModal,
    closeFilterModal,
    tempFilters,
    updateTempFilter,
    applyFilters,
    handleClearFilters,
  };
};
