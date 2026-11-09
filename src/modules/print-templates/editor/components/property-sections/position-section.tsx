import { useId } from "react";
import { ROOT_NODE, useEditor, useNode } from "@craftjs/core";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { usePaper } from "../../lib/paper-context";
import { PROPERTY_HELP } from "../../lib/property-help";
import type { PositionProps, SizeProps } from "../../lib/style-props";
import { pxToMm, ZERO_SIDES, type Sides } from "../../lib/units";
import type { PropSetter } from "../../lib/use-node-props";
import { useNodeSizeMm } from "../../lib/use-node-size";
import { numberRule } from "../../lib/validators";
import { PropertySection } from "../property-section";
import { NumberField } from "../settings-fields";

/** Cualquier número (puede quedar fuera de la hoja); vacío = 0. */
const validatePosition = numberRule({ empty: 0 });

/** Redondeo a la décima de mm, como lo que se mide. */
const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Dónde está ahora el elemento dentro de la Hoja, en mm desde su interior:
 * así al pasar a libre no se mueve. Suma los offset hasta la Hoja (que es
 * relative) más el borde de cada ancestro posicionado por el medio.
 */
function positionInPage(dom: HTMLElement, page: HTMLElement) {
  let x = 0;
  let y = 0;
  let element: HTMLElement | null = dom;
  while (element && element !== page) {
    x += element.offsetLeft;
    y += element.offsetTop;
    const parent = element.offsetParent as HTMLElement | null;
    if (parent && parent !== page) {
      x += parent.clientLeft;
      y += parent.clientTop;
    }
    element = parent;
  }
  return { x: pxToMm(x), y: pxToMm(y) };
}

type AlignAction = "left" | "centerX" | "right" | "top" | "centerY" | "bottom";

const ALIGN_GROUPS: {
  action: AlignAction;
  label: string;
  icon: LucideIcon;
}[][] = [
  [
    {
      action: "left",
      label: "Alinear a la izquierda",
      icon: AlignStartVertical,
    },
    {
      action: "centerX",
      label: "Centrar en horizontal",
      icon: AlignCenterVertical,
    },
    { action: "right", label: "Alinear a la derecha", icon: AlignEndVertical },
  ],
  [
    { action: "top", label: "Alinear arriba", icon: AlignStartHorizontal },
    {
      action: "centerY",
      label: "Centrar en vertical",
      icon: AlignCenterHorizontal,
    },
    { action: "bottom", label: "Alinear abajo", icon: AlignEndHorizontal },
  ],
];

/**
 * Posición: con Libre el componente sale del reparto de su contenedor y se
 * coloca en X e Y, contados desde el interior de la Hoja. Los botones de
 * alinear lo llevan a un borde o al centro de la Hoja; solo funcionan si es
 * libre. Con alto automático, en vertical solo hay arriba: la Hoja no tiene un
 * alto con que centrar ni un borde inferior fijo.
 */
export function PositionSection({
  props,
  set,
}: {
  /** Con el tamaño: al pasar a libre, rellenar se vuelve fijo. */
  props: PositionProps & SizeProps;
  set: PropSetter<PositionProps & SizeProps>;
}) {
  const switchId = useId();
  const paper = usePaper();
  const size = useNodeSizeMm();
  const { dom } = useNode((node) => ({ dom: node.dom }));
  const { pageDom, pageBorder } = useEditor((state) => ({
    pageDom: state.nodes[ROOT_NODE]?.dom ?? null,
    pageBorder: (state.nodes[ROOT_NODE]?.data.props.borderWidth ??
      ZERO_SIDES) as Sides,
  }));

  const setFree = (free: boolean) => {
    if (free && dom && pageDom) {
      const current = positionInPage(dom, pageDom);
      set("xMm", current.x);
      set("yMm", current.y);
    }
    // Libre no tiene espacio que rellenar: rellenar pasa a fijo con lo que
    // medía, así no cambia de tamaño.
    if (free && size) {
      if (props.widthMode === "fill") {
        set("widthMode", "fixed");
        set("widthMm", size.width);
      }
      if (props.heightMode === "fill") {
        set("heightMode", "fixed");
        set("heightMm", size.height);
      }
    }
    set("positionFree", free);
  };

  // El interior de la Hoja: el papel menos su borde.
  const innerWidth = paper
    ? paper.widthMm - pageBorder.left - pageBorder.right
    : 0;
  // Con alto automático no hay alto: no se alinea al centro ni abajo.
  const autoHeight = paper?.heightMm === "auto";
  const innerHeight =
    paper && paper.heightMm !== "auto"
      ? paper.heightMm - pageBorder.top - pageBorder.bottom
      : 0;

  const align = (action: AlignAction) => {
    if (!size) return;
    switch (action) {
      case "left":
        return set("xMm", 0);
      case "centerX":
        return set("xMm", round((innerWidth - size.width) / 2));
      case "right":
        return set("xMm", round(innerWidth - size.width));
      case "top":
        return set("yMm", 0);
      case "centerY":
        return set("yMm", round((innerHeight - size.height) / 2));
      case "bottom":
        return set("yMm", round(innerHeight - size.height));
    }
  };

  const canAlign = props.positionFree && Boolean(paper && size);

  return (
    <PropertySection title="Posición">
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={switchId} help={PROPERTY_HELP.free}>
          Libre
        </FieldLabel>
        <Switch
          id={switchId}
          checked={props.positionFree}
          onCheckedChange={setFree}
        />
      </div>
      {props.positionFree && (
        <>
          <NumberField
            label="X"
            help={PROPERTY_HELP.x}
            value={props.xMm}
            validate={validatePosition}
            onChange={(value) => set("xMm", value)}
          />
          <NumberField
            label="Y"
            help={PROPERTY_HELP.y}
            value={props.yMm}
            validate={validatePosition}
            onChange={(value) => set("yMm", value)}
          />
        </>
      )}
      <div className="flex flex-col gap-1.5">
        <FieldLabel help={PROPERTY_HELP.positionAlign}>Alineación</FieldLabel>
        <div className="flex gap-1.5">
          {ALIGN_GROUPS.map((group, index) => (
            <ButtonGroup key={index}>
              {group
                .filter(
                  ({ action }) =>
                    !autoHeight ||
                    (action !== "centerY" && action !== "bottom"),
                )
                .map(({ action, label, icon: Icon }) => (
                  <Tooltip key={action}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        disabled={!canAlign}
                        aria-label={label}
                        onClick={() => align(action)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-[11px]">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ))}
            </ButtonGroup>
          ))}
        </div>
      </div>
    </PropertySection>
  );
}
