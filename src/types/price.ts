export type PriceList = {
  id: number;
  name: string;
  code: string;
};

export type VariationPrice = {
  price_list_id: number;
  price: number | undefined;
  sale_price: number | null | undefined;
};
