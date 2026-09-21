import { CompanyDocumentHeader } from "@/shared/services/companyHeader";
import {
  SheetDocument,
  SheetImage,
  SheetSection,
} from "@/shared/utils/sheetDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import { GridGarment, garmentSections } from "@/shared/utils/garmentGrid";

/**
 * De lo que sabe el ERP al papel de la Orden de Producción.
 *
 * Comparte formato con el Requerimiento de Materiales —el motor es el mismo,
 * `shared/utils/sheetDocument`— y eso es deliberado: los dos papeles salen del
 * mismo lote y se leen juntos en el taller, así que tienen que verse iguales.
 * Lo que cambia entre ellos es lo que dicen, no cómo lo dicen.
 *
 * ## Lo que este papel NO imprime
 *
 * El formato textil de referencia trae temporada, marca, patrón, horma, n.º de
 * programa, n.º de pedido, fecha de inicio de programación y un código de
 * barras. `production_orders` solo tiene nombre, cantidad, descripción, clase y
 * fechas. Dejar esos rótulos en blanco daría un papel que parece incompleto en
 * vez de uno que dice lo que sabe. Lo más cercano que sí existe —categorías y
 * etiquetas del producto— sale como ficha, y solo si la orden las tiene.
 *
 * Tampoco hay un rol por línea de material (Forro A, Forro Falsa, Moño): eso es
 * la función del material dentro de la prenda y no se guarda en ningún sitio.
 * La clase es lo más fino que hay hoy.
 */

/**
 * Una prenda de la orden, tal como se manda a producir.
 *
 * Es el mismo tipo que usa la Orden de Servicio: las dos pintan la rejilla de
 * tallas con `garmentSections`, y separar los tipos solo abriría la puerta a
 * que un papel dejara de aceptar lo que el otro manda.
 */
export type ProductionOrderPdfGarment = GridGarment;

/**
 * Un paso de la ruta: por dónde pasa la orden.
 *
 * Es lo que el taller necesita saber además de qué se produce y qué lleva:
 * en qué orden se hacen las cosas y qué falta en cada punto.
 */
export interface ProductionOrderPdfProcess {
  /** La posición en la ruta, base 1. */
  order: number;
  processName: string | null;
  processGroupName: string | null;
  /** Los códigos de los servicios que cubren el paso. */
  serviceCodes: string[];
  requested: number;
  advanced: number;
  remaining: number;
  isComplete: boolean;
  isBlocked: boolean;
}

/**
 * Un material del requerimiento.
 *
 * YA NO SE USA en este papel: el detalle de materiales se fue al Requerimiento
 * de Materiales, que es donde se consulta. Se conserva el tipo exportado
 * porque describe la forma que ese otro documento sigue recibiendo.
 */
export interface ProductionOrderPdfMaterial {
  name: string;
  /** TELA, AVIOS… Es la clase por la que se agrupan las secciones. */
  className: string | null;
  required: number;
  measurementUnit: string;
  /** Cuánto falta comprar. Cero si el stock alcanza. */
  missing: number;
}

export interface ProductionOrderPdfData {
  orderId: number;
  name: string;
  /** OP-0001 / OM-0001. Se imprime si existe. */
  code?: string | null;
  description: string | null;
  /** Clase de la orden: Producción o Muestra. */
  className: string;
  statusLabel: string;
  createdAt: string;
  /** Entrega comprometida, si la orden la tiene. */
  promisedDate?: string | null;
  company: CompanyDocumentHeader;
  garments: ProductionOrderPdfGarment[];
  /** Categorías y etiquetas de los productos de la orden, sin repetir. */
  categories: string[];
  tags: string[];
  /** La ruta de la orden, en orden de paso. Vacía = no está configurada. */
  processes?: ProductionOrderPdfProcess[];
  /**
   * Los materiales ya no se imprimen aquí, así que no hacen falta. Se dejan
   * OPCIONALES en vez de quitarlos del tipo para no romper a quien todavía los
   * mande: llegan y se ignoran.
   */
  materials?: ProductionOrderPdfMaterial[];
  estimatedMaterialCost?: number;
  /**
   * Fotos de las prendas, ya embebidas.
   *
   * Llegan resueltas y no como urls porque descargarlas es asíncrono y esto no
   * lo es: quien llama las trae, y si alguna no se pudo bajar simplemente no
   * viene. Un papel sin foto sigue sirviendo.
   */
  images?: SheetImage[];
}

const qty = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/** Lo que hay, unido. Vacío devuelve null y el campo no se pinta. */
const lista = (values: string[]): string | null =>
  values.filter(Boolean).join(", ") || null;

