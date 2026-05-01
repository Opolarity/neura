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
}

export interface GetStockMovementRequestResponse {
  requests: MovementRequestListItem[];
  userWarehouseId: number | null;
  situations: MovementRequestSituationOption[];
}
