import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/shared/hooks/use-toast';
import {
  BirthdayProfile,
  BirthdayProfilesPage,
} from '../types/birthdayNotification.types';
import { birthdayProfilesApi } from '../services/BirthdayNotification.services';
import { birthdayNotificationAdapter } from '../adapters/birthdayNotification.adapter';

const DEFAULT_SIZE = 20;

export const useBirthdayNotifications = () => {
  const [profiles, setProfiles] = useState<BirthdayProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<BirthdayProfilesPage>({
    page: 1,
    size: DEFAULT_SIZE,
    total: 0,
  });

  // Contador de peticiones: pulsar rapido en el paginador solapa varias y no
  // tienen por que responder en orden. Solo la ultima lanzada pinta.
  const requestRef = useRef(0);

  const fetchProfiles = useCallback(async (page: number, size: number) => {
    const requestId = ++requestRef.current;
    setLoading(true);

    try {
      const response = await birthdayProfilesApi({ page, size });

      if (requestId !== requestRef.current) return;

      setProfiles(birthdayNotificationAdapter(response.data));
      setPagination(response.page);
    } catch (error) {
      if (requestId !== requestRef.current) return;

      console.error(error);
      toast({ title: 'Error al cargar cumpleaños', variant: 'destructive' });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles(1, DEFAULT_SIZE);
  }, [fetchProfiles]);

  const handlePageChange = (page: number) => {
    fetchProfiles(page, pagination.size);
  };

  const handlePageSizeChange = (size: number) => {
    fetchProfiles(1, size);
  };

  return {
    profiles,
    loading,
    pagination,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
};
