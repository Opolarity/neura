import { SheetSection } from "./sheetDocument";

/**
 * Las prendas de la Orden de Servicio como REJILLA: una fila por producto (y
 * color), una columna por talla.
 *
 * Los ítems de una orden son variaciones —producto + talla + color—, así que
 * listarlos uno a uno imprime el mismo polo seis veces. Al taller se le habla
 * de «Polo Básico - Negro: S 10, M 20, L 10», y eso es lo que se pinta aquí.
 *
 * ## Una tabla por sistema de tallas
 *
 * Las columnas salen del `sizeGroup` que trae cada prenda —«Tallas» (S, M,
 * L), «Tallas Pantalon» (28, 30, 32)—. Dos productos del mismo sistema
 * comparten tabla aunque no usen las mismas tallas: la celda que no aplica
 * queda vacía. Dos sistemas distintos son dos tablas, porque mezclar la S con
 * el 32 en una misma cabecera no se lee.
 *
 * Las prendas sin talla —sin producto asignado, o una variación sin término
 * de talla— van a una tabla aparte, con el formato de lista de siempre.
 *
 * ## El orden
 *
 * Las columnas van por `sizeTermId`: es el orden del catálogo (S, M, L, XL),
 * que es el que el taller espera; alfabético daría L, M, S, XL. Las filas van
 * en orden de aparición, que es el de la orden de producción.
 *
 * ## Cantidad desconocida
 *
 * Desde Avances el servicio sabe qué prendas cubre pero no cuántas de cada
 * una (`quantity` null). La celda lleva una marca en vez de un número, y no
 * hay totales que sumar: un cero se leería como «ninguna».
 */
export interface GridGarment {
  /** Fallback para nombrar la prenda cuando no hay producto ni talla. */
  label: string;
  sku: string | null;
  quantity: number | null;
  productTitle: string | null;
  sizeTermId: number | null;
  sizeTerm: string | null;
  sizeGroup: string | null;
  otherTerms: string | null;
}

const qty = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/** La marca de «esta talla va, pero no se sabe cuántas». */
// Un punto y no un check: la hoja va en Helvetica estandar de jsPDF, que no
// tiene el glifo del check y lo pintaria como basura.
const MARCA = "•";

/** «Polo Básico - Negro»: producto y color, sin la talla, que va en la columna. */
const rowName = (garment: GridGarment): string =>
  [garment.productTitle, garment.otherTerms].filter(Boolean).join(" - ") ||
  garment.label;

interface Fila {
  name: string;
  /** Por talla: la suma, o null si alguna prenda llegó sin cantidad. */
  porTalla: Map<string, number | null>;
}

interface Grupo {
  sizeGroup: string;
  /** Talla → id del término, para ordenar las columnas por catálogo. */
  tallas: Map<string, number>;
  filas: Map<string, Fila>;
}

const sumar = (a: number | null | undefined, b: number | null): number | null =>
  a === null || b === null ? null : (a ?? 0) + b;

/** La tabla de un sistema de tallas. */
const gridSection = (grupo: Grupo, title: string): SheetSection => {
  const columnas = [...grupo.tallas.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([talla]) => talla);

  const filas = [...grupo.filas.values()];
  // Si alguna celda no tiene cantidad, ningún total es de fiar: mejor ninguno.
  const conCantidades = filas.every((fila) =>
    [...fila.porTalla.values()].every((value) => value !== null),
  );

  const totalFila = (fila: Fila) =>
    [...fila.porTalla.values()].reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const totalGrupo = filas.reduce((sum, fila) => sum + totalFila(fila), 0);

  return {
    title,
    columns: [
      { header: "Prenda" },
      ...columnas.map((talla) => ({
        header: talla,
        width: 14,
        align: "right" as const,
      })),
      ...(conCantidades
        ? [{ header: "Total", width: 22, align: "right" as const }]
        : []),
    ],
    rows: filas.map((fila) => [
      fila.name,
      ...columnas.map((talla) => {
        if (!fila.porTalla.has(talla)) return "";
        const value = fila.porTalla.get(talla);
        return value === null || value === undefined ? MARCA : qty(value);
      }),
      ...(conCantidades ? [qty(totalFila(fila))] : []),
    ]),
    subtotal:
      conCantidades && totalGrupo > 0
        ? { label: "TOTAL PRENDAS", value: qty(totalGrupo) }
        : undefined,
  };
};

