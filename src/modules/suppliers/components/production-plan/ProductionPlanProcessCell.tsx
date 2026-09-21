import { PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  ProductionPlanRouteService,
  ProductionPlanProcessCellData,
  ProductionPlanRouteStep,
} from "../../types/productionPlan.types";

interface ProductionPlanProcessCellProps {
  /** El paso de la ruta de la orden para esta columna, o null si no lo tiene. */
  step: ProductionPlanRouteStep | null;
  /**
   * Lo que ESTA prenda lleva en este proceso.
   *
   * Manda sobre el paso para todo lo que es estado: el paso describe la
   * ORDEN, y con tres tallas eso decía que Corte no está culminado hasta que
   * pasan las tres — así que avanzar una sola no le abría su propio Costura.
   * Del paso se siguen usando sus servicios y su nombre, que sí son de la
   * ruta.
   */
  celda: ProductionPlanProcessCellData | null;
  /** El número del paso dentro de la ruta de SU orden, base 1. */
  stepNumber: number;
  /** Si esta columna es el último proceso que le toca a la fila. */
  isLast: boolean;
  /** Si la ruta de la fila está culminada — habilita el ingreso. */
  isRouteComplete: boolean;
  /** Ingreso cerrado a mano: el botón pasa a verde y dice «Ingresado». */
  intakeClosed: boolean;
  /** Sin permiso el paso se ve pero no responde, y no hay botón de ingresar. */
  canAdvance: boolean;
  onAdvance: (service: ProductionPlanRouteService) => void;
  /** Varios servicios cubren el proceso: se eligen y avanzan en un pop-up. */
  onAdvanceMany: () => void;
  onReceive: () => void;
  /** Ya avanzado: quién lo hizo y cuándo, con sus movimientos. */
  onHistory: (service: ProductionPlanRouteService) => void;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/**
 * Cuándo toca este paso, tal como se pactó con el taller.
 *
 * Dentro de la celda y no como subcolumna: son tres por proceso, y una cuarta
 * se multiplicaría por cada proceso del tenant sobre una tabla que ya es
 * ancha. Con guion cuando no se pactó nada, que es justo lo que hay que ver
 * para saber que falta ponerla.
 *
 * Con varios servicios en el paso manda el primero: comparten proceso y
 * calendario, y dos fechas en una celda no se leen.
 */
const FechaPactada = ({ step }: { step: ProductionPlanRouteStep }) => {
  const servicio = step.services[0];
  const pactada = servicio?.promisedDate ?? null;
  const fin = servicio?.endDate ?? null;
  return (
    <div
      className="text-muted-foreground text-[11px] whitespace-nowrap tabular-nums"
      title={
        `Pactada: ${pactada ? formatDateDisplay(pactada) : "sin fecha"}` +
        ` · Fin: ${fin ? formatDateDisplay(fin) : "sin terminar"}`
      }
    >
      {pactada ? formatDateDisplay(pactada) : "—"}
      {" → "}
      {fin ? formatDateDisplay(fin) : "—"}
    </div>
  );
};

/**
 * La celda de un proceso para una variación.
 *
 * Los procesos son COLUMNAS: una por proceso presente en el resultado, y la
 * celda queda **vacía** cuando la variación de la fila no pasa por ese proceso
 * — porque la ruta de su orden no lo incluye, o porque lo incluye pero ningún
 * servicio de ese paso cubre esta variación.
 *
 * Ojo con lo que esto cuesta y hay que saber: las columnas son TODOS los
 * procesos activos del tenant, no solo los de las órdenes que se ven, así que
 * para muchas filas están en blanco. A cambio la rejilla es siempre la misma
 * --no cambia de columnas al cambiar de filtro ni al pasar de página-- y se
 * puede recorrer una columna de arriba abajo y ver todo lo que está en Costura,
 * que con la ruta metida en una sola celda no se podía.
 *
 * Este componente ya no pinta cifras: solo el estado del paso y el botón que
 * registra el avance. Lo que salió de la prenda lo pinta la columna.
 *
 * El avance NO vive en el paso: vive en la situación del SERVICIO
 * (`supplier_service_situations`). De ahí sale la regla que manda aquí: un
 * servicio que cubre varias prendas las avanza TODAS de golpe, porque declara
 * un solo número para el conjunto. Para llevar una talla por su cuenta, esa
 * talla necesita su PROPIO servicio. El asterisco lo avisa.
 */
export const ProductionPlanProcessCell = ({
  step,
  celda,
  stepNumber,
  isLast,
  isRouteComplete,
  intakeClosed,
  canAdvance,
  onAdvance,
  onAdvanceMany,
  onReceive,
  onHistory,
}: ProductionPlanProcessCellProps) => {
  // La variación no pasa por este proceso: no se pinta nada. Un guion o un
  // "no aplica" en cada hueco convertiría la tabla en ruido -- con las rutas
  // configuradas por orden, los huecos son la mayoría.
  if (!step) return null;

  // Todo lo que se lee aquí es de la PRENDA. Sin celda —una fila que el
  // backend todavía no describe por prenda— se cae al estado de la orden,
  // que es lo que había antes y sigue siendo mejor que no decir nada.
  const completo = celda ? celda.isComplete : step.isComplete;
  const bloqueado = celda ? celda.isBlocked : step.isBlocked;
  const bloqueadoPor = celda ? celda.blockedBy : step.blockedBy;
  const avanzado = celda ? (celda.good ?? 0) : step.progress.advanced;
  const pedido = celda ? celda.requested : step.progress.requested;

  const detalle = completo
    ? "Culminado"
    : bloqueado
      ? bloqueadoPor
        ? `Falta ${bloqueadoPor}`
        : "Bloqueado"
      : avanzado > 0
        ? `${fmt(avanzado)} de ${fmt(pedido)}`
        : "Sin empezar";

  // Un solo servicio para varias prendas: se mueven juntas, quiera o no.
  const juntas =
    step.services.length === 1 && step.services[0].itemNames.length > 1;

  const activo = canAdvance && !bloqueado && step.services.length > 0;

  const titulo =
    `${step.processName} — ${detalle}` +
    (juntas
      ? "\n\nUn solo servicio cubre las " +
        `${step.services[0].itemNames.length} prendas, así que avanzan ` +
        "juntas. Para mover una sola, esa prenda necesita su propio " +
        "servicio en la cotización."
      : "");

  // Ingresar cierra la ruta, asi que va en el ULTIMO proceso de la fila.
  // DESHABILITADO y no escondido mientras ese proceso siga abierto: que el
  // boton este ahi es lo que ensena donde termina el camino -- escondido, la
  // ruta parece no acabar en ninguna parte. Es la misma regla que la ruta de
  // la orden.
  //
  // Cerrado a mano («ya no entra más»): el mismo boton, en verde y diciendo
  // «Ingresado». Sigue abriendo el dialogo, donde la prenda aparece cerrada.
  // El verde son los tokens success-soft del sistema, no un hex a mano.
  const ingresar = isLast && canAdvance && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={
        "h-7 gap-1.5 px-2 text-xs" +
        (intakeClosed
          ? " border-transparent bg-success-soft text-success-soft-foreground hover:bg-success-soft/70"
          : "")
      }
      onClick={onReceive}
      disabled={!intakeClosed && !isRouteComplete}
      title={
        intakeClosed
          ? "Ingreso cerrado: ya no entra más de esta prenda"
          : isRouteComplete
            ? "Ingresar a stock esta variación"
            : `Quedan servicios abiertos en ${step.processName}`
      }
    >
      <PackageCheck className="h-3.5 w-3.5" />
      {intakeClosed ? "Ingresado" : "Ingresar"}
    </Button>
  );

