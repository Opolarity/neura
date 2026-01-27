export interface UsersApiResponse {
  usersdata: {
    data: Array<{
      id: number;
      name: string;
      role: string;
      show: boolean;
      role_id: number;
      branches: string;
      last_name: string;
      warehouse: string;
      created_at: string;
      last_name2: string;
      branches_id: number;
      middle_name: string;
      profiles_id: string;
      warehouse_id: number;
      document_number: string;
      document_type_id: number;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}

export interface Users {
  id: number;
  name: string;
  document_number: string;
  warehouse: string;
  branches: string;
  role: string;
  created_at: string;
}

export interface UsersFilters {
  person_type?: number | null;
  show?: number | null;
  role?: number | null;
  warehouses?: number | null;
  branches?: number;
  order?: string;
  search?: string;
  page?: Number;
  size?: Number;
}

export interface UsersFilterDraft {
  person_type?: number | null;
  show?: number | null;
  role?: number | null;
  warehouses?: number | null;
  branches?: number;
  order?: string;
}
