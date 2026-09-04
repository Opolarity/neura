import { buildEndpoint } from '@/shared/utils/query';
import type { BirthdayProfilesResponse } from '../types/birthdayNotification.types';
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { getTodayDate } from "@/shared/utils/date";

export interface BirthdayProfilesParams {
  page?: number;
  size?: number;
  search?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

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
    // Hoy en Lima, no en el huso del navegador: getTodayDate() es el unico
    // helper que decide ese dia, y es el mismo que usa el SP del otro lado.
    today: getTodayDate(),
  });

  const data = await invokeFunction<BirthdayProfilesResponse>(endpoint);

  return data ?? { data: [], page: { page, size, total: 0 } };
};
