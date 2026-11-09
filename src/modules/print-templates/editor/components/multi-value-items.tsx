import {
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  Scan,
  SquareDashed,
  SquareRoundCorner,
} from "lucide-react";
import type { Corners, Sides } from "../lib/units";
import type { MultiValueItem } from "./multi-value-field";

/**
 * Los valores de uso común de MultiValueField, con sus iconos y el botón que
 * los despliega: se esparcen con `{...SIDES}` o `{...CORNERS}`.
 */

const ICON = "h-3.5 w-3.5";

/** En dos columnas: arriba y abajo, luego los laterales. */
const SIDE_ITEMS: MultiValueItem<keyof Sides>[] = [
  { key: "top", label: "Arriba", icon: <PanelTop className={ICON} /> },
  { key: "bottom", label: "Abajo", icon: <PanelBottom className={ICON} /> },
  { key: "left", label: "Izquierda", icon: <PanelLeft className={ICON} /> },
  { key: "right", label: "Derecha", icon: <PanelRight className={ICON} /> },
];

/**
 * En dos columnas, como quedan en la hoja. El icono redondea la esquina de
 * arriba a la derecha; girado, las demás.
 */
const CORNER_ITEMS: MultiValueItem<keyof Corners>[] = [
  {
    key: "topLeft",
    label: "Arriba a la izquierda",
    icon: <SquareRoundCorner className={`${ICON} -rotate-90`} />,
  },
  {
    key: "topRight",
    label: "Arriba a la derecha",
    icon: <SquareRoundCorner className={ICON} />,
  },
  {
    key: "bottomLeft",
    label: "Abajo a la izquierda",
    icon: <SquareRoundCorner className={`${ICON} rotate-180`} />,
  },
  {
    key: "bottomRight",
    label: "Abajo a la derecha",
    icon: <SquareRoundCorner className={`${ICON} rotate-90`} />,
  },
];

export const SIDES = {
  items: SIDE_ITEMS,
  toggleIcon: <SquareDashed className={ICON} />,
  toggleLabel: "Cada lado por separado",
};

export const CORNERS = {
  items: CORNER_ITEMS,
  toggleIcon: <Scan className={ICON} />,
  toggleLabel: "Cada esquina por separado",
};
