import { useId } from "react";
import {
  FoldHorizontal,
  FoldVertical,
  MoveHorizontal,
  MoveVertical,
  Ruler,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { Switch } from "@/components/ui/switch";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import type { SizeMode, SizeProps } from "../../lib/style-props";
import type { PropSetter } from "../../lib/use-node-props";
import { useNodeSizeMm } from "../../lib/use-node-size";
import { numberRule } from "../../lib/validators";
import { PROPERTY_HELP } from "../../lib/property-help";
import { CommitInput } from "../commit-input";
import { HelpLabel } from "../help-label";
import { UnitText } from "../unit-text";
import { ModeSelect, type ModeOption } from "../mode-select";
import { PropertySection } from "../property-section";

/** Mayor que 0; vacío no vale. */
const validateSize = numberRule({ positive: true });

const ICON = "h-3.5 w-3.5";

const WIDTH_MODES: ModeOption<SizeMode>[] = [
  { value: "fixed", label: "Fijo", icon: <Ruler className={ICON} /> },
  {
    value: "fill",
    label: "Rellenar",
    icon: <MoveHorizontal className={ICON} />,
  },
  {
    value: "hug",
    label: "Ajustar a contenido",
    icon: <FoldHorizontal className={ICON} />,
  },
];

const HEIGHT_MODES: ModeOption<SizeMode>[] = [
  {
    value: "fixed",
    label: "Fijo",
    icon: <Ruler className={`${ICON} rotate-90`} />,
  },
  {
    value: "fill",
    label: "Rellenar",
    icon: <MoveVertical className={ICON} />,
  },
  {
    value: "hug",
    label: "Ajustar a contenido",
    icon: <FoldVertical className={ICON} />,
  },
];

/**
 * Una medida con su modo, en un InputGroup: el valor, la unidad y el selector
 * de modo al extremo derecho. El campo muestra siempre lo que mide: en fijo la
 * medida escrita, en rellenar o ajustar lo que ocupa en la hoja. Escribir una
 * medida la deja en fijo.
 */
function SizeField({
  label,
  modes,
  mode,
  valueMm,
  measuredMm,
  locked,
  onChange,
  help,
}: {
  label: string;
  help: string;
  /** Con la relación de aspecto activa el modo queda fijo. */
  locked: boolean;
  modes: ModeOption<SizeMode>[];
  mode: SizeMode;
  valueMm: number;
  /** null mientras no se ha medido. */
  measuredMm: number | null;
  onChange: (mode: SizeMode, valueMm: number) => void;
}) {
  const shown = mode === "fixed" ? valueMm : (measuredMm ?? valueMm);

  return (
    <PanelField label={<HelpLabel label={label} help={help} />}>
      {(id) => (
        <InputGroup className="h-8 overflow-hidden">
          <CommitInput
            as={InputGroupInput}
            id={id}
            inputMode="decimal"
            value={shown}
            validate={validateSize}
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
            options={modes}
            value={mode}
            disabled={locked}
            // Al pasar a fijo se queda con lo que medía: no salta.
            onChange={(next) =>
              onChange(next, next === "fixed" ? shown : valueMm)
            }
          />
        </InputGroup>
      )}
    </PanelField>
  );
}

const roundMm = (value: number) => Math.round(value * 10) / 10;

/** "1,5 : 1": el ancho por cada unidad de alto. */
const formatRatio = (ratio: number) =>
  `${ratio.toLocaleString("es", { maximumFractionDigits: 2 })} : 1`;

/**
 * Ancho y alto, uno debajo del otro, cada uno con su modo, y al final la
 * relación de aspecto: activa, las dos medidas quedan fijas y cambiar una
 * cambia la otra.
 */
export function SizeSection({
  props,
  set,
}: {
  props: SizeProps;
  set: PropSetter<SizeProps>;
}) {
  const measured = useNodeSizeMm();
  const aspectId = useId();
  const ratio =
    props.aspectLocked && props.aspectRatio > 0 ? props.aspectRatio : null;

  const setWidth = (mode: SizeMode, valueMm: number) => {
    set("widthMode", mode);
    set("widthMm", valueMm);
    if (ratio) {
      set("heightMode", "fixed");
      set("heightMm", roundMm(valueMm / ratio));
    }
  };

  const setHeight = (mode: SizeMode, valueMm: number) => {
    set("heightMode", mode);
    set("heightMm", valueMm);
    if (ratio) {
      set("widthMode", "fixed");
      set("widthMm", roundMm(valueMm * ratio));
    }
  };

  // Al activarla se queda con lo que mide ahora, en fijo.
  const setAspectLocked = (locked: boolean) => {
    if (locked) {
      const width =
        props.widthMode === "fixed"
          ? props.widthMm
          : (measured?.width ?? props.widthMm);
      const height =
        props.heightMode === "fixed"
          ? props.heightMm
          : (measured?.height ?? props.heightMm);
      set("widthMode", "fixed");
      set("widthMm", width);
      set("heightMode", "fixed");
      set("heightMm", height);
      if (width > 0 && height > 0) set("aspectRatio", width / height);
    }
    set("aspectLocked", locked);
  };

  return (
    <PropertySection title="Tamaño">
      <SizeField
        label="Ancho"
        help={PROPERTY_HELP.width}
        modes={WIDTH_MODES}
        mode={props.widthMode}
        valueMm={props.widthMm}
        measuredMm={measured?.width ?? null}
        locked={props.aspectLocked}
        onChange={setWidth}
      />
      <SizeField
        label="Alto"
        help={PROPERTY_HELP.height}
        modes={HEIGHT_MODES}
        mode={props.heightMode}
        valueMm={props.heightMm}
        measuredMm={measured?.height ?? null}
        locked={props.aspectLocked}
        onChange={setHeight}
      />
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={aspectId} help={PROPERTY_HELP.aspectRatio}>
          Relación de aspecto
        </FieldLabel>
        <div className="flex items-center gap-2">
          {ratio && (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatRatio(ratio)}
            </span>
          )}
          <Switch
            id={aspectId}
            checked={props.aspectLocked}
            onCheckedChange={setAspectLocked}
          />
        </div>
      </div>
    </PropertySection>
  );
}
