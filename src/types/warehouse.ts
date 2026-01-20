export type Warehouse = {
  id: number;
  name: string;
};

export type VariationStock = {
  warehouse_id: number;
  stock: number | undefined;
  hadInitialValue?: boolean;
};
