export type Warehouse = {
  id: number;
  name: string;
};

export type StockType = {
  id: number;
  code: string;
  name: string;
};

export type VariationStock = {
  warehouse_id: number;
  stock: number | undefined;
  stock_type_id?: number;
  hadInitialValue?: boolean;
};
