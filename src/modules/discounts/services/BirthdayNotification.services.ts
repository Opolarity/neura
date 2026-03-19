import { supabase } from '@/integrations/supabase/client';
import { BirthdayProfileRaw } from '../types/birthdayNotification.types';

export const birthdayProfilesApi = async (): Promise<BirthdayProfileRaw[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('UID, phone, birthday_day, account_id, accounts(name)')
    .eq('is_active', true)
    .not('birthday_day', 'is', null)
    .not('phone', 'is', null);

  if (error) throw error;
  return (data ?? []) as unknown as BirthdayProfileRaw[];
};
