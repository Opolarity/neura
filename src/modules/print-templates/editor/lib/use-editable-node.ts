import {
  useCallback,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ROOT_NODE, useEditor, useNode } from "@craftjs/core";
import { PX_PER_MM, mm } from "./units";
import { usePagePush } from "./pagination";

/** Marca el elemento raíz de cada componente de la hoja. */
export const NODE_ATTRIBUTE = "data-print-node";

/** Lo que hay que mover el puntero (px) para que cuente como arrastre. */
const DRAG_THRESHOLD_PX = 3;

/** Cada cuánto (ms) entra en el historial un arrastre: deshacer no va px a px. */
const DRAG_HISTORY_THROTTLE_MS = 200;

const roundMm = (value: number) => Math.round(value * 10) / 10;

/**
 * Lo que todo componente de la hoja necesita para el editor: el ref que craft
 * conecta y arrastra, el estilo propio del editor (`outline`: hoy solo el
 * cursor) y las props del elemento raíz (`nodeProps`). El contorno de hover y
 * selección no va aquí, sino en SelectionOverlay.
 *
 * Un componente libre (Posición) no se arrastra con craft, que lo cambiaría
 * de sitio en el árbol: se mueve con el puntero y el arrastre cambia su X e Y.
 */
export function useEditableNode({
  draggable = true,
}: { draggable?: boolean } = {}) {
  const {
    id,
    connectors: { connect, drag },
    actions: { setProp },
    selected,
    free,
    xMm,
    yMm,
    marginTopMm,
  } = useNode((node) => ({
    selected: node.events.selected,
    free: Boolean(node.data.props.positionFree),
    marginTopMm:
      (node.data.props.margin as { top?: number } | undefined)?.top ?? 0,
    xMm: (node.data.props.xMm as number | undefined) ?? 0,
    yMm: (node.data.props.yMm as number | undefined) ?? 0,
  }));
  const { enabled, pageDom, typing } = useEditor((state) => ({
    enabled: state.options.enabled,
    pageDom: state.nodes[ROOT_NODE]?.dom ?? null,
    // Se escribe en un texto del lienzo: mientras, nada se arrastra con craft.
    // El navegador arrastraría el contenedor que lo envuelve en vez de
    // seleccionar el texto. Solo se escribe en el seleccionado (el doble clic
    // lo selecciona): se mira ese y no todos los nodos, porque esto corre en
    // cada nodo con cada cambio del editor.
    typing: Array.from(state.events.selected).some((selectedId) =>
      Boolean(state.nodes[selectedId]?.data.custom?.editing),
    ),
  }));
  const movable = enabled && free && draggable;

  // El mismo ref mientras no cambie cómo se conecta: uno nuevo en cada render
  // haría que React lo soltara y lo volviera a conectar con craft cada vez.
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      // Sin arrastre de craft mientras se escribe (el atributo draggable del
      // navegador impide seleccionar texto) ni si es libre.
      const craftDrag = draggable && !free && !typing;
      if (craftDrag) connect(drag(element));
      else connect(element);
      // Conectar sin arrastre no le quita a craft el que ya tenía puesto, y
      // volver a pedirlo no lo repone: el atributo se ajusta aquí. Solo si
      // craft lo puso (la Hoja no se arrastra y no lo tiene).
      if (element.hasAttribute("draggable")) element.draggable = craftDrag;
    },
    [connect, drag, draggable, free, typing],
  );

  /** Si el evento es de este componente y no de uno de sus hijos. */
  const isOwnEvent = (target: EventTarget, element: HTMLElement) =>
    target instanceof Element &&
    target.closest(`[${NODE_ATTRIBUTE}]`) === element;

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!movable || event.button !== 0) return;
    const element = event.currentTarget;
    if (!isOwnEvent(event.target, element)) return;

    // El lienzo está escalado por el zoom: los px de pantalla no son px CSS.
    const scale =
      pageDom && pageDom.offsetWidth
        ? pageDom.getBoundingClientRect().width / pageDom.offsetWidth
        : 1;
    const start = { x: event.clientX, y: event.clientY, xMm, yMm };
    let moving = false;

    // Si un ancestro no es libre, craft le puso draggable: al mover el puntero
    // el navegador empezaría el arrastre nativo de ese ancestro (su dragstart
    // no pasa por el de este componente) y cancelaría el puntero
    // (pointercancel) a los pocos px. Mientras dura este arrastre ningún
    // dragstart llega a nadie: se corta en la captura de window.
    const blockNativeDrag = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
    };

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - start.x) / scale;
      const dy = (moveEvent.clientY - start.y) / scale;
      if (!moving) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        moving = true;
        document.body.style.userSelect = "none";
      }
      setProp((props) => {
        props.xMm = roundMm(start.xMm + dx / PX_PER_MM);
        props.yMm = roundMm(start.yMm + dy / PX_PER_MM);
      }, DRAG_HISTORY_THROTTLE_MS);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("dragstart", blockNativeDrag, true);
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("dragstart", blockNativeDrag, true);
  };

  // Por si craft ya le había puesto su arrastre antes de pasar a libre, o de
  // empezar a escribir: arrastrar lo seleccionado del texto no mueve el nodo.
  const onDragStartCapture = (event: ReactDragEvent<HTMLElement>) => {
    const ownFree = free && isOwnEvent(event.target, event.currentTarget);
    if (draggable && !typing && !ownFree) return;
    event.preventDefault();
    event.stopPropagation();
  };

  // El contorno de hover y selección lo pinta SelectionOverlay, encima de
  // todo: aquí, en el propio elemento, lo tapaban sus hijos. Queda el cursor.
  // Con varias páginas, lo que salta a la siguiente lleva arriba un espacio
  // (lib/pagination), sumado a su margen exterior. El margen de arriba va
  // siempre suelto: si apareciera y desapareciera, React borraría el del
  // `margin` que lo incluye. Un libre no tiene margen.
  const push = usePagePush(id);
  const outline: CSSProperties = {
    ...(movable && { cursor: "move" }),
    marginTop: free
      ? 0
      : push
        ? `calc(${mm(marginTopMm)} + ${push}px)`
        : mm(marginTopMm),
  };

  const nodeProps = {
    [NODE_ATTRIBUTE]: "",
    onPointerDown,
    onDragStartCapture,
  };

  return { ref, outline, enabled, selected, nodeProps };
}
