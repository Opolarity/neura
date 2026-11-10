export interface AccountsApiResponse {
  accountsdata: {
    data: Array<{
      id: number;
      name: string;
      middle_name: string;
      last_name: string;
      last_name2: string;
      document_type_id: number;
      document_type_name: string | null;
      document_number: string;
      show: boolean;
      types_name: string;
      has_account: boolean | null;
      /** Aplica "Acceso a la cuenta": solo CLI + USE, un perfil, sin roles del ERP. */
      account_access?: boolean | null;
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
  documentTypeName: string;
  documentNumber: string;
  typeName: string;
  hasAccount: boolean;
  canManageAccess: boolean;
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