import { Fragment } from "react";
import { ExternalLink, Loader2, Send } from "lucide-react";
import {
  diffCalendarDays,
  formatDateDisplay,
  getTodayDate,
} from "@/shared/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ProductionPlanProcessCellData,
  ProductionPlanProcessColumn,
  ProductionPlanRouteService,
  ProductionPlanRouteStep,
  ProductionPlanRoutes,
  ProductionPlanRow,
} from "../../types/productionPlan.types";
import { ProductionPlanProcessCell } from "./ProductionPlanProcessCell";
import { productionOrderStatusBadge } from "../../utils/productionOrderStatus";

interface ProductionPlanTableProps {
  rows: ProductionPlanRow[];
  loading: boolean;
  /** Pulsar la fila. Sin él la fila no lleva a ninguna parte y no lo aparenta. */
  onOpenOrder?: (row: ProductionPlanRow) => void;
  /** Las rutas de la página, por orden. Varias filas comparten la de su orden. */
  routes: ProductionPlanRoutes;
  /** Las columnas de proceso, de izquierda a derecha. Las decide el backend. */
  processes: ProductionPlanProcessColumn[];
  /** Si el usuario puede mover la producción (`production_orders.edit`). */
  canAdvance: boolean;
  onAdvance: (
    row: ProductionPlanRow,
    service: ProductionPlanRouteService,
  ) => void;
  /** Varios servicios en el paso: se eligen y avanzan en un pop-up. */
  onAdvanceMany: (row: ProductionPlanRow, step: ProductionPlanRouteStep) => void;
  onReceive: (row: ProductionPlanRow) => void;
  /** Paso ya avanzado: quién lo hizo y sus movimientos. */
  /**
   * Un proceso ya avanzado de una prenda: cuánto se pidió, cuánto llegó,
   * cuándo se cerró y qué material lleva. Va con la fila, el paso y la celda
   * porque el detalle es de ESA prenda en ESE proceso, no del servicio suelto.
   */
  onDetail: (
    row: ProductionPlanRow,
    service: ProductionPlanRouteService,
    step: ProductionPlanRouteStep | null,
    celda: ProductionPlanProcessCellData | null,
    /**
     * La ruta entera de la fila. Va con el resto porque el detalle cuenta de
     * dónde viene la prenda y a dónde va, y eso son los pasos vecinos: sin la
     * ruta, el diálogo solo sabría del proceso que se pulsó.
     */
    steps: ProductionPlanRouteStep[],
  ) => void;
  /**
   * Dónde se está pintando la rejilla.
   *
   * En `"order"` —la pestaña Avances de una orden— se ocultan las tres
   * columnas que valen lo mismo en todas sus filas: Orden, Estado orden y
   * Entrega. Repetir en cada talla el número de la orden que ya se está
   * mirando es ancho que les hace falta a los procesos.
   */
  scope?: "plan" | "order";
  /**
   * Si la lista está acotada por algo que el usuario puso: un filtro o una
   * búsqueda. Decide qué dice el vacío.
   *
   * La pantalla abre filtrada a PENDIENTE, así que una lista vacía sin nada
   * más encima significa que no queda nada pendiente -- una buena noticia, no
   * un filtro que no encuentra. Con filtro o búsqueda, decir eso sería mentir:
   * ahí lo que pasa es que nada cumple lo pedido.
   */
  narrowed?: boolean;
}

/**
 * Las de datos, antes de las de proceso: Orden, Producto, Variación,
 * Categorías, Estado orden, Entrega y Solicitado.
 *
 * El estado de la PRENDA se retiró: la lista ya se filtra por él --el plan abre
 * por lo pendiente-- y repetirlo en cada fila gastaba una columna para decir lo
 * que el filtro ya acota. Lo que de verdad se mira por fila es lo que falta en
 * cada proceso, que son las columnas de la derecha.
 *
 * De las tres cifras que vivían aquí solo se queda «Solicitado» —lo pedido de
 * la variación en la orden—, y va la última, pegada a los procesos, que es
 * contra lo que se leen sus cifras. Lo recibido y lo que falta se fueron a cada
 * PROCESO.
 */
const FIXED_COLUMNS = 10;

/**
 * Las de datos que se pintan de verdad: en la orden se caen CUATRO.
 *
 * Son Orden, Estado orden, Pedido y Entrega. Aqui ponia tres y se contaban
 * mal desde siempre -- solo se nota en el colSpan de la fila vacia, que se
 * estiraba una columna de mas.
 */
const fixedColumns = (scope: "plan" | "order") =>
  scope === "order" ? FIXED_COLUMNS - 4 : FIXED_COLUMNS;

/**
 * Las cifras de cada proceso, en el orden en que se leen.
 *
 * Lo solicitado NO se repite aquí: va una sola vez, al final de las columnas
 * de datos y pegado a los procesos. Repetirlo en cada uno multiplicaba por
 * cuatro el ancho de la rejilla para decir casi siempre lo mismo.
 */
// Lo que cada proceso sabe de la prenda: cuanto recibio y cuanto le falta.
//
// Y nada mas. Bueno y Malo no estan, y no es un olvido: esa cuenta no se
// decide en el proceso sino en el pop-up de recepcion, una vez al final de la
// ruta, donde ademas se elige a que almacen entra lo bueno y a cual la merma.
//
// La tercera columna es la del boton y va SIN rotulo: la accion no es un dato
// del proceso, y "Avance" encima de un boton solo repetia lo que el boton ya
// dice. Sigue siendo columna propia porque metida dentro de una cifra empujaba
// el numero y desalineaba las subcolumnas de un proceso contra las del
// siguiente.
const SUBCOLUMNS = ["Recibido", "Faltante", ""] as const;

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Una cifra de proceso, o nada.
 *
 * Tres estados y los tres significan cosas distintas:
 * - **Vacio** cuando la prenda no pasa por ese proceso. Un guion en cada hueco
 *   convertiria la rejilla en ruido: con las rutas por orden, los huecos son
 *   la mayoria.
 * - **Vacio tambien** cuando el paso existe pero no se sabe cuanto salio --
 *   pasa si un servicio cubre varias prendas sin desglose, y repartirlo seria
 *   inventarlo.
 * - **Numero**, incluido el cero, que dice "paso y no salio nada" y no es lo
 *   mismo que no saberlo.
 */
const Cifra = ({
  valor,
  vacia,
  atenuada = false,
}: {
  valor: number | null;
  vacia: boolean;
  atenuada?: boolean;
}) => {
  if (vacia || valor === null) return null;
  return (
    <span className={atenuada ? "text-muted-foreground" : undefined}>
      {fmt(valor)}
    </span>
  );
};


/** La clave de columna de una ETAPA. `processGroupId` es null en un paso sin grupo. */
const columnKey = (column: ProductionPlanProcessColumn): string =>
  column.processGroupId !== null
    ? `g${column.processGroupId}`
    : `sin:${column.processGroupName ?? column.processName}`;

const stepKey = (step: ProductionPlanRouteStep): string =>
  step.processGroupId !== null
    ? `g${step.processGroupId}`
    : `sin:${step.processGroupName ?? step.processName}`;

/**
 * La entrega comprometida de la orden, con lo que importa debajo.
 *
 * Mientras no ha entrado nada a stock, lo que importa es la fecha: cuántos
 * días faltan, o cuántos lleva vencida — en rojo, porque es lo que hay que
 * mirar primero. Cuando ya entró algo, la fecha deja de ser la pregunta y
 * debajo va lo recibido contra lo pedido.
 */
const Entrega = ({ row }: { row: ProductionPlanRow }) => {
  if (!row.promisedDate) {
    return <span className="text-muted-foreground">—</span>;
  }
  // Días desde hoy (en Lima) hasta la entrega: negativo si ya pasó.
  const dias = diffCalendarDays(getTodayDate(), row.promisedDate);
  const vencida = row.received === 0 && dias < 0;

  const detalle =
    row.received > 0
      ? `recibido ${fmt(row.received)} de ${fmt(row.quantity)}`
      : dias < 0
        ? `vencida hace ${fmt(-dias)} d`
        : dias === 0
          ? "hoy"
          : `en ${fmt(dias)} d`;

  return (
    <div className={vencida ? "text-destructive font-medium" : undefined}>
      <div className="whitespace-nowrap tabular-nums">
        {formatDateDisplay(row.promisedDate)}
      </div>
      <div
        className={
          vencida
            ? "text-xs whitespace-nowrap"
            : "text-muted-foreground text-xs whitespace-nowrap"
        }
      >
        {detalle}
      </div>
    </div>
  );
};