/** La lista de siempre, para lo que no tiene talla. */
const listSection = (garments: GridGarment[], title: string): SheetSection => {
  const conCantidades = garments.every((g) => g.quantity !== null);
  const total = garments.reduce((sum, g) => sum + (g.quantity ?? 0), 0);
  return {
    title,
    columns: [
      { header: "Cantidad", width: 24, align: "right" },
      { header: "SKU", width: 40, tone: "code" },
      { header: "Prenda" },
    ],
    rows: garments.map((g) => [
      g.quantity === null ? MARCA : qty(g.quantity),
      g.sku ?? "—",
      rowName(g),
    ]),
    subtotal:
      conCantidades && total > 0
        ? { label: "TOTAL PRENDAS", value: qty(total) }
        : undefined,
  };
};

/**
 * Las secciones de prendas del papel. Vacío → una sola sección vacía con su
 * `empty`, para que el bloque siga saliendo: un papel al que le falta un
 * bloque se lee como si se hubiera impreso mal.
 *
 * `emptyMessage` porque cada papel dice lo suyo cuando no hay prendas: la
 * Orden de Servicio habla de lo que cuelga de ella, y la de Producción de lo
 * que la orden todavía no tiene.
 */
export const garmentSections = (
  garments: GridGarment[],
  emptyMessage = "No hay prendas vinculadas a esta orden.",
): SheetSection[] => {
  if (garments.length === 0) {
    return [
      {
        title: "Prendas",
        columns: [
          { header: "Cantidad", width: 24, align: "right" },
          { header: "SKU", width: 40, tone: "code" },
          { header: "Prenda" },
        ],
        rows: [],
        empty: emptyMessage,
      },
    ];
  }

  const grupos = new Map<string, Grupo>();
  const sinTalla: GridGarment[] = [];

  for (const garment of garments) {
    if (garment.sizeTerm === null || garment.sizeGroup === null) {
      sinTalla.push(garment);
      continue;
    }
    const grupo = grupos.get(garment.sizeGroup) ?? {
      sizeGroup: garment.sizeGroup,
      tallas: new Map(),
      filas: new Map(),
    };
    grupos.set(garment.sizeGroup, grupo);

    // Sin id se manda al final; no debería pasar si la talla vino con nombre.
    grupo.tallas.set(
      garment.sizeTerm,
      garment.sizeTermId ?? Number.MAX_SAFE_INTEGER,
    );

    const name = rowName(garment);
    const fila = grupo.filas.get(name) ?? { name, porTalla: new Map() };
    grupo.filas.set(name, fila);
    // La misma talla dos veces en la misma fila (dos ítems de la misma
    // variación) se suma: es la misma prenda.
    fila.porTalla.set(
      garment.sizeTerm,
      fila.porTalla.has(garment.sizeTerm)
        ? sumar(fila.porTalla.get(garment.sizeTerm), garment.quantity)
        : garment.quantity,
    );
  }

  // Con un solo bloque el título es «Prendas» a secas; con varios, cada uno
  // dice de qué sistema de tallas es, que es lo que los distingue.
  const bloques = grupos.size + (sinTalla.length > 0 ? 1 : 0);
  const titulo = (sufijo: string) =>
    bloques > 1 ? `Prendas · ${sufijo}` : "Prendas";

  return [
    ...[...grupos.values()].map((grupo) =>
      gridSection(grupo, titulo(grupo.sizeGroup)),
    ),
    ...(sinTalla.length > 0 ? [listSection(sinTalla, titulo("Sin talla"))] : []),
  ];
};
