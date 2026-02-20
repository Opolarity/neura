import { BusinessAccountApiResponse } from "../types/BusinessAccount.types";

export function getBusinessAccountsAdapter(response: BusinessAccountApiResponse) {
  const formatted = response.data.map((item) => ({
    id: item.id,
    name: item.name,
    bank: item.bank,
    account_number: item.account_number,
    total_amount: item.total_amount,
    business_account_type_id: item.business_account_type_id,
    account_id: item.account_id,
    is_active: item.is_active,
  }));

  const page = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { data: formatted, pagination: page };
}
