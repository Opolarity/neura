import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { ROOT_NODE, useEditor } from "@craftjs/core";
import { EyeOff, Replace } from "lucide-react";
import { PX_PER_MM } from "../lib/units";
import { sharedTargets } from "../lib/data-table";

/** Lado del tirador en px de pantalla: igual con cualquier zoom. */
const HANDLE_PX = 8;

/** Grosor del contorno de selección en px de pantalla. */
const SELECTED_BORDER_PX = 2;

/** Lo mínimo que puede medir un componente al agrandarlo o achicarlo (mm). */
const MIN_SIZE_MM = 1;

/** Cada cuánto (ms) entra en el historial: deshacer no va px a px. */
const HISTORY_THROTTLE_MS = 200;

const roundMm = (value: number) => Math.round(value * 10) / 10;

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Dónde va cada tirador (0 a 1 sobre el ancho y el alto) y su cursor. */
const HANDLES: { handle: Handle; x: number; y: number; cursor: string }[] = [
  { handle: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { handle: "n", x: 0.5, y: 0, cursor: "ns-resize" },
  { handle: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { handle: "e", x: 1, y: 0.5, cursor: "ew-resize" },
  { handle: "se", x: 1, y: 1, cursor: "nwse-resize" },
  { handle: "s", x: 0.5, y: 1, cursor: "ns-resize" },
  { handle: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { handle: "w", x: 0, y: 0.5, cursor: "ew-resize" },
];

/** Una caja en px CSS del papel (sin el zoom), y el zoom. */
interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height &&
    a.scale === b.scale);

/**
 * La caja de `dom` dentro del papel, seguida en cada cuadro: se mueve con el
 * reparto, el arrastre y el zoom, y ningún observer cubre todo eso.
 */
function useTrackedRect(
  dom: HTMLElement | null,
  paperRef: RefObject<HTMLDivElement>,
): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const paper = paperRef.current;
    if (!dom || !paper) {
      setRect(null);
      return;
    }
    const measure = () => {
      const box = dom.getBoundingClientRect();
      const paperBox = paper.getBoundingClientRect();
      const scale = paper.offsetWidth ? paperBox.width / paper.offsetWidth : 1;
      const next = {
        left: (box.left - paperBox.left) / scale,
        top: (box.top - paperBox.top) / scale,
        width: box.width / scale,
        height: box.height / scale,
        scale,
      };
      setRect((current) => (sameRect(current, next) ? current : next));
    };
    measure();
    // Se mide de nuevo solo cuando algo cambia en la hoja (estilos, textos,
    // nodos, el zoom, que es el estilo del papel, o el tamaño del elemento),
    // una vez por cuadro: medir en cada cuadro forzaba el diseño sin parar.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(dom);
    resizeObserver.observe(paper);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(paper, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [dom, paperRef]);

  return rect;
}

/** Un contorno sobre la caja, por fuera de todo lo que hay en la hoja. */
function Outline({ rect, selected }: { rect: Rect; selected: boolean }) {
  const border = (selected ? SELECTED_BORDER_PX : 1) / rect.scale;
  return (
    <div
      className="absolute"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        // El contorno va por dentro de la caja, como el outline de antes.
        boxSizing: "border-box",
        border: `${border}px ${selected ? "solid" : "dashed"} hsl(var(--primary) / ${selected ? 1 : 0.7})`,
      }}
    />
  );
}

/**
 * Lo que marca la selección en el lienzo: el contorno del componente sobre el
 * que está el ratón, el del seleccionado y, si se puede, sus tiradores. Va en
 * una capa encima de la hoja (dentro del papel escalado) y no en cada
 * componente: así ningún hijo lo tapa y no cambia contra qué se colocan los
 * hijos libres.
 *
 * Arrastrar un tirador deja esa medida en fijo; en un componente libre, los de
 * arriba y la izquierda también mueven su X e Y. Con la relación de aspecto
 * activa, la otra medida la sigue.
 */