/** Solo los campos con valor: un rótulo sobre un guion no informa de nada. */
const conValor = (fields: Array<{ label: string; value: string | null }>) =>
  fields
    .filter((field) => Boolean(field.value))
    .map((field) => ({ label: field.label, value: field.value as string }));

export const buildProductionOrderDocument = (
  data: ProductionOrderPdfData,
): SheetDocument => {
  const totalGarments = data.garments.reduce((sum, g) => sum + g.quantity, 0);
  const orderLabel = data.code ?? `#${data.orderId}`;

  // ---- Las prendas: qué se produce ---------------------------------------
  //
  // Como REJILLA, igual que la Orden de Servicio: una fila por producto y
  // color, una columna por talla y una tabla por sistema de tallas. Antes era
  // una fila por variación --el mismo polo seis veces-- y el comentario de
  // aquí decía que una rejilla no era posible «porque no hay catálogo de
  // tallas del que sacar columnas». Dejó de ser cierto cuando el backend
  // empezó a mandar la talla separada del resto de términos.
  //
  // Se pierden las columnas SKU y U/M: el sku de una fila sería el de varias
  // tallas a la vez, y la unidad era «UND» escrito a mano. Es lo que cuesta
  // que los dos papeles del mismo lote se lean igual. Lo que no tiene talla
  // sigue saliendo en lista, con su sku.
  const prendas = garmentSections(
    data.garments,
    "La orden todavía no tiene prendas.",
  );

  // ---- La ruta: por dónde pasa -------------------------------------------
  //
  // Detrás de las prendas, que es el orden en que se lee el papel: qué se
  // produce y por dónde pasa.
  //
  // CON QUÉ está hecho ya no sale aquí. El detalle de materiales --una
  // sección por clase, con lo requerido y lo que falta-- tiene su propio
  // papel, el Requerimiento de Materiales, y repetirlo en este alargaba la
  // Orden de Producción con lo que a un taller de corte o costura no le hace
  // falta para trabajar.
  const ruta: SheetSection = {
    title: "Ruta de producción",
    columns: [
      { header: "Paso", width: 14, align: "right" as const, tone: "muted" as const },
      { header: "Proceso" },
      { header: "Grupo", width: 38, tone: "muted" as const },
      { header: "Servicios", width: 44, tone: "code" as const },
      { header: "Pedido", width: 24, align: "right" as const },
      { header: "Avanzado", width: 26, align: "right" as const },
      { header: "Faltante", width: 24, align: "right" as const },
      { header: "Estado", width: 28 },
    ],
    rows: (data.processes ?? []).map((paso) => [
      String(paso.order),
      paso.processName ?? "Sin proceso",
      paso.processGroupName ?? "—",
      paso.serviceCodes.length > 0 ? paso.serviceCodes.join(", ") : "—",
      qty(paso.requested),
      qty(paso.advanced),
      // En cero se deja el guion: lo que tiene que saltar a la vista es lo
      // que queda por hacer.
      paso.remaining > 0 ? qty(paso.remaining) : "—",
      paso.isComplete
        ? "Culminado"
        : paso.isBlocked
          ? "Bloqueado"
          : paso.advanced > 0
            ? "En proceso"
            : "Pendiente",
    ]),
    empty: "La orden todavía no tiene ruta configurada.",
  };

  const sections: SheetSection[] = [...prendas, ruta];

  return {
    title: "Orden de producción",
    company: data.company,

    identification: conValor([
      { label: "Orden de producción", value: orderLabel },
      { label: "Nombre", value: data.name },
      { label: "Clase", value: data.className },
      { label: "Estado", value: data.statusLabel },
      { label: "Fecha de registro", value: formatDateDisplay(data.createdAt) },
      {
        label: "Entrega comprometida",
        value: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
      },
    ]),

    // Qué se produce.
    general: conValor([
      { label: "Total de prendas", value: qty(totalGarments) },
      { label: "Categorías", value: lista(data.categories) },
      { label: "Etiquetas", value: lista(data.tags) },
    ]),

    // Vacía: lo que había aquí --tipo de material, cuántos distintos, cuántos
    // por comprar-- era todo del requerimiento, y se fue con él.
    technical: [],

    images: data.images ?? [],
    imagesTitle: "Referencia de la prenda",

    sections,

    // Sin totales: el único que había era el costo estimado de materiales.
    totals: [],

    // El campo llegó a llamarse «Descripción» en el formulario y
    // «Observaciones» en el papel: dos nombres para lo mismo, que es como se
    // acaba dudando de si son dos cosas. Aquí se llama como en la pantalla.
    observations: data.description?.trim() ? [data.description.trim()] : [],

    // Las dos notas que había explicaban el faltante y el costo de los
    // materiales, así que se van con ellos.
    footnotes: [],
  };
};
