import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/shared/hooks/use-toast';
import {
  BirthdayProfile,
  BirthdayProfilesPage,
} from '../types/birthdayNotification.types';
import { birthdayProfilesApi } from '../services/BirthdayNotification.services';
import { birthdayNotificationAdapter } from '../adapters/birthdayNotification.adapter';
import { toastError } from "@/shared/utils/toastError";

const DEFAULT_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

export const useBirthdayNotifications = () => {
  const [profiles, setProfiles] = useState<BirthdayProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<BirthdayProfilesPage>({
    page: 1,
    size: DEFAULT_SIZE,
    total: 0,
  });
  const [search, setSearch] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Contador de peticiones: al teclear rapido pueden solaparse varias y no
  // tienen por que responder en orden. Solo la ultima lanzada pinta.
  const requestRef = useRef(0);

  const fetchProfiles = useCallback(
    async (page: number, size: number, searchValue: string) => {
      const requestId = ++requestRef.current;
      setLoading(true);

      try {
        const response = await birthdayProfilesApi({
          page,
          size,
          search: searchValue || undefined,
        });

        if (requestId !== requestRef.current) return;

        setProfiles(birthdayNotificationAdapter(response.data));
        setPagination(response.page);
      } catch (error) {
        if (requestId !== requestRef.current) return;

        console.error(error);
        toastError(error, 'Error al cargar cumpleaños');
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchProfiles(1, DEFAULT_SIZE, '');

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProfiles]);

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchProfiles(1, pagination.size, value),
      SEARCH_DEBOUNCE_MS,
    );
  };

  const handlePageChange = (page: number) => {
    fetchProfiles(page, pagination.size, search);
  };

  const handlePageSizeChange = (size: number) => {
    fetchProfiles(1, size, search);
  };

  return {
    profiles,
    loading,
    pagination,
    search,
    onSearchChange: handleSearchChange,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
};
