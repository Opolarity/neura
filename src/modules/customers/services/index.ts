import { supabase } from '@/integrations/supabase/client';
import { ClientsApiResponse, ClientsQueryParams } from '../types';

/**
 * Obtiene la lista de clientes con filtros, orden y paginación
 */
export const getClientsList = async (params: ClientsQueryParams): Promise<ClientsApiResponse> => {
  const { data, error } = await supabase.rpc('get_clients_list', {
    p_search: params.search || null,
    p_min_purchases: params.filters.minPurchases,
    p_max_purchases: params.filters.maxPurchases,
    p_min_amount: params.filters.minAmount,
    p_max_amount: params.filters.maxAmount,
    p_date_from: params.filters.dateFrom,
    p_date_to: params.filters.dateTo,
    p_order: params.order,
    p_page: params.page,
    p_size: params.size,
  });

  if (error) throw error;
  
  return data as unknown as ClientsApiResponse;
};

/**
 * Elimina un cliente por ID
 */
export const deleteClient = async (clientId: number): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
};
