import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { cn } from "@/shared/utils/utils";
import { PROPERTY_HELP } from "../lib/property-help";
import type { FlexDirection } from "../lib/style-props";

/** Dónde quedan los hijos en un eje: al inicio, al centro o al final. */
export type AxisAlign = "start" | "center" | "end";

const AXIS: AxisAlign[] = ["start", "center", "end"];

const X_NAMES: Record<AxisAlign, string> = {
  start: "a la izquierda",
  center: "al centro",
  end: "a la derecha",
};

const Y_NAMES: Record<AxisAlign, string> = {
  start: "arriba",
  center: "al centro",
  end: "abajo",
};

const cellLabel = (x: AxisAlign, y: AxisAlign) => {
  if (y === "center") return `Alinear ${X_NAMES[x]}`;
  return `Alinear ${Y_NAMES[y]} ${X_NAMES[x]}`;
};

// Clases completas, no armadas: Tailwind solo genera las que lee tal cual.
const JUSTIFY_CLASS: Record<AxisAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

const ITEMS_CLASS: Record<AxisAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

interface Cell {
  x: AxisAlign;
  y: AxisAlign;
  label: string;
  selected: boolean;
  /** Posición en la cuadrícula de 3×3 (1 a 3) y cuántas casillas ocupa. */
  column: number;
  row: number;
  span?: "columns" | "rows";
}

const INDEX: Record<AxisAlign, number> = { start: 1, center: 2, end: 3 };

/**
 * Una vista en miniatura de cómo quedan los hijos dentro de la casilla: unos
 * bloques en la dirección del contenedor (en fila, uno al lado de otro; en
 * columna, apilados) llevados a la posición (x, y). Con `spread` son tres y se
 * reparten a lo largo de la franja, como la separación en auto.
 */
function Preview({
  direction,
  x,
  y,
  spread,
}: {
  direction: FlexDirection;
  x: AxisAlign;
  y: AxisAlign;
  spread: boolean;
}) {
  const isRow = direction === "row";
  const blocks = spread ? 3 : 2;

  return (
    <span
      className={cn(
        "flex h-full w-full gap-[3px] px-2 py-1.5",
        isRow ? "flex-row" : "flex-col",
        // En fila el eje principal es el horizontal; en columna, el vertical.
        spread ? "justify-between" : JUSTIFY_CLASS[isRow ? x : y],
        ITEMS_CLASS[isRow ? y : x],
      )}
    >
      {Array.from({ length: blocks }, (_, index) => (
        <span
          key={index}
          // Cada bloque es un elemento: en fila, alto y angosto; en columna,
          // ancho y bajo.
          className={cn(
            "shrink-0 rounded-[2px] bg-current",
            isRow ? "h-3 w-2" : "h-2 w-4",
          )}
        />
      ))}
    </span>
  );
}

/**
 * La alineación de los hijos de un contenedor, en una cuadrícula de casillas
 * separadas: cada una es una posición, con su tooltip y una miniatura de cómo
 * quedan. Con la separación en auto el eje en que se reparte ya no se elige:
 * la franja elegida lo ocupa entero y las demás casillas siguen ahí, y cada
 * una elige solo el otro eje. El doble clic en una casilla activa o desactiva
 * ese modo (onToggleAuto).
 */
export function AlignmentField({
  direction,
  autoGap,
  alignX,
  alignY,
  onChange,
  onToggleAuto,
}: {
  direction: FlexDirection;
  autoGap: boolean;
  alignX: AxisAlign;
  alignY: AxisAlign;
  onChange: (x: AxisAlign, y: AxisAlign) => void;
  /** Doble clic en la casilla (x, y). */
  onToggleAuto: (x: AxisAlign, y: AxisAlign) => void;
}) {
  const isRow = direction === "row";

  const stripLabel = (x: AxisAlign, y: AxisAlign) =>
    isRow ? `Alinear ${Y_NAMES[y]}` : `Alinear ${X_NAMES[x]}`;

  const cells: Cell[] = [];
  for (const y of AXIS) {
    for (const x of AXIS) {
      const position = { x, y, column: INDEX[x], row: INDEX[y] };
      if (!autoGap) {
        cells.push({
          ...position,
          label: cellLabel(x, y),
          selected: x === alignX && y === alignY,
        });
        continue;
      }
      // En fila se elige la altura (franjas); en columna, el lado (columnas).
      const inSelectedStrip = isRow ? y === alignY : x === alignX;
      if (inSelectedStrip) {
        // Una sola casilla por franja: la que empieza la franja.
        const first = isRow ? x === "start" : y === "start";
        if (first) {
          cells.push({
            ...position,
            label: stripLabel(x, y),
            selected: true,
            span: isRow ? "columns" : "rows",
          });
        }
        continue;
      }
      cells.push({ ...position, label: stripLabel(x, y), selected: false });
    }
  }

  const current = (
    autoGap ? stripLabel(alignX, alignY) : cellLabel(alignX, alignY)
  ).replace("Alinear ", "");
  const caption = current.charAt(0).toUpperCase() + current.slice(1);

  return (
    <div className="flex flex-col gap-1.5">
      {/* La elegida, en palabras, junto a la etiqueta. */}
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel help={PROPERTY_HELP.alignment}>Alineación</FieldLabel>
        <span className="truncate text-[11px] text-muted-foreground">
          {caption}
          {autoGap && " · repartido"}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Alineación"
        className="grid w-full grid-cols-3 grid-rows-[repeat(3,28px)] gap-1"
      >
        {cells.map((cell) => (
          <Tooltip key={`${cell.x}-${cell.y}`}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-checked={cell.selected}
                aria-label={cell.label}
                onClick={() => onChange(cell.x, cell.y)}
                onDoubleClick={() => onToggleAuto(cell.x, cell.y)}
                style={{
                  gridColumn: `${cell.column} / span ${cell.span === "columns" ? 3 : 1}`,
                  gridRow: `${cell.row} / span ${cell.span === "rows" ? 3 : 1}`,
                }}
                className={cn(
                  "group flex overflow-hidden rounded-md border transition-colors",
                  cell.selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground/40 hover:border-primary/50 hover:bg-accent hover:text-muted-foreground",
                )}
              >
                <Preview
                  direction={direction}
                  x={cell.x}
                  y={cell.y}
                  spread={cell.selected && autoGap}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-[11px]">
              {cell.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