/**
 * Los pasos de la ruta de la orden por los que pasa ESTA variación.
 *
 * Un paso cubre a la variación cuando alguno de sus servicios la lista en
 * `itemIds`. Un servicio con `itemIds` vacío no atribuye prendas: cubre la
 * orden entera, así que vale para todas sus variaciones — y lo mismo un paso
 * que no llegó a tener servicios.
 */
const stepsForRow = (
  row: ProductionPlanRow,
  routes: ProductionPlanRoutes,
): Map<string, ProductionPlanRouteStep> => {
  const aplicables = (routes[row.productionOrderId] ?? []).filter((step) =>
    step.services.length === 0
      ? true
      : step.services.some(
          (service) =>
            service.itemIds.length === 0 ||
            service.itemIds.includes(row.productionOrderItemId),
        ),
  );

  // Por proceso, que es lo que encabeza la columna. Una ruta puede repetir un
  // proceso en dos pasos distintos --dos vueltas de Costura-- y solo hay una
  // columna: se queda el primero sin culminar, que es donde está el trabajo.
  // Si todos están culminados da igual cuál, la celda dice lo mismo.
  const porProceso = new Map<string, ProductionPlanRouteStep>();
  aplicables.forEach((step) => {
    const clave = stepKey(step);
    const previo = porProceso.get(clave);
    if (!previo || (previo.isComplete && !step.isComplete)) {
      porProceso.set(clave, step);
    }
  });
  return porProceso;
};

/**
 * El Plan Maestro Producción: una fila por VARIACIÓN, y los procesos en columnas.
 *
 * Se lee como una lista de inventario — una línea por SKU, con su cantidad y su
 * estado. Antes la fila era el producto+color y sus tallas viajaban dentro como
 * fichas, lo que obligaba a resumir en un solo estado el de varias tallas que
 * podían no coincidir. Ahora la fila es una sola variación.
 *
 * Los procesos son columnas —TODOS los activos del tenant, los pinte esta
 * página o no—, y cada uno abre tres: lo que salió **bueno**, lo que se
 * **malogró** y lo que **falta**. Así se lee la cadena de izquierda a derecha:
 * se pidieron 100, de corte salieron 120, a lavado se perdieron 50.
 *
 * Lo solicitado va UNA vez, en la última columna de datos: repetirlo en cada
 * proceso multiplicaba el ancho de la rejilla para decir casi siempre lo
 * mismo.
 *
 * Las cifras son de la VARIACIÓN, no de la orden: salen de `row.processes`, que
 * el backend arma con el avance por prenda. El paso de la ruta —el botón que
 * registra el avance— sigue siendo de la orden, y por eso convive con ellas sin
 * mezclarse.
 *
 * Lo que cuesta, y es real: con muchos procesos en el catálogo la tabla se
 * ensancha y muchas celdas quedan vacías. Ninguna columna va congelada —se
 * probó y no tapaba bien—, así que al desplazar a la derecha se pierde de vista
 * de qué fila es la celda. Lo que se gana es que la rejilla es siempre la misma
 * —no baila al filtrar ni al paginar— y que se puede recorrer una columna de
 * arriba abajo y ver todo lo que está en el mismo proceso.
 */
