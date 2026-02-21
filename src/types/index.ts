// Export all types from a single entry point
export * from './category';
export * from './term';
export * from './price';
export * from './warehouse';
export * from './product';
export * from './channel';


export type Type = {
  id: number;
  created_at: string;
  name: string;
  module_id: number;
  code: string;
};


export type Status = {
  id: number;
  created_at: string;
  name: string;
  module_id: number;
  code: string;
};

export type Situation = {
  id: number;
  status_id: number;
  name: string;
  created_at: string;
  module_id: number;
  code: string;
  order: number;
};

export type PriceList = {
  id: number;
  name: string;
  code: string;
  location: number;
  created_at: Date;
  web: boolean;
  is_active: boolean;
};

export type BusinessAccount = {
  id: number;
  name: string;
  bank: string;
  account_number: number;
  created_at: Date;
  total_amount: number;
  business_account_type_id: number;
  account_id: number;
  is_active: boolean;
};

export type PaymentMethod = {
  id: number;
  name: string;
  business_account_id: number;
  active: boolean;
  is_active: boolean;
  code?: string | null;
};

export type Class = {
  id: number;
  created_at: string;
  name: string;
  module_id: number;
  code: string;
};

export type Warehouse = {
  id: number;
  name: string;
  country_id: number;
  state_id: number;
  city_id: number;
  neighborhood_id: number;
  address: string;
  address_reference: string;
  web: boolean;
  is_active: boolean;
};

export type Branch = {
  id: number;
  name: string;
  warehouse_id: number;
  contry_id: number;
  state_id: number;
  city_id: number;
  neighborhood_id: number;
  address: string;
  address_reference: string;
  is_active: boolean;
  created_at: Date;
};
