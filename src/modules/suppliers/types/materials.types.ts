/** Un término de una variación: Negro (Color), 14 cm (Largo). */
export interface MaterialVariationTerm {
  id: number;
  name: string;
  groupId: number;
  groupName: string;
}

/**
 * Una variación del material: lo que se compra, se guarda y se consume
 * ("Jersey 30/1 · Negro"). Lleva su costo, su proveedor y su stock.
 */
export interface MaterialVariationRow {
  id: number;
  code: string;
  /** Material y términos: "Jersey 30/1 · Negro". */
  label: string;
  /** Solo los términos: "Negro". Null en la variación de un material simple. */
  termsLabel: string | null;
  terms: MaterialVariationTerm[];
  unitCost: number | null;
  supplierId: number | null;
  supplierName: string | null;
  isActive: boolean;
  stock: number;
  stockEntries: MaterialStockEntry[];
}

export interface Material {
  id: number;
  name: string;
  quantity: number;
  measurementUnit: string;
  /** Con una variación, su costo; con varias, el menor ("desde"). */
  unitCost: number | null;
  /** El mayor de sus variaciones activas. */
  unitCostMax: number | null;
  variationsCount: number;
  suppliersCount: number;
  /** Activas primero. */
  variations: MaterialVariationRow[];
  /** La HOJA: de la que cuelga el material. Con el árbol, el color. */
  materialClassId: number;
  materialClassName: string;
  /**
   * La RAÍZ de esa clase: TELA o AVIOS.
   *
   * La hoja sola dice «DENIM», que no distingue una tela de un avío. Sube el
   * backend por `parent_class_id`; una clase sin padre es su propia raíz.
   */
  materialRootClassId: number;
  materialRootClassName: string;
  /** Nullable: un insumo puede darse de alta antes de tener proveedor. */
  supplierId: number | null;
  supplierName: string;
  lastServiceReference: number | null;
  /** URLs públicas de sus fotos, en el orden en que se subieron. */
  images: string[];
  createdAt: string;
}

export interface MaterialsFilters {
  /** Un solo material: lo usa la ficha para cargar el suyo. */
  material_id?: number | null;
  search?: string | null;
  material_class_id?: number | null;
  supplier_id?: number | null;
  page?: number;
  size?: number;
}

export interface MaterialClass {
  id: number;
  name: string;
  code?: string | null;
  /**
   * De qué clase cuelga esta. La columna existía en `classes` desde antes pero
   * nadie la escribía, así que hasta ahora todas llegaban en null.
   *
   * En snake y no en camel a propósito: este servicio devuelve las filas de
   * PostgREST tal cual, sin adapter, y no toca reestructurarlo de paso.
   */
  parent_class_id?: number | null;
}

export interface SupplierOption {
  id: number;
  name: string;
}

export interface CreateMaterialData {
  name: string;
  /** Opcional: null lo deja sin proveedor asignado. */
  supplier_id: number | null;
  material_class_id: number;
  /** Codigo del catalogo de unidades ('MTR', 'KG'...). */
  measurement_unit: string;
  /**
   * El stock, por almacen y tipo. Sustituye al numero suelto: el ajuste de un
   * material repartido tiene que saber en que almacen va.
   */
  stock?: MaterialStockPayload[];
  unit_cost?: number | null;
  /** URLs ya subidas. En update reemplaza la lista entera. */
  images?: string[];
  last_service_reference?: number | null;
}

export interface UpdateMaterialData extends Partial<CreateMaterialData> {
  id: number;
}

/** Unidad de medida del catálogo (`types` del módulo MAT). */
export interface MeasurementUnit {
  id: number;
  /** Lo que se guarda y lo que viaja al backend: 'MTR', 'KG'… */
  code: string;
  name: string;
}

/**
 * El stock del material en un almacen y tipo concretos. Misma forma que
 * VariationStock en productos: una entrada plana por combinacion, y la
 * pantalla la busca por (almacen, tipo).
 */
export interface MaterialStockEntry {
  warehouseId: number;
  stockTypeId: number;
  /** undefined = la celda esta vacia, que NO es lo mismo que cero. */
  stock: number | undefined;
}

/** Lo que se manda al backend por cada linea. */
export interface MaterialStockPayload {
  /** De qué variación es el saldo. Sin ella, el backend usa la única del material. */
  material_variation_id?: number | null;
  warehouse_id: number;
  stock_type_id: number | null;
  /** El saldo QUE DEBE QUEDAR en ese almacen; el backend guarda la diferencia. */
  quantity: number;
}

/**
 * Una línea del historial de precios: qué se pagó por el material y a quién.
 *
 * No hay tabla de historial — sale de los servicios de proveedor del material.
 * `isCurrent` marca el que hoy alimenta `unitCost` y el proveedor de la ficha,
 * y lo decide el backend con `materials.last_service_reference`: deducirlo
 * aquí con otro criterio dejaría la ficha marcando uno y el precio viniendo
 * de otro.
 */
export interface MaterialPriceHistoryRow {
  serviceId: number;
  serviceCode: string | null;
  serviceDescription: string;
  quotationId: number;
  quotationCode: string | null;
  quotationDescription: string;
  supplierId: number | null;
  supplierName: string;
  quantity: number | null;
  /** El total de la línea, no el unitario. */
  price: number | null;
  unitCost: number | null;
  measurementUnit: string;
  situationName: string;
  createdAt: string;
  isCurrent: boolean;
}
