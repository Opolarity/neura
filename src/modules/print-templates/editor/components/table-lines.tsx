import { useContext, useEffect, useState, type CSSProperties } from "react";
import { useEditor, type NodeId } from "@craftjs/core";
import { TABLE_PARTS, tableRows } from "../lib/data-table";
import { LINE_KINDS, type TableLinesProps } from "../lib/table-lines";
import { PushStoreContext } from "../lib/pagination";
import { PX_PER_MM } from "../lib/units";

/**
 * Dónde van las líneas, en px sin escalar desde el interior de la Tabla. Con
 * varias páginas la tabla puede seguir en otra: cada tramo (lo de una página)
 * tiene su contorno y sus líneas, y el de una página nueva empieza en la copia
 * de su encabezado (lib/pagination). Las líneas entre columnas son las mismas
 * en todos los tramos.
 */
interface LinesSegment {
  top: number;
  bottom: number;
  /** La altura de cada línea entre filas. */
  rows: number[];
}

interface LinesLayout {
  left: number;
  width: number;
  segments: LinesSegment[];
  columns: number[];
}

const sameLayout = (a: LinesLayout | null, b: LinesLayout | null) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Redondeo a la décima de px: así medir de nuevo no cambia nada. */
const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Mide la Tabla cada vez que cambia algo dentro. Las líneas entre filas van
 * a mitad de la separación entre una fila y la siguiente; las de entre
 * columnas, a mitad de la separación entre los Textos de la primera fila
 * visible (el encabezado, si se muestra).
 */
function useLinesLayout(tableId: NodeId, enabled: boolean) {
  const pushStore = useContext(PushStoreContext);
  const { query, tableDom } = useEditor((state) => ({
    tableDom: state.nodes[tableId]?.dom ?? null,
  }));
  const [layout, setLayout] = useState<LinesLayout | null>(null);

  useEffect(() => {
    if (!enabled || !tableDom) {
      setLayout(null);
      return;
    }
    const measure = () => {
      const nodes = query.getNodes();
      const table = tableDom.getBoundingClientRect();
      const zoom = tableDom.offsetWidth
        ? table.width / tableDom.offsetWidth
        : 1;
      const originX = table.left + tableDom.clientLeft * zoom;
      const originY = table.top + tableDom.clientTop * zoom;
      const rect = (dom: HTMLElement) => {
        const r = dom.getBoundingClientRect();
        return {
          left: (r.left - originX) / zoom,
          right: (r.right - originX) / zoom,
          top: (r.top - originY) / zoom,
          bottom: (r.bottom - originY) / zoom,
          visible: r.width > 0 || r.height > 0,
        };
      };
      // El encabezado oculto no mide nada: queda fuera.
      const partIds = [
        nodes[tableId]?.data.linkedNodes[TABLE_PARTS.header],
        ...tableRows(nodes, tableId),
      ];
      const parts = partIds
        .map((partId) => ({ partId, dom: partId ? nodes[partId]?.dom : null }))
        .filter((part): part is { partId: NodeId; dom: HTMLElement } =>
          Boolean(part.dom),
        )
        .map((part) => ({ ...part, rect: rect(part.dom) }))
        .filter((part) => part.rect.visible);
      if (!parts.length) return setLayout(null);

      const left = Math.min(...parts.map((part) => part.rect.left));
      const right = Math.max(...parts.map((part) => part.rect.right));
      // Una fila que salta de página empieza un tramo nuevo, debajo de la
      // copia del encabezado (si se muestra) y de la separación entre filas.
      const headerPart = parts.find((part) => part.partId === partIds[0]);
      const gap =
        ((nodes[tableId]?.data.props.rowGapMm as number) ?? 0) * PX_PER_MM;
      const headerExtent = headerPart
        ? headerPart.rect.bottom - headerPart.rect.top + gap
        : 0;
      const segments: LinesSegment[] = [];
      let segment: LinesSegment = {
        top: parts[0].rect.top,
        bottom: parts[0].rect.bottom,
        rows: [],
      };
      parts.slice(1).forEach((part, index) => {
        const previous = parts[index];
        if ((pushStore?.getPush(part.partId) ?? 0) > 0) {
          segments.push(segment);
          segment = {
            top: round(part.rect.top - headerExtent),
            bottom: part.rect.bottom,
            rows: headerExtent ? [round(part.rect.top - gap / 2)] : [],
          };
          return;
        }
        segment.rows.push(round((previous.rect.bottom + part.rect.top) / 2));
        segment.bottom = part.rect.bottom;
      });
      segments.push(segment);
      const cells = (nodes[parts[0].partId]?.data.nodes ?? [])
        .map((cellId) => nodes[cellId]?.dom)
        .filter((dom): dom is HTMLElement => Boolean(dom))
        .map(rect);
      const columns = cells
        .slice(1)
        .map((cell, index) => round((cells[index].right + cell.left) / 2));
      const next: LinesLayout = {
        left: round(left),
        width: round(right - left),
        segments: segments.map((item) => ({
          ...item,
          top: round(item.top),
          bottom: round(item.bottom),
        })),
        columns,
      };
      setLayout((current) => (sameLayout(current, next) ? current : next));
    };
    measure();
    // Una medición por cuadro aunque lleguen muchos cambios seguidos.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(tableDom);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(tableDom, {
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
  }, [enabled, tableDom, tableId, query, pushStore]);

  return layout;
}

/**
 * Las líneas de la Tabla `tableId` (lib/table-lines), encima de su
 * contenido.
 */
export function TableLinesOverlay({
  tableId,
  lines,
  lineStyle,
  lineColor,
  lineWidthMm,
}: TableLinesProps & { tableId: NodeId }) {
  const kinds = LINE_KINDS[lines] ?? LINE_KINDS.none;
  const layout = useLinesLayout(tableId, lines !== "none");
  if (!layout) return null;

  const { left, width } = layout;
  const stroke = `${lineWidthMm}mm ${lineStyle} ${lineColor}`;
  // Cada línea centrada sobre su posición.
  const half = `${lineWidthMm / 2}mm`;
  const line = (style: CSSProperties): CSSProperties => ({
    position: "absolute",
    boxSizing: "border-box",
    ...style,
  });

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {layout.segments.map((segment) => (
        <div key={segment.top}>
          {kinds.outer && (
            <div
              style={line({
                left: `calc(${left}px - ${half})`,
                top: `calc(${segment.top}px - ${half})`,
                width: `calc(${width}px + ${lineWidthMm}mm)`,
                height: `calc(${segment.bottom - segment.top}px + ${lineWidthMm}mm)`,
                border: stroke,
              })}
            />
          )}
          {kinds.rows &&
            segment.rows.map((y) => (
              <div
                key={`row-${y}`}
                style={line({
                  left,
                  width,
                  top: `calc(${y}px - ${half})`,
                  height: 0,
                  borderTop: stroke,
                })}
              />
            ))}
          {kinds.columns &&
            layout.columns.map((x) => (
              <div
                key={`column-${x}`}
                style={line({
                  top: segment.top,
                  height: segment.bottom - segment.top,
                  left: `calc(${x}px - ${half})`,
                  width: 0,
                  borderLeft: stroke,
                })}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
