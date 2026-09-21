import { CompanyDocumentHeader } from "@/shared/services/companyHeader";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  SheetColumn,
  SheetDocument,
  SheetField,
  SheetSection,
} from "@/shared/utils/sheetDocument";
import { RequirementMaterial } from "./types";

/**
 * De lo que sabe el ERP a lo que necesita el papel.
 *
 * Esta es la mitad del documento que SÍ sabe de producción: qué es una orden,
 * de dónde sale un faltante, por qué el costo es el congelado y no el vigente.
 * El render no sabe nada de esto y no debe saberlo — por eso la frontera.
 *
 * ## Lo que este documento NO puede decir todavía
 *
 * El formato textil del que viene esta pantalla pide bastantes datos que en
 * multicliente **no tienen columna donde vivir**: diseñador, fit, estilo,
 * cliente, temporada, n.º de muestra, n.º de molde, código de tela, color,
 * tipo de cálculo, ubicación en la prenda, márgenes y precios de lista.
 *
 * No se inventan ni se dejan como rótulos vacíos. Los campos opcionales viajan
 * en `null` y el render, que decide sus columnas por lo que traen los datos,
 * simplemente no las dibuja. El día que el esquema los tenga, se rellenan aquí
 * y aparecen solas — sin tocar el dibujo.
 */

/** Un material del requerimiento, ya sumado para toda la orden. */
export interface MaterialRequirementPdfRow {
  name: string;
  /** TELA, AVIOS… La clase del catálogo. Es la categoría del papel. */
  className: string | null;
  measurementUnit: string;
  /** Lo que consume la orden entera: consumo unitario × prendas. */
  required: number;
  stock: number;
  /** De ese stock, lo que ya está en un almacén de taller. */
  stockAtSuppliers: number;
  /** Cuánto hay que comprar. Cero si el stock alcanza. */
  missing: number;
  unitCost: number | null;
  totalCost: number | null;
}

export interface MaterialRequirementPdfData {
  /** La orden que se está requiriendo. Su código identifica el papel. */
  orderId: number;
  orderCode: string | null;
  /** Notas de la orden. Son las observaciones del documento. */
  orderNotes: string | null;
  createdAt: string;
  /** Entrega comprometida de la orden. */
  promisedDate?: string | null;
  /** Quién creó la orden. Es a quien se le pregunta. */
  requesterName: string | null;
  /** Categorías del producto, ya unidas sin repetir. */
  categories: string[];
  /** Códigos de modelo de las recetas que cubren las prendas. */
  modelCodes: string[];
  /** Prendas de la orden: es lo que multiplica el consumo unitario. */
  totalGarments: number;
  company: CompanyDocumentHeader;
  materials: MaterialRequirementPdfRow[];
  estimatedTotalCost: number;
}

const qty = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

const money = (value: number) => `S/ ${value.toFixed(2)}`;

/** Lo que hay, unido. Vacío devuelve null y el campo no se pinta. */
const lista = (values: string[]): string | null =>
  values.filter(Boolean).join(", ") || null;

/** Solo los campos con valor: un rótulo sobre un guion no informa de nada. */
const conValor = (
  fields: Array<{ label: string; value: string | null }>,
): SheetField[] =>
  fields
    .filter((field) => Boolean(field.value))
    .map((field) => ({ label: field.label, value: field.value as string }));

/** El orden en que se leen las categorías: primero la tela, al final lo suelto. */
/**
 * Las clases salen en el orden en que aparece su primer material, que es el
 * orden en que se armo la receta.
 *
 * Aqui habia una lista fija --TELA, COMPLEMENTO, ENTRETELA, AVIOS-- y detras
 * lo demas por alfabeto. Imponia un orden que no es el de nadie: un tenant que
 * llama a sus clases de otra forma caia entero en el alfabeto, y quien arma la
 * receta empezando por los avios veia el papel al reves de como la escribio.
 *
 * `Map` conserva el orden de insercion, asi que basta con no reordenar: lo
 * unico que se mueve es el grupo sin clase, que va al final.
 */
