import { ClientApiData, Client, ClientsApiResponse, ClientsPagination } from '../types';

/**
 * Adapta un cliente del formato API al formato UI
 */
export const adaptClient = (apiClient: ClientApiData): Client => {
  const nameParts = [
    apiClient.name,
    apiClient.middle_name,
    apiClient.last_name,
    apiClient.last_name2
  ].filter(Boolean);

  return {
    id: apiClient.id,
    fullName: nameParts.join(' '),
    documentNumber: apiClient.document_number,
    purchaseCount: apiClient.purchase_count,
    totalAmount: apiClient.total_amount,
    createdAt: apiClient.created_at,
  };
};

/**
 * Adapta la lista de clientes del formato API al formato UI
 */
export const adaptClientsList = (response: ClientsApiResponse): {
  clients: Client[];
  pagination: ClientsPagination;
} => {
  return {
    clients: response.data.map(adaptClient),
    pagination: {
      page: response.page.page,
      size: response.page.size,
      total: response.page.total,
    },
  };
};
