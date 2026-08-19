import { useState, useEffect } from 'react';
import { toast } from "@/shared/hooks/use-toast";
import { BirthdayProfile } from '../types/birthdayNotification.types';
import { birthdayProfilesApi } from '../services/BirthdayNotification.services';
import { birthdayNotificationAdapter } from '../adapters/birthdayNotification.adapter';

export const useBirthdayNotifications = () => {
  const [profiles, setProfiles] = useState<BirthdayProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const raw = await birthdayProfilesApi();
        setProfiles(birthdayNotificationAdapter(raw));
      } catch (error) {
        console.error(error);
        toast({ title: 'Error al cargar cumpleaños', variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return { profiles, loading };
};