const SIN_CLASIFICAR = "SIN CLASIFICAR";

/** Deja el grupo sin clase al final y respeta el resto tal como llego. */
const sinClaseAlFinal = (a: string, b: string): number => {
  if (a === SIN_CLASIFICAR) return 1;
  if (b === SIN_CLASIFICAR) return -1;
  return 0;
};

/**
 * Qué columnas lleva ESTA categoría.
 *
 * Se decide por lo que traen sus filas, no por una lista fija: los avíos no
 * tienen color y las telas sí, y una columna de guiones ocupa el mismo ancho
 * que una con datos pero no dice nada. Material se queda con lo que sobra, que
 * es la que de verdad necesita sitio.
 */
const columnsFor = (
  rows: RequirementMaterial[],
): { columns: SheetColumn[]; cells: Array<(m: RequirementMaterial) => string> } => {
  const some = (pick: (m: RequirementMaterial) => unknown) =>
    rows.some((row) => {
      const value = pick(row);
      return value !== null && value !== undefined && value !== "";
    });

  const columns: SheetColumn[] = [];
  const cells: Array<(m: RequirementMaterial) => string> = [];

  const add = (
    column: SheetColumn,
    cell: (m: RequirementMaterial) => string,
  ) => {
    columns.push(column);
    cells.push(cell);
  };

  // La descripción sin ancho: se lleva lo que sobre.
  add({ header: "Material" }, (m) => m.description || "—");

  if (some((m) => m.code)) {
    add({ header: "Código", width: 26, tone: "code" }, (m) => m.code ?? "—");
  }
  if (some((m) => m.colorName || m.colorCode)) {
    add(
      { header: "Color", width: 34 },
      (m) => [m.colorCode, m.colorName].filter(Boolean).join(" · ") || "—",
    );
  }

  add({ header: "U/M", width: 16, tone: "muted" }, (m) => m.unit || "—");
  add({ header: "Cantidad", width: 26, align: "right" }, (m) => qty(m.quantity));

  if (some((m) => m.stock)) {
    add({ header: "Stock", width: 24, align: "right", tone: "muted" }, (m) =>
      m.stock === null ? "—" : qty(m.stock),
    );
  }
  // Solo cuando hay algo fuera: en el caso normal --todo en mis almacenes--
  // la columna no se dibuja y el papel queda como estaba.
  if (some((m) => m.stockAtSuppliers)) {
    add(
      { header: "En talleres", width: 26, align: "right", tone: "muted" },
      (m) =>
        m.stockAtSuppliers && m.stockAtSuppliers > 0
          ? qty(m.stockAtSuppliers)
          : "—",
    );
  }
  if (some((m) => m.missing)) {
    // Es la columna por la que se lee este papel: en cero se deja el guion
    // para que solo salten a la vista los que hay que comprar.
    add({ header: "Faltante", width: 26, align: "right" }, (m) =>
      m.missing && m.missing > 0 ? qty(m.missing) : "—",
    );
  }
  if (some((m) => m.calculationType)) {
    add({ header: "Tipo cálculo", width: 30, tone: "muted" }, (m) =>
      m.calculationType ?? "—",
    );
  }
  if (some((m) => m.location)) {
    add({ header: "Ubicación", width: 28, tone: "muted" }, (m) => m.location ?? "—");
  }
  if (some((m) => m.unitCost)) {
    add({ header: "C. unit.", width: 24, align: "right", tone: "muted" }, (m) =>
      m.unitCost === null ? "—" : money(m.unitCost),
    );
  }
  if (some((m) => m.totalCost)) {
    add({ header: "Importe", width: 28, align: "right" }, (m) =>
      m.totalCost === null ? "—" : money(m.totalCost),
    );
  }

  return { columns, cells };
};

export const buildMaterialRequirementDocument = (
  data: MaterialRequirementPdfData,
): SheetDocument => {
  const orderLabel = data.orderCode ?? `#${data.orderId}`;

  // En el mismo orden en que salen las secciones: si el papel empieza por TELA,
  // el rotulo de arriba no puede decir "AVIOS, TELA".
  const clases = [
    ...new Set(
      data.materials
        .map((material) => material.className)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort(sinClaseAlFinal);

  const materials: RequirementMaterial[] = data.materials.map((material) => {
    const categoria = material.className ?? SIN_CLASIFICAR;
    return {
      category: categoria.toUpperCase(),
      categoryLabel: categoria.toUpperCase(),
      description: material.name,
      // Sin columna en el esquema. Van en null a propósito: el render omite
      // la columna entera en vez de llenarla de guiones.
      code: null,
      colorCode: null,
      colorName: null,
      calculationType: null,
      location: null,
      unit: material.measurementUnit,
      quantity: material.required,
      stock: material.stock,
      stockAtSuppliers: material.stockAtSuppliers,
      missing: material.missing,
      unitCost: material.unitCost,
      totalCost: material.totalCost,
    };
  });

  // Por categoría, en el orden en que aparece cada una en la receta.
  const grupos = new Map<string, RequirementMaterial[]>();
  materials.forEach((material) => {
    const grupo = grupos.get(material.category);
    if (grupo) grupo.push(material);
    else grupos.set(material.category, [material]);
  });

  const sections: SheetSection[] = [...grupos.keys()]
    .sort(sinClaseAlFinal)
    .map((categoria) => {
      const filas = grupos.get(categoria) ?? [];
      const { columns, cells } = columnsFor(filas);
      return {
        title: filas[0]?.categoryLabel || categoria,
        columns,
        rows: filas.map((material) => cells.map((cell) => cell(material))),
      };
    });

  return {
    title: "Requerimiento de materiales",
    company: data.company,

    // Lo que identifica el papel de un vistazo. El «N.º de requerimiento» se
    // deriva del código de la orden y no es una serie propia: un requerimiento
    // es siempre de UNA orden, así que numerarlo aparte solo daría dos números
    // que decir por teléfono para señalar lo mismo.
    identification: conValor([
      { label: "N.º de requerimiento", value: `REQ-${orderLabel}` },
      { label: "Orden de producción", value: orderLabel },
      {
        label: "Fecha de emisión",
        value: formatDateDisplay(new Date().toISOString()),
      },
      { label: "Fecha de la orden", value: formatDateDisplay(data.createdAt) },
      {
        label: "Entrega comprometida",
        value: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
      },
      { label: "Cantidad solicitada", value: qty(data.totalGarments) },
    ]),

    // Quién lo pide y para qué.
    general: conValor([
      { label: "Solicitante", value: data.requesterName },
      { label: "Categoría", value: lista(data.categories) },
    ]),

    // Con qué se fabrica. Va aparte de lo general porque son dos preguntas
    // distintas, y mezclarlas dejaba una cabecera de ocho cosas sin jerarquía.
    technical: conValor([
      { label: "Código de modelo", value: lista(data.modelCodes) },
      { label: "Tipo de material", value: lista(clases) },
      { label: "Materiales distintos", value: String(data.materials.length) },
    ]),

    sections,

    totals: [
      {
        label: "Materiales por comprar",
        value: String(
          data.materials.filter((material) => material.missing > 0).length,
        ),
      },
      { label: "Costo estimado", value: money(data.estimatedTotalCost) },
    ],

    // Lo que alguien escribió a mano para ESTE pedido. Va en su recuadro, no
    // mezclado con las notas fijas: son advertencias, no metodología.
    observations: data.orderNotes?.trim() ? [data.orderNotes.trim()] : [],

    footnotes: [
      "El faltante compara contra el stock total del material, sin repartirlo entre las prendas que lo comparten.",
      "«En talleres» es la parte de ese stock que ya está en un almacén de proveedor: cuenta como stock, pero no hace falta volver a enviarla.",
      "El costo es el que la orden congeló al asignar cada receta, no el precio vigente del material.",
    ],
  };
};
