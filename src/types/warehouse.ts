export type Warehouse = {
  id: number;
  name: string;
  /**
   * Direccion del almacen. Es NOT NULL en la base y los servicios la traen con
   * su select("*") desde siempre: lo que faltaba era declararla aqui. Sin ella
   * la guia de remision de un despacho a taller no sabe de donde sale la
   * mercaderia.
   */
  address?: string;
  address_reference?: string | null;
  /**
   * Nulo = almacen propio. Con valor = almacen de ese proveedor. No hay tabla
   * aparte para los almacenes de taller: son estas mismas filas con el
   * proveedor puesto (columna agregada con el port del modulo de Produccion).
   */
  supplier_id?: number | null;
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
