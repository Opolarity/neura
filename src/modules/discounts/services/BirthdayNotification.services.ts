import { supabase } from '@/integrations/supabase/client';
import { buildEndpoint } from '@/shared/utils/query';
import type { BirthdayProfilesResponse } from '../types/birthdayNotification.types';

export interface BirthdayProfilesParams {
  page?: number;
  size?: number;
  search?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

/**
 * Fecha de hoy del navegador en YYYY-MM-DD, construida con los getters
 * locales y no con toISOString(), que convierte a UTC y en Peru (UTC-5)
 * devolveria el dia siguiente a partir de las 19:00.
 */
const getLocalToday = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * Cumpleanos en la ventana de -2 a +1 dias, paginados y filtrados en el
 * servidor. La consulta directa a `profiles` que habia antes se topaba
 * con el limite de filas de PostgREST y dejaba fuera cumpleanos reales
 * en cuanto la tabla crecia.
 */
export const birthdayProfilesApi = async (
  params: BirthdayProfilesParams = {},
): Promise<BirthdayProfilesResponse> => {
  const page = params.page ?? DEFAULT_PAGE;
  const size = params.size ?? DEFAULT_SIZE;

  const endpoint = buildEndpoint('get-birthday-notifications', {
    page,
    size,
    search: params.search,
    today: getLocalToday(),
  });

  const { data, error } = await supabase.functions.invoke<BirthdayProfilesResponse>(endpoint);

  if (error) throw error;

  return data ?? { data: [], page: { page, size, total: 0 } };
};
