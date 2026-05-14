export interface MovementRequestListItem {
  id: number;
  createdBy: string;
  outWarehouseName: string;
  inWarehouseName: string;
  situationId: number | null;
  situationName: string;
  situationCode?: string | null;
  lastMessageWarehouseId: number | null;
  lastMessageWarehouseName: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type MovementRequestView = "received" | "sent";

export interface MovementRequestSituationOption {
  id: number;
  name: string;
  code: string;
}

export interface MovementRequestFilters {
  view: MovementRequestView;
  situation_id: number | null;
  page?: number;
  page_size?: number;
}

export interface MovementRequestApiItem {
  request_id: number;
  created_by: string;
  out_warehouse_name: string;
  in_warehouse_name: string;
  situation_id_result: number | null;
  situation_name: string;
  situation_code?: string | null;
  last_message_warehouse_id: number | null;
  last_message_warehouse_name: string | null;
  message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GetStockMovementRequestResponse {
  data: MovementRequestApiItem[];
  page: { total: number; p_page: number; p_size: number };
  userWarehouseId: number | null;
  situations: MovementRequestSituationOption[];
}

export function mapApiItemToListItem(item: MovementRequestApiItem): MovementRequestListItem {
  return {
    id: item.request_id,
    createdBy: item.created_by,
    outWarehouseName: item.out_warehouse_name,
    inWarehouseName: item.in_warehouse_name,
    situationId: item.situation_id_result,
    situationName: item.situation_name,
    situationCode: item.situation_code,
    lastMessageWarehouseId: item.last_message_warehouse_id,
    lastMessageWarehouseName: item.last_message_warehouse_name,
    message: item.message,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}
