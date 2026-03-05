export interface MovementRequestListItem {
  id: number;
  createdBy: string;
  outWarehouseName: string;
  inWarehouseName: string;
  statusName: string;
  situationName: string;
  message: string | null;
  createdAt: string;
  updatedAt: string | null;
}
