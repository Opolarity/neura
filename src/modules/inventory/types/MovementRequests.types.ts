import { ProductSales } from "./Movements.types";

export interface MovementRequestPayload {
  reason: string;
  out_warehouse_id: number;
  in_warehouse_id: number;
  items: MovementRequestItem[];
  module_code: string;
  status_code: string;
  situation_code: string;
  movement_type_code: string;
}

export interface MovementRequestItem {
  product_variation_id: number;
  quantity: number;
  stock_type_code: string;
}

export interface MovementRequestApiResponse {
  success: boolean;
  request: {
    id: number;
    created_by: string;
    out_warehouse_id: number;
    in_warehouse_id: number;
    created_at: string;
    updated_at: string;
  };
}

export interface SelectedRequestProduct extends ProductSales {
  quantity: number | null;
  sourceStock: number; // stock virtual del almacen origen (out_warehouse)
  myStock: number; // stock virtual del almacen del usuario (in_warehouse)
  disapproved?: boolean;
}
