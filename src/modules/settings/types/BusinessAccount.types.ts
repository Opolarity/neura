export interface BusinessAccountApiResponse {
  data: Array<{
    id: number;
    name: string;
    bank: string;
    account_number: number;
    total_amount: number;
    business_account_type_id: number;
    account_id: number;
    // T-274: sucursal de la cuenta. NULL para bancos y cuentas corporativas;
    // obligatoria para las de tipo Caja.
    branch_id: number | null;
    branch_name?: string | null;
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
  account_id: number;
  branch_id: number | null;
  branch_name?: string | null;
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
  branch_id?: number | null;
}