/**
 * Las marcas de lo que cambia si su dato llega vacío, en la esquina de arriba
 * a la derecha: el Contenedor con «Ocultar si está vacío» (puede no salir) y
 * el Texto con «Si está vacío, escribir» (puede salir otro texto). Se ven
 * mientras se edita.
 */
function HideRuleBadges({ paperRef }: { paperRef: RefObject<HTMLDivElement> }) {
  const { badges } = useEditor((state) => ({
    badges: Object.keys(state.nodes).flatMap((id) => {
      const props = state.nodes[id].data.props;
      const kind: BadgeKind | null = props.hideWhenEmpty
        ? "hide"
        : props.emptyText && props.valueSource
          ? "replace"
          : null;
      return kind ? [{ id, kind, dom: state.nodes[id].dom }] : [];
    }),
  }));
  return (
    <>
      {badges.map(({ id, kind, dom }) => (
        <HideRuleBadge key={id} kind={kind} dom={dom} paperRef={paperRef} />
      ))}
    </>
  );
}

type BadgeKind = "hide" | "replace";

const BADGES: Record<BadgeKind, { title: string; Icon: typeof EyeOff }> = {
  hide: { title: "Se oculta si su dato está vacío", Icon: EyeOff },
  replace: { title: "Escribe otro texto si su dato está vacío", Icon: Replace },
};

function HideRuleBadge({
  kind,
  dom,
  paperRef,
}: {
  kind: BadgeKind;
  dom: HTMLElement | null;
  paperRef: RefObject<HTMLDivElement>;
}) {
  const rect = useTrackedRect(dom, paperRef);
  if (!rect) return null;
  const size = 16 / rect.scale;
  const { title, Icon } = BADGES[kind];
  return (
    <div
      title={title}
      className="pointer-events-none absolute z-30 flex items-center justify-center rounded bg-amber-500 text-white"
      style={{
        left: rect.left + rect.width - size - 2 / rect.scale,
        top: rect.top + 2 / rect.scale,
        width: size,
        height: size,
      }}
    >
      <Icon style={{ width: size * 0.65, height: size * 0.65 }} />
    </div>
  );
}

