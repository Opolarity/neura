import { CompanyDocumentHeader } from "@/shared/services/companyHeader";
import { SheetDocument, SheetField, SheetSection } from "@/shared/utils/sheetDocument";
import { formatDateDisplay } from "@/shared/utils/date";

/**
 * De lo que sabe el ERP al papel de la receta.
 *
 * Usa el mismo motor que la Orden de Producción, el Requerimiento y las dos
 * órdenes al proveedor —`shared/utils/sheetDocument`, A4 apaisada—. Era el
 * último papel que quedaba en el motor viejo, y eso se notaba: la A4 vertical
 * aprieta cinco columnas en 186 mm, así que el material y el «Tipo:» se leían
 * amontonados frente a los otros papeles del mismo lote.
 *
 * ## Lo que este papel NO imprime
 *
 * Ni las prendas de la orden, ni el stock, ni el faltante, ni la ruta: eso es
 * del requerimiento y de la Orden de Producción. La receta dice **qué lleva una
 * prenda y cuánto cuesta**, y ahí acaba.
 *
 * Las cantidades son el **consumo por unidad**, no de un lote: es lo que guarda
 * la receta. Multiplicarlo por las prendas de una orden lo hace el
 * requerimiento de esa orden. Lo dicen los propios rótulos —la columna
 * «Consumo» y el «TOTAL POR PRENDA»—, sin nota al pie.
 */

/**
 * Una excepción de consumo: una prenda concreta que no lleva la cantidad
 * general. Cero significa que esa prenda NO lleva el material.
 */
export interface RecipePdfMaterialVariation {
  /** «Chompa Fire · SKU-XL», tal como la nombra la ficha de la receta. */
  label: string;
  quantity: number;
}

/** Una línea de la receta: qué material lleva la prenda y cuánto. */
export interface RecipePdfMaterial {
  name: string;
  /** TELA, AVIOS… Es el «Tipo:» por el que el papel agrupa las líneas. */
  className: string | null;
  /** Consumo POR UNIDAD de prenda, no del lote. */
  unitConsumption: number | null;
  measurementUnit: string | null;
  unitCost: number | null;
  lineTotal: number;
  /**
   * Las prendas que se apartan del consumo general. Vacío -- lo normal --
   * significa que la general vale para todas. Es lo que en pantalla vive en
   * el desplegable «Por prenda»; sin esto el papel decía que todas las tallas
   * llevan lo mismo, y no era verdad.
   */
  variations?: RecipePdfMaterialVariation[];
}

export interface RecipePdfData {
  explosionId: number;
  description: string;
  /** Código del molde. Se imprime si existe. */
  modelCode?: string | null;
  /**
   * La prenda para la que se diseñó la receta. Sustituye al «Tipo de
   * desarrollo», que se retiró: su catálogo nunca se definió y no clasificaba
   * nada. La prenda sí dice de qué es este papel.
   */
  variationLabel: string | null;
  createdAt: string | null;
  company: CompanyDocumentHeader;
  materials: RecipePdfMaterial[];
  total: number;
}

const money = (value: number | null) =>
  value === null || value === undefined
    ? "—"
    : `S/ ${new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)}`;

/**
 * El costo unitario de un consumible baja del céntimo —hilo a 0.002 el metro—
 * y con dos decimales se imprime «S/ 0.00», que se lee como gratis. Por debajo
 * del céntimo se abren decimales hasta que el número diga algo.
 */
const unitMoney = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  const decimales = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;
  const numero = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(value);
  return `S/ ${numero}`;
};

const qty = (value: number | null) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/** Las líneas sin clase van juntas al final, no desperdigadas. */
const SIN_CLASE = "SIN CLASE";

/**
 * Deja el grupo sin clase al final y respeta el resto tal como llegó.
 *
 * `Map` conserva el orden de inserción y `sort` es estable, así que las clases
 * salen en el orden en que aparece su primer material: el orden en que se armó
 * la receta.
 */
const sinClaseAlFinal = (a: string, b: string): number => {
  if (a === SIN_CLASE) return 1;
  if (b === SIN_CLASE) return -1;
  return 0;
};

/** Deja fuera los rótulos sin valor: un hueco se lee como un dato que falta. */
const conValor = (
  fields: Array<{ label: string; value: string | null }>,
): SheetField[] =>
  fields
    .filter((field) => field.value !== null && field.value.trim() !== "")
    .map((field) => ({ label: field.label, value: field.value as string }));

