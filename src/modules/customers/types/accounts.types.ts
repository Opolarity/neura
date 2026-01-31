export interface AccountsApiResponse {
  accountsdata: {
    data: Array<{
      id: number;
      name: string;
      middle_name: string;
      last_name: string;
      last_name2: string;
      document_type_id: number;
      document_number: string;
      show: boolean;
      types_name: string;
      total_purchases: number;
      total_spent: number;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    }
  }
}

export interface Accounts {
  id: number;
  name: string;
  middle_name: string;
  last_name: string;
  last_name2: string;
  document_type_id: number;
  document_number: string;
  show: boolean;
  types_name: string;
}

export interface Account {
  id: number;
  fullName: string;
  documentNumber: string;
  typeName: string;
  show?: boolean;
  documentTypeId?: number;
  totalPurchases: number;
  totalSpent: number;
}

export interface AccountsFilters {
  show?: boolean | null;
  account_type?: number | null;
  order?: string | null;
  search?: string | null;
  page?: number;
  size?: number;
}

export interface AccountsFilterDraft {
  show?: number | null;
  account_type?: number | null;
  order?: boolean | null;
}

export interface AccountType {
  id: number;
  name: string;
  code: string;
}

export interface AccountsTypesApiResponse {
  types: AccountType;
}