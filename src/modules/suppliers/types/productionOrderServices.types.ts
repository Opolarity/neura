/**
 * Servicios vinculados a una orden de producción.
 *
 * La orden no referencia ni la cotización ni el servicio: el vínculo son las
 * filas de `production_order_info`, una por servicio. Lo que se vincula y se
 * desvincula es el SERVICIO — de una cotización de diez líneas entran a la
 * orden las tres que corresponden, y las otras siete van a otra orden o a
 * ninguna. La cotización solo sirve para encontrarlos.
 *
 * Las cantidades buenas y malas de cada paso no viven aquí: las registra
 * `supplier_service_situations`, colgado del servicio, con su historial.
 */
export interface LinkedService {
  id: number;
  code: string | null;
  description: string;
  /** De qué cotización viene. Sirve para agrupar, no para desvincular. */
  quotationId: number;
  quotationCode: string | null;
  quotationDescription: string;
  supplierName: string;
  promisedDate: string | null;
  situationId: number | null;
  situationName: string | null;
  situationCode: string | null;
  price: number | null;
  /** Falso si el servicio ya ingresó stock. */
  canUnlink: boolean;
}

/** Línea de una cotización, tal como se ofrece en el diálogo de vínculo. */
export interface QuotationServiceOption {
  id: number;
  code: string | null;
  description: string;
  /**
   * Una línea con material es una compra de insumo, no un servicio: no entra
   * en una orden de producción — la orden consume materiales por la explosión.
   * Lo impide `trg_production_order_info_no_material`.
   */
  materialId: number | null;
  /** Orden a la que ya pertenece, si pertenece a alguna. */
  productionOrderId: number | null;
  situationName: string | null;
  price: number | null;
}