/**
 * El texto de la celda «Por prenda»: una excepción por línea, para que en el
 * taller se lea prenda a prenda y no como una frase. El motor parte la celda
 * por los saltos de línea y le da a la fila el alto que haga falta.
 *
 * SOLO LAS QUE LO LLEVAN. Las excepciones en cero --la prenda que no usa el
 * material-- se imprimían como «X: no lo lleva», y en el taller eso es ruido:
 * lo que hay que cortar es lo que sí lleva, y una lista mitad cantidades
 * mitad negaciones se lee peor que una lista de cantidades.
 *
 * Lo que cuesta, y conviene saberlo: en el papel, una prenda con excepción en
 * cero pasa a ser indistinguible de una que usa el consumo general. Se acepta
 * a propósito -- la pantalla sigue enseñando las dos cosas.
 */
const porPrenda = (variations: RecipePdfMaterialVariation[]): string =>
  variations
    .filter((v) => v.quantity > 0)
    .map((v) => `${v.label}: ${qty(v.quantity)}`)
    .join("\n");

export const buildRecipeDocument = (data: RecipePdfData): SheetDocument => {
  // La columna «Por prenda» solo se dibuja si alguna línea la necesita: en
  // una receta sin excepciones sería una columna entera de guiones quitándole
  // sitio al material.
  // Se cuentan solo las que LO LLEVAN, que son las que se van a imprimir: un
  // material cuyas unicas excepciones sean ceros ya no aporta nada a la
  // columna, y contarlo dibujaria la columna entera para dejarla en blanco.
  const hayExcepciones = data.materials.some((material) =>
    (material.variations ?? []).some((variation) => variation.quantity > 0),
  );

  const porClase = new Map<string, RecipePdfMaterial[]>();
  data.materials.forEach((material) => {
    const clave = material.className ?? SIN_CLASE;
    const grupo = porClase.get(clave);
    if (grupo) grupo.push(material);
    else porClase.set(clave, [material]);
  });

  const sections: SheetSection[] = [...porClase.keys()]
    .sort(sinClaseAlFinal)
    .map((clase) => {
      const grupo = porClase.get(clase)!;
      return {
        title: clase,
        // El material sin ancho: se lleva lo que sobra, que en apaisada es
        // sitio de verdad. Es la única columna que lo necesita.
        columns: [
          { header: "Consumo", width: 26, align: "right" as const },
          { header: "U/M", width: 20 },
          { header: "Material" },
          // Al lado del consumo general que corrige. Sin ancho: se reparte
          // lo que sobra con el material, y en apaisada alcanza para ambos.
          ...(hayExcepciones ? [{ header: "Por prenda" }] : []),
          { header: "Costo unit.", width: 34, align: "right" as const },
          { header: "Importe", width: 34, align: "right" as const },
        ],
        rows: grupo.map((material) => [
          qty(material.unitConsumption),
          material.measurementUnit ?? "—",
          material.name,
          ...(hayExcepciones ? [porPrenda(material.variations ?? [])] : []),
          unitMoney(material.unitCost),
          money(material.lineTotal),
        ]),
        subtotal: {
          label: `SUBTOTAL ${clase}`,
          value: money(grupo.reduce((sum, m) => sum + m.lineTotal, 0)),
        },
      };
    });

  // Una receta sin materiales todavía no dice nada, pero existe: se dibuja la
  // sección con su aviso en vez de un papel sin tablas.
  if (sections.length === 0) {
    sections.push({
      title: "Materiales",
      columns: [{ header: "Material" }],
      rows: [],
      empty: "La receta todavía no tiene materiales.",
    });
  }

  return {
    title: "Receta",
    company: data.company,

    identification: conValor([
      { label: "Receta", value: data.description || `#${data.explosionId}` },
      { label: "Modelo", value: data.modelCode ?? null },
      { label: "Prenda", value: data.variationLabel },
      {
        label: "F. registro",
        value: data.createdAt ? formatDateDisplay(data.createdAt) : null,
      },
    ]),

    // El resumen va en la ficha IZQUIERDA y la derecha se queda vacía. No hay
    // una segunda ficha que poner: lo único que se sabe de la prenda --cuál es
    // y su molde-- ya está en la banda de arriba, y repetirlo debajo hacía leer
    // dos veces el mismo dato buscando la diferencia. Descolgado a la derecha
    // parecía que faltaba algo delante.
    generalTitle: "Materiales",
    general: conValor([
      {
        label: "Materiales distintos",
        value: data.materials.length > 0 ? String(data.materials.length) : null,
      },
      {
        label: "Tipos",
        value:
          porClase.size > 0
            ? [...porClase.keys()].sort(sinClaseAlFinal).join(", ")
            : null,
      },
    ]),

    technical: [],

    sections,

    totals: [{ label: "TOTAL POR PRENDA", value: money(data.total) }],

    observations: [],
    // Solo cuando la columna existe: la nota explica cómo leerla.
    footnotes: hayExcepciones
      ? [
          "Por prenda: las prendas listadas llevan esa cantidad en lugar del consumo general. Las que no aparecen usan el consumo general.",
        ]
      : [],
  };
};
