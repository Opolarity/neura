export interface PriceListItem {
  id: number;
  name: string;
  code: string | null;
  location: string;
  web: boolean;
  created_at: string | null;
}