  // Ya avanzado: se dice con palabras y en verde, no con una pildora numerada
  // que habia que descifrar. El verde sale de variant="success" -- el par
  // bg-success-soft / text-success-soft-foreground del sistema -- y no de
  // clases de color escritas a mano, que es lo que habia aqui.
  if (completo) {
    return (
      <div
        className="space-y-0.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {/* La píldora responde a la pregunta que sigue a «ya está»: quién
              lo hizo y cuándo. Abre el historial del servicio del paso; con
              varios servicios en el paso, el de esta fila es el primero. */}
          <button
            type="button"
            className="rounded-full"
            onClick={() => onHistory(step.services[0])}
            title={`${titulo}\n\nVer quién lo hizo y sus movimientos`}
            aria-label={`Ver quién hizo ${step.processName}`}
          >
            <Badge variant="success">Avanzado</Badge>
          </button>
          {ingresar}
        </div>
        <FechaPactada step={step} />
      </div>
    );
  }

  // El paso existe pero no se puede tocar: bloqueado por un proceso anterior,
  // sin servicios que lo cubran, o sin permiso. Se pinta el motivo en vez de
  // un boton que no haria nada.
  if (!activo) {
    return (
      <div
        className="space-y-0.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <Badge variant="pending" title={titulo}>
            {detalle}
          </Badge>
          {ingresar}
        </div>
        <FechaPactada step={step} />
      </div>
    );
  }

  // El boton dice lo que hace. El numero de paso y el aviso de "avanzan
  // juntas" viven en el title: con la accion etiquetada, la pildora numerada
  // ya no hacia falta para leer la celda.
  return (
    // stopPropagation: la fila entera lleva a la orden, y pulsar un paso no
    // debe hacer las dos cosas.
    <div
      className="space-y-0.5"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          title={titulo}
          aria-label={`Avanzar ${step.processName}`}
          // Un solo servicio: va directo, no hay alternativa que preguntar.
          // Varios --uno por prenda--: el pop-up lista las prendas con un
          // check, y se avanza la de la fila, varias o todas de una vez.
          onClick={() =>
            step.services.length === 1
              ? onAdvance(step.services[0])
              : onAdvanceMany()
          }
        >
          {/* Siempre «Avanzar». La SALIDA del almacén dejó de estar aquí:
              tiene su propio botón en la columna «Solicitado», que es donde
              está la mercadería mientras no ha salido. Este botón mueve el
              proceso, que es lo que encadena la ruta. */}
          Avanzar
          {juntas && <span className="opacity-70">*</span>}
        </Button>
        {/* Entrega parcial: ya salió algo pero queda saldo. Se dice al lado,
            no en el tooltip, porque es lo que explica que el botón siga ahí. */}
        {avanzado > 0 && (
          <span className="text-muted-foreground whitespace-nowrap text-xs tabular-nums">
            {detalle}
          </span>
        )}

        {ingresar}
      </div>
      <FechaPactada step={step} />
    </div>
  );
};

export default ProductionPlanProcessCell;
