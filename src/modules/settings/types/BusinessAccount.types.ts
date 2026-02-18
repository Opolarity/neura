export interface BusinessAccountApiResponse {
  data: Array<{
    id: number;
    name: string;
    bank: string;
    account_number: number;
    total_amount: number;
    business_account_type_id: number;
    is_active: boolean;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface BusinessAccount {
  id: number;
  name: string;
  bank: string;
  account_number: number;
  total_amount: number;
  business_account_type_id: number;
  is_active: boolean;
}

export interface BusinessAccountFilters {
  account_id: number;
  page?: number;
  size?: number;
}

export interface BusinessAccountPayload {
  id?: number;
  name: string;
  bank: string;
  account_number: number;
  total_amount?: number;
  business_account_type_id: number;
  account_id?: number;
}
