export interface PriceListItem {
  id: number;
  name: string;
  code: string | null;
  location: number;
  web: boolean;
  created_at: string | null;
}
