import { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";
import {
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Ruler,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import type { FlexDirection } from "../lib/style-props";
import { pxToMm } from "../lib/units";
import { numberRule } from "../lib/validators";
import { PROPERTY_HELP } from "../lib/property-help";
import { CommitInput } from "./commit-input";
import { HelpLabel } from "./help-label";
import { UnitText } from "./unit-text";
import { ModeSelect, type ModeOption } from "./mode-select";

/** `fixed`, la separación escrita; `auto`, la que reparte el espacio libre. */
export type GapMode = "fixed" | "auto";

/** 0 o más; vacío = 0. */
const validateGap = numberRule({ min: 0, empty: 0 });

const ICON = "h-3.5 w-3.5";

const gapModes = (direction: FlexDirection): ModeOption<GapMode>[] => [
  {
    value: "fixed",
    label: "Fijo",
    icon: (
      <Ruler className={direction === "row" ? ICON : `${ICON} rotate-90`} />
    ),
  },
  {
    value: "auto",
    label: "Auto",
    icon:
      direction === "row" ? (
        <AlignHorizontalSpaceBetween className={ICON} />
      ) : (
        <AlignVerticalSpaceBetween className={ICON} />
      ),
  },
];

/**
 * Lo que separa de verdad a los dos primeros hijos del nodo, en mm, sin
 * contar sus márgenes exteriores. null si tiene menos de dos.
 */
function useMeasuredGapMm(direction: FlexDirection): number | null {
  const { dom } = useNode((node) => ({ dom: node.dom }));
  const [gap, setGap] = useState<number | null>(null);

  useEffect(() => {
    if (!dom) return;
    const measure = () => {
      const [first, second] = Array.from(dom.children) as HTMLElement[];
      if (!first || !second) {
        setGap(null);
        return;
      }
      const a = getComputedStyle(first);
      const b = getComputedStyle(second);
      const px =
        direction === "row"
          ? second.offsetLeft -
            parseFloat(b.marginLeft) -
            (first.offsetLeft + first.offsetWidth + parseFloat(a.marginRight))
          : second.offsetTop -
            parseFloat(b.marginTop) -
            (first.offsetTop + first.offsetHeight + parseFloat(a.marginBottom));
      setGap(Math.max(0, pxToMm(px)));
    };
    measure();
    // Cambia al redimensionarse el contenedor o al entrar y salir hijos.
    const resize = new ResizeObserver(measure);
    resize.observe(dom);
    const mutation = new MutationObserver(measure);
    mutation.observe(dom, { childList: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [dom, direction]);

  return gap;
}

/**
 * Separación entre elementos en un InputGroup: el valor, la unidad y el
 * selector de modo, como Ancho y Alto. En auto el campo se deshabilita y
 * muestra lo que separa de verdad; en fijo se edita el valor guardado, que no
 * cambia al pasar por auto (son valores distintos).
 */
export function GapField({
  direction,
  mode,
  valueMm,
  onChange,
}: {
  direction: FlexDirection;
  mode: GapMode;
  valueMm: number;
  onChange: (mode: GapMode, valueMm: number) => void;
}) {
  const measured = useMeasuredGapMm(direction);
  const isAuto = mode === "auto";
  const shown = isAuto ? (measured ?? valueMm) : valueMm;
  const label = "Separación entre elementos";

  return (
    <PanelField label={<HelpLabel label={label} help={PROPERTY_HELP.gap} />}>
      {(id) => (
        <InputGroup className="h-8 overflow-hidden">
          <CommitInput
            as={InputGroupInput}
            id={id}
            inputMode="decimal"
            disabled={isAuto}
            value={shown}
            validate={validateGap}
            onCommit={(next) => onChange("fixed", next)}
            className="h-full min-w-0 px-2 text-[12px] tabular-nums md:text-[12px]"
          />
          <InputGroupAddon
            align="inline-end"
            className="h-full self-stretch border-l border-input py-0 pl-2 pr-2"
          >
            <UnitText unit="mm" />
          </InputGroupAddon>
          <ModeSelect
            label={label}
            options={gapModes(direction)}
            value={mode}
            onChange={(next) => onChange(next, valueMm)}
          />
        </InputGroup>
      )}
    </PanelField>
  );
}
