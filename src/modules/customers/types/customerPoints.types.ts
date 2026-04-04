export interface CustomerPointsApiRow {
  id: number;
  points: number | null;
  orders_quantity: number;
  name: string | null;
  middle_name: string | null;
  last_name: string | null;
  last_name2: string | null;
  document_number: string | null;
  document_type_name: string | null;
  created_at: string | null;
  email: string | null;
}

export interface CustomerPointsApiResponse {
  page: {
    page: number;
    size: number;
    total: number;
  };
  data: CustomerPointsApiRow[];
}

export interface CustomerPoint {
  id: number;
  points: number | null;
  ordersQuantity: number;
  fullName: string;
  documentNumber: string;
  documentType: string;
  customerSince: string;
  email: string | null;
}

export interface CustomerPointsMovementApiRow {
  id: number;
  quantity: number | null;
  note: string | null;
  created_at: string | null;
  accounts: {
    name: string | null;
    middle_name: string | null;
    last_name: string | null;
    last_name2: string | null;
    document_number: string | null;
  };
}

export interface CustomerPointsMovement {
  id: number;
  quantity: number;
  note: string | null;
  createdAt: string;
  fullName: string;
  documentNumber: string;
}