export const ProductionPlanTable = ({
  rows,
  loading,
  onOpenOrder,
  routes,
  processes,
  canAdvance,
  onAdvance,
  onAdvanceMany,
  onReceive,
  onDetail,
  scope = "plan",
  narrowed = false,
}: ProductionPlanTableProps) => (
  <Table>
    {/* El header va en DOS niveles: el proceso arriba, abarcando sus cuatro
        cifras, y los rótulos debajo. Con una sola fila habría que repetir el
        nombre del proceso en cada cuarto, y la rejilla se leería como cuatro
        veces los procesos que hay.

        Las columnas fijas ocupan los dos niveles con `rowSpan`. El `sticky
        top-0` de `ui/table.tsx` pega la primera fila; la segunda necesita su
        propio desplazamiento —`top-12`, el alto `h-12` de la primera— o se
        quedaría debajo al desplazar en vertical. Va con `!` porque compite con
        el `top-0` que `ui/table.tsx` pone en todos los `<th>`, y sin él las dos
        filas del header se pegan al mismo sitio y se solapan. */}
    <TableHeader>
      <TableRow>
        {/* Orden y Producto NO se congelan. Se probó y se retiró: una celda
            fija tiene que tapar de verdad lo que pasa por debajo, y en esta
            tabla ninguna lo hacía del todo —el fondo de las filas impares es
            transparente, el de las pares está al 50%, y entre las dos columnas
            quedaba una rendija por el ancho real de la primera—, así que el
            contenido se leía encimado. Se puede volver a intentar, pero
            entonces hay que resolver esas tres cosas a la vez. */}
        {scope === "plan" && (
          <TableHead rowSpan={2} className="w-32">
            Orden
          </TableHead>
        )}
        <TableHead rowSpan={2} className="min-w-48">
          Producto
        </TableHead>
        <TableHead rowSpan={2} className="min-w-40">
          Variación
        </TableHead>
        <TableHead rowSpan={2}>Categorías</TableHead>
        {/* Las dos son de la ORDEN: dentro de una sola valen lo mismo en
            todas las filas y no dicen nada. */}
        {scope === "plan" && (
          <>
            <TableHead rowSpan={2}>Estado orden</TableHead>
            {/* La fecha comprometida no se veía en ninguna columna: solo
                servía para filtrar. Es lo que ordena la lista dentro de cada
                estado, así que tiene que leerse en la fila. */}
            {/* Cuándo se pidió, al lado de cuándo se comprometió: la
                entrega sola no dice cuánto plazo tuvo la prenda. */}
            <TableHead rowSpan={2}>Pedido</TableHead>
            <TableHead rowSpan={2}>Entrega</TableHead>
          </>
        )}
        {/* Lo pedido de la variación EN LA ORDEN, la cifra de la que sale todo
            lo demás. Va la ÚLTIMA de las columnas de datos, pegada a los
            procesos: es contra ella que se leen sus cifras, y separadas por
            media tabla habría que ir y volver con la vista. */}
        <TableHead rowSpan={2} className="text-right">
          Solicitado
        </TableHead>
        {processes.map((column) => (
          <TableHead
            key={columnKey(column)}
            colSpan={SUBCOLUMNS.length}
            className="min-w-28 whitespace-nowrap text-center"
            title={column.processGroupName ?? undefined}
          >
            {column.processGroupName ?? column.processName}
          </TableHead>
        ))}
        {/* Al final de todo, y una sola vez: lo que de verdad entro a almacen
            y lo que queda por entrar. Es la cuenta de la PRENDA, no de un
            proceso, y por eso no se reparte entre las columnas de la ruta. */}
        <TableHead rowSpan={2} className="text-right">
          Recibido
        </TableHead>
        <TableHead rowSpan={2} className="text-right">
          Faltante
        </TableHead>
      </TableRow>
      <TableRow>
        {processes.map((column) => (
          <Fragment key={columnKey(column)}>
            {SUBCOLUMNS.map((sub, index) => (
              <TableHead
                key={sub || `accion-${index}`}
                className="!top-12 h-8 px-3 text-right text-xs font-normal"
              >
                {sub}
              </TableHead>
            ))}
          </Fragment>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading && rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={fixedColumns(scope) + processes.length * SUBCOLUMNS.length}
            className="text-center py-8"
          >
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando el plan...
            </div>
          </TableCell>
        </TableRow>
      ) : rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={fixedColumns(scope) + processes.length * SUBCOLUMNS.length}
            className="text-center text-muted-foreground p-10"
          >
            {narrowed
              ? "No hay variaciones que cumplan el filtro"
              : "No hay servicios pendientes"}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => {
          const pasos = stepsForRow(row, routes);
          // El último proceso de ESTA fila: es donde va el botón de ingresar, y
          // el que decide si la ruta está terminada. No es la última columna de
          // la tabla — cada orden acaba su ruta donde acaba.
          const ultimo = Array.from(
            pasos.values(),
          ).reduce<ProductionPlanRouteStep | null>(
            (mayor, step) =>
              !mayor || step.order > mayor.order ? step : mayor,
            null,
          );
          // Y el primero: el que recibe la mercadería del almacén, y al que
          // por eso hay que mandársela antes de que devuelva nada.
          const primero = Array.from(
            pasos.values(),
          ).reduce<ProductionPlanRouteStep | null>(
            (menor, step) =>
              !menor || step.order < menor.order ? step : menor,
            null,
          );
          /**
           * La mercadería sigue en almacén: ningún servicio del primer paso se
           * ha despachado todavía.
           *
           * Es la misma condición que antes decidía si el botón del primer
           * proceso decía «Enviar»; ahora vive aquí porque el envío tiene su
           * propia celda.
           */
          const porEnviar =
            primero !== null &&
            primero.services.length > 0 &&
            primero.services.every((service) => !service.dispatched);

          // De la PRENDA, no del último paso. `isComplete` del paso es del
          // proceso entero -- todos sus servicios --, así que con un servicio
          // por talla la que ya terminó quedaba esperando a las demás. Y mirar
          // solo el último dejaba pasar una prenda con un proceso intermedio
          // abierto.
          const rutaTerminada = row.routeDone;
          // Sin pasos no hay dónde colgar el ingreso, así que el aviso y el
          // botón deshabilitado caen en la primera columna de proceso.
          const sinRuta = pasos.size === 0;

          return (
            <TableRow
              key={row.productionOrderItemId}
              /* Lleva a la orden. Las celdas de proceso paran el click. Dentro
                 de la propia orden no hay a dónde ir, así que ni responde ni
                 se pinta como si lo hiciera. */
              onClick={onOpenOrder ? () => onOpenOrder(row) : undefined}
              className={onOpenOrder ? "cursor-pointer" : undefined}
              title={
                onOpenOrder ? `Abrir ${row.productionOrderName}` : undefined
              }
            >
              {/* El id y, debajo, el nombre en pequeño: el número solo no
                  dice qué orden es, y las filas de una misma orden van
                  seguidas, así que se leen como bloque. Truncado para no
                  quitarle ancho a los procesos; el title lo da entero. */}
              {scope === "plan" && (
                <TableCell className="w-32" title={row.productionOrderName}>
                  {/* El código si lo hay; el id solo mientras no. */}
                  <div className="text-muted-foreground tabular-nums">
                    {row.productionOrderCode ?? `#${row.productionOrderId}`}
                  </div>
                  <div className="text-muted-foreground text-xs truncate max-w-[110px]">
                    {row.productionOrderName}
                  </div>
                </TableCell>
              )}
              {/* Solo el nombre. La receta se retiro de aqui: con qué está
                  hecha cada prenda es otra pregunta, y se hace desde la orden
                  o desde el desarrollo de producto. Debajo del nombre era
                  además el mismo enlace repetido en todas las tallas. */}
              <TableCell>
                <div>{row.productTitle ?? "Sin producto asignado"}</div>
              </TableCell>
              <TableCell>
                {/* Talla y color arriba, SKU debajo: es lo que distingue esta
                    línea de las demás del mismo producto, igual que en una
                    lista de inventario. */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{row.termName}</span>
                  {row.variationTerms && (
                    <span className="text-muted-foreground">
                      · {row.variationTerms}
                    </span>
                  )}
                </div>
                {row.sku && (
                  <div className="text-muted-foreground text-xs tabular-nums">
                    {row.sku}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {/* Las del producto. Un badge por categoría en vez de un texto
                    separado por comas: son etiquetas, y así se leen igual que
                    la clase en la lista de órdenes. */}
                {row.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {row.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              {scope === "plan" && (
                <>
                  <TableCell>
                    {/* El de la orden, que NO es el mismo: una orden puede
                        estar culminada -- sus servicios terminaron -- con las
                        prendas todavía sin ingresar a almacén. */}
                    <Badge
                      variant={
                        productionOrderStatusBadge(row.productionOrderStatus)
                          .variant
                      }
                    >
                      {
                        productionOrderStatusBadge(row.productionOrderStatus)
                          .label
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.createdAt ? formatDateDisplay(row.createdAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Entrega row={row} />
                  </TableCell>
                </>
              )}

              {/* Lo pedido de la variación, pegado a los procesos: es la
                  cifra contra la que se leen todas las suyas.

                  Y debajo, la SALIDA DEL ALMACÉN: mientras la mercadería no ha
                  salido, esta celda es donde está. Tiene botón propio y no el
                  del primer proceso porque son dos cosas distintas: esto la
                  manda al taller, y el botón de cada proceso la mueve al
                  siguiente. La ruta es secuencial y el papel lo refleja. */}
              <TableCell className="text-right font-medium tabular-nums">
                <div>{fmt(row.quantity)}</div>
                {primero && (
                  <div className="mt-1">
                    {porEnviar ? (
                      canAdvance && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs font-normal"
                          title={`La mercadería está en almacén. Esto la manda a ${primero.processName} y deja lista su guía de remisión.`}
                          aria-label={`Enviar a ${primero.processName}`}
                          onClick={() =>
                            primero.services.length === 1
                              ? onAdvance(row, primero.services[0])
                              : onAdvanceMany(row, primero)
                          }
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enviar
                        </Button>
                      )
                    ) : (
                      /* Ya salió: se dice y se deja de ofrecer. Lo que pase a
                         partir de aquí se lee en las columnas de proceso. */
                      <span className="text-muted-foreground text-[11px] font-normal">
                        Enviado
                      </span>
                    )}
                  </div>
                )}
              </TableCell>

              {processes.map((column, indice) => {
                const step = pasos.get(columnKey(column)) ?? null;

                if (sinRuta) {
                  return (
                    <TableCell
                      key={columnKey(column)}
                      colSpan={SUBCOLUMNS.length}
                    >
                      {indice === 0 && (
                        <span className="text-muted-foreground text-sm whitespace-nowrap">
                          Sin ruta configurada
                        </span>
                      )}
                    </TableCell>
                  );
                }

                // Las cifras son de ESTA prenda; el paso, de la ruta de su
                // orden. Son dos cosas distintas y por eso vienen de sitios
                // distintos: el avance de la ruta es el mismo número para
                // todas las variaciones de la orden.
                const celda: ProductionPlanProcessCellData | null =
                  column.processGroupId !== null
                    ? (row.processes[column.processGroupId] ?? null)
                    : null;

                return (
                  <Fragment key={columnKey(column)}>
                    {/* Lo que este proceso recibio de esta prenda. */}
                    <TableCell className="px-3 text-right font-medium tabular-nums">
                      <Cifra valor={celda?.good ?? null} vacia={!step} />
                    </TableCell>
                    {/* Y lo que todavia le debe. En cero se atenua: lo que
                        tiene que saltar a la vista es lo que queda por hacer. */}
                    <TableCell className="px-3 text-right tabular-nums">
                      <Cifra
                        valor={celda?.remaining ?? null}
                        vacia={!step}
                        atenuada={(celda?.remaining ?? 0) === 0}
                      />
                    </TableCell>
                    <TableCell>
                      <ProductionPlanProcessCell
                        step={step}
                        celda={celda}
                        stepNumber={step ? step.order : 0}
                        isLast={step !== null && step === ultimo}
                        isRouteComplete={rutaTerminada}
                        intakeClosed={row.intakeClosed}
                        canAdvance={canAdvance}
                        onAdvance={(service) => onAdvance(row, service)}
                        onAdvanceMany={() => step && onAdvanceMany(row, step)}
                        onReceive={() => onReceive(row)}
                        onHistory={(service) =>
                          onDetail(row, service, step, celda, [
                            ...pasos.values(),
                          ])
                        }
                      />
                    </TableCell>
                  </Fragment>
                );
              })}
              {/* Lo recibido en stock, y lo que falta contra lo solicitado.
                  El faltante en cero se atenúa: lo que tiene que saltar a la
                  vista es lo que queda por entrar. */}
              <TableCell className="px-3 text-right font-medium tabular-nums">
                {fmt(row.received)}
              </TableCell>
              <TableCell
                className={
                  row.pending > 0
                    ? "px-3 text-right tabular-nums"
                    : "text-muted-foreground px-3 text-right tabular-nums"
                }
              >
                {fmt(row.pending)}
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);
