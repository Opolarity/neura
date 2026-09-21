import { CompanyDocumentHeader } from "@/shared/services/companyHeader";

/**
 * La forma que consume el PDF de Requerimiento de Materiales.
 *
 * Es DATOS YA RESUELTOS: textos formateados y números crudos, sin nada del
 * dominio. El render no sabe qué es una orden de producción ni de dónde sale
 * un faltante, y quien arma esto no sabe cuántos milímetros mide una columna.
 * Esa frontera es lo que permite cambiar el papel sin tocar la consulta, y al
 * revés.
 */

/** Un dato con su rótulo, para las fichas de la cabecera. */
export interface RequirementField {
  label: string;
  value: string;
}

/**
 * Un material del requerimiento.
 *
 * Casi todo es opcional a propósito. Las columnas del PDF se deciden por lo
 * que traen los datos —si ninguna fila de una sección tiene color, la columna
 * Color no se dibuja—, así que un campo sin origen simplemente no ocupa
 * espacio en vez de dejar una columna de guiones.
 */
export interface RequirementMaterial {
  /**
   * La categoría a la que pertenece. Es una clave libre, no un enum: las
   * clases de material se dan de alta en el catálogo del tenant, y encerrarlas
   * en una lista cerrada obligaría a tocar el PDF cada vez que alguien crea
   * una clase nueva.
   */
  category: string;
  /** Cómo se titula la categoría en el papel. */
  categoryLabel: string;

  description: string;
  code: string | null;
  colorCode: string | null;
  colorName: string | null;
  unit: string;
  quantity: number;

  stock: number | null;
  /**
   * La parte del stock que está en un almacén de taller. Null o cero = la
   * columna no se dibuja, que es el caso de siempre; con valor avisa de que
   * ese saldo ya salió y no está a mano para volver a mandarlo.
   */
  stockAtSuppliers: number | null;
  /** Lo que hay que comprar. Cero cuando el stock alcanza. */
  missing: number | null;
  unitCost: number | null;
  totalCost: number | null;

  calculationType: string | null;
  location: string | null;
}

export interface RequirementDocument {
  company: CompanyDocumentHeader;
  /**
   * Identifica el papel: número, orden, fechas y cantidades. Va en la banda de
   * arriba, que es lo que se mira al cogerlo de una pila.
   */
  identification: RequirementField[];
  /** Ficha de datos generales: quién lo pide, de qué modelo. */
  general: RequirementField[];
  /**
   * Ficha técnica. Vacía = la sección no se dibuja.
   *
   * Está separada de la general porque son dos preguntas distintas —quién y
   * para qué, frente a con qué se fabrica— y mezclarlas convertía la cabecera
   * en una lista de doce cosas sin jerarquía.
   */
  technical: RequirementField[];

  materials: RequirementMaterial[];
  /**
   * En qué orden salen las categorías. Las que no estén aquí van detrás, por
   * orden alfabético: una clase nueva aparece sola, en su sitio, sin que nadie
   * la registre.
   */
  categoryOrder?: string[];

  totals: RequirementField[];
  /** Advertencias de este pedido en concreto. Vacío = no se dibuja el bloque. */
  observations: string[];
  /** Cómo leer el documento. Van al pie, en pequeño. */
  footnotes: string[];
}
