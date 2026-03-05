export interface MovementRequestListItem {
  id: number;
  createdBy: string;
  outWarehouseName: string;
  inWarehouseName: string;
  situationName: string;
  lastMessageWarehouseName: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string | null;
}
