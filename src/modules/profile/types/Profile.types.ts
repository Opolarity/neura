export interface MyProfile {
  id: number;
  name: string;
  middle_name: string;
  last_name: string;
  last_name2: string;
  document_type_id: number | null;
  document_number: string;
  user_name: string;
  email: string;
  phone: number | string | null;
  role_ids: number[];
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  neighborhood_id: number | null;
  address: string;
  address_reference: string;
  warehouse_id: number | null;
  branch_id: number | null;
}

/** Lo único que `my-profile` deja cambiar al propio usuario. */
export interface MyProfileUpdate {
  phone: string;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  neighborhood_id: number | null;
  address: string;
  address_reference: string;
  password?: string;
}