export function SelectionOverlay({
  paperRef,
}: {
  paperRef: RefObject<HTMLDivElement>;
}) {
  const { actions, enabled, selectedId, selectedDom, hoveredDom, resizable } =
    useEditor((state, query) => {
      const selected = query.getEvent("selected").first();
      const hovered = query.getEvent("hovered").first();
      const selectedNode = selected ? state.nodes[selected] : undefined;
      const hoveredNode =
        hovered && hovered !== selected ? state.nodes[hovered] : undefined;
      return {
        enabled: state.options.enabled,
        selectedId: selectedNode ? selected : null,
        selectedDom: selectedNode?.dom ?? null,
        hoveredDom: hoveredNode?.dom ?? null,
        resizable: Boolean(
          selectedNode &&
          selected !== ROOT_NODE &&
          !selectedNode.data.props.isPage &&
          // El encabezado y el pie van a lo ancho de su página.
          !selectedNode.data.props.pageZone &&
          "widthMode" in selectedNode.data.props &&
          // Mientras se escribe en un Texto (custom.editing) no se agranda.
          !selectedNode.data.custom?.editing,
        ),
      };
    });
  const { query } = useEditor();
  const selectedRect = useTrackedRect(enabled ? selectedDom : null, paperRef);
  const hoveredRect = useTrackedRect(enabled ? hoveredDom : null, paperRef);

  const startResize = (
    handle: Handle,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0 || !selectedId || !selectedRect) return;
    event.preventDefault();
    event.stopPropagation();
    const props = query.node(selectedId).get().data.props;
    // En una Tabla de datos lo mismo cambia en todas las filas, y el ancho en
    // toda la columna (lib/data-table).
    const others = (key: string) =>
      sharedTargets(query.getNodes(), selectedId, key).filter(
        (target) => target !== selectedId,
      );
    const widthPeers = others("widthMm");
    const heightPeers = others("heightMm");
    const rect = selectedRect;
    const start = {
      x: event.clientX,
      y: event.clientY,
      widthMm: rect.width / PX_PER_MM,
      heightMm: rect.height / PX_PER_MM,
      xMm: (props.xMm as number | undefined) ?? 0,
      yMm: (props.yMm as number | undefined) ?? 0,
    };
    const free = Boolean(props.positionFree);
    const ratio: number | null =
      props.aspectLocked && props.aspectRatio > 0 ? props.aspectRatio : null;
    const horizontal = handle.includes("e") || handle.includes("w");
    const vertical = handle.includes("n") || handle.includes("s");
    document.body.style.userSelect = "none";

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - start.x) / rect.scale / PX_PER_MM;
      const dy = (moveEvent.clientY - start.y) / rect.scale / PX_PER_MM;

      let width = start.widthMm;
      if (handle.includes("e")) width = start.widthMm + dx;
      if (handle.includes("w")) width = start.widthMm - dx;
      let height = start.heightMm;
      if (handle.includes("s")) height = start.heightMm + dy;
      if (handle.includes("n")) height = start.heightMm - dy;
      width = Math.max(width, MIN_SIZE_MM);
      height = Math.max(height, MIN_SIZE_MM);

      // Con la relación de aspecto manda el ancho, salvo en los tiradores de
      // arriba y abajo, que solo mueven el alto.
      if (ratio) {
        if (horizontal) height = Math.max(width / ratio, MIN_SIZE_MM);
        else width = Math.max(height * ratio, MIN_SIZE_MM);
      }
      const changesWidth = horizontal || Boolean(ratio);
      const changesHeight = vertical || Boolean(ratio);

      actions.history
        .throttle(HISTORY_THROTTLE_MS)
        .setProp(selectedId, (draft) => {
          if (changesWidth) {
            draft.widthMode = "fixed";
            draft.widthMm = roundMm(width);
            // El borde derecho queda donde estaba.
            if (free && handle.includes("w")) {
              draft.xMm = roundMm(start.xMm + start.widthMm - width);
            }
          }
          if (changesHeight) {
            draft.heightMode = "fixed";
            draft.heightMm = roundMm(height);
            if (free && handle.includes("n")) {
              draft.yMm = roundMm(start.yMm + start.heightMm - height);
            }
          }
        });
      // Entran en el mismo paso de deshacer que el cambio de arriba.
      const peers = new Set([
        ...(changesWidth ? widthPeers : []),
        ...(changesHeight ? heightPeers : []),
      ]);
      for (const peerId of peers) {
        actions.history
          .throttle(HISTORY_THROTTLE_MS)
          .setProp(peerId, (draft) => {
            if (changesWidth && widthPeers.includes(peerId)) {
              draft.widthMode = "fixed";
              draft.widthMm = roundMm(width);
            }
            if (changesHeight && heightPeers.includes(peerId)) {
              draft.heightMode = "fixed";
              draft.heightMm = roundMm(height);
            }
          });
      }
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  if (!enabled) return null;
  const handleSize = selectedRect ? HANDLE_PX / selectedRect.scale : 0;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {hoveredRect && <Outline rect={hoveredRect} selected={false} />}
      {selectedRect && <Outline rect={selectedRect} selected />}
      {enabled && <HideRuleBadges paperRef={paperRef} />}
      {selectedRect &&
        resizable &&
        HANDLES.map(({ handle, x, y, cursor }) => (
          <div
            key={handle}
            onPointerDown={(event) => startResize(handle, event)}
            className="pointer-events-auto absolute rounded-[2px] border-primary bg-white"
            style={{
              left: selectedRect.left + x * selectedRect.width - handleSize / 2,
              top: selectedRect.top + y * selectedRect.height - handleSize / 2,
              width: handleSize,
              height: handleSize,
              borderWidth: 1.5 / selectedRect.scale,
              cursor,
            }}
          />
        ))}
    </div>
  );
}
