import { useState, type ReactNode } from "react";
import { RgbaColorPicker } from "react-colorful";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  hexToRgba,
  parseColor,
  rgbaToHex6,
  rgbaToString,
} from "@/modules/ecommerce/editor/components/color-field";
import { cn } from "@/shared/utils/utils";
import { numberRule, type Validator } from "../lib/validators";
import { CommitInput } from "./commit-input";
import { UnitText } from "./unit-text";
import { EditorTooltip } from "./editor-tooltip";

/**
 * El campo de color del editor: muestra, hexadecimal y opacidad, en un solo
 * InputGroup. Solo la muestra abre el selector; los dos campos se escriben ahí
 * mismo y, como todos los del editor, son CommitInput. El color se guarda como
 * `rgba(r, g, b, a)`; sin un color que se pueda leer parte de blanco opaco.
 */

const INPUT_CLASS = "h-full text-[12px] md:text-[12px] tabular-nums";

/** Los seis dígitos, sin almohadilla ni opacidad, en mayúsculas. */
const formatHex = (color: string) =>
  rgbaToHex6(parseColor(color)).toUpperCase();

const formatOpacity = (color: string) =>
  String(Math.round(parseColor(color).a * 100));

/**
 * Hexadecimal con o sin almohadilla. Con 8 dígitos los dos últimos son la
 * opacidad ("FFFFFF80" = 50 %); con 6 (o 3) se conserva la que tenía.
 */
const hexRule =
  (color: string): Validator<string> =>
  (text) => {
    const digits = text.trim().replace(/^#/, "");
    const read = hexToRgba(digits);
    if (!read) return null;
    const a = digits.length === 8 ? read.a : parseColor(color).a;
    return { value: rgbaToString({ ...read, a }) };
  };

const validatePercent = numberRule({ min: 0, max: 100 });

/** De 0 a 100, con o sin "%". */
const opacityRule =
  (color: string): Validator<string> =>
  (text) => {
    const percent = validatePercent(text.replace("%", ""));
    if (!percent) return null;
    const a = Math.round(percent.value) / 100;
    return { value: rgbaToString({ ...parseColor(color), a }) };
  };

type Channel = "r" | "g" | "b";

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "r", label: "Rojo" },
  { key: "g", label: "Verde" },
  { key: "b", label: "Azul" },
];

const validateChannel = numberRule({ min: 0, max: 255, integer: true });

/** Un canal RGB: entero de 0 a 255. */
const channelRule =
  (color: string, channel: Channel): Validator<string> =>
  (text) => {
    const amount = validateChannel(text);
    if (!amount) return null;
    return {
      value: rgbaToString({ ...parseColor(color), [channel]: amount.value }),
    };
  };

type Mode = "hex" | "rgb";

/**
 * Los campos del color en un InputGroup: el hexadecimal (o R, G y B), y la
 * opacidad al extremo derecho. `start` va delante, dentro del mismo grupo.
 */
function ColorInputs({
  value,
  onChange,
  mode = "hex",
  start,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  mode?: Mode;
  start?: ReactNode;
  className?: string;
}) {
  return (
    <InputGroup className={cn("h-8", className)}>
      {start && (
        <InputGroupAddon align="inline-start" className="pl-2">
          {start}
        </InputGroupAddon>
      )}
      {mode === "hex" ? (
        <CommitInput
          as={InputGroupInput}
          aria-label="Color en hexadecimal"
          spellCheck={false}
          value={value}
          format={formatHex}
          validate={hexRule(value)}
          onCommit={onChange}
          className={cn(INPUT_CLASS, "min-w-0 px-2 uppercase")}
        />
      ) : (
        CHANNELS.map(({ key, label }, index) => (
          <CommitInput
            key={key}
            as={InputGroupInput}
            aria-label={label}
            inputMode="numeric"
            value={value}
            format={(color) => String(parseColor(color)[key])}
            validate={channelRule(value, key)}
            onCommit={onChange}
            className={cn(
              INPUT_CLASS,
              "min-w-0 px-1 text-center",
              index > 0 && "border-l border-input",
            )}
          />
        ))
      )}
      {/* Con label, pulsar el "%" lleva el foco a la opacidad. */}
      <label className="flex h-full shrink-0 items-center border-l border-input pr-2">
        <CommitInput
          as={InputGroupInput}
          aria-label="Opacidad"
          inputMode="numeric"
          value={value}
          format={formatOpacity}
          validate={opacityRule(value)}
          onCommit={onChange}
          className={cn(INPUT_CLASS, "w-9 flex-none px-1 text-right")}
        />
        <UnitText unit="%" label="Opacidad, en porcentaje" />
      </label>
    </InputGroup>
  );
}

/** La muestra del color, con damero detrás si no es opaco. */
function Swatch({ color }: { color: string }) {
  const rgba = parseColor(color);
  return (
    <span
      className="relative block h-4 w-4 overflow-hidden rounded-sm border border-input"
      style={
        rgba.a < 1
          ? {
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }
          : undefined
      }
    >
      <span
        className="block h-full w-full"
        style={{ backgroundColor: rgbaToString(rgba) }}
      />
    </span>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("hex");

  return (
    <Popover>
      {/* El selector se abre bajo todo el campo, no solo bajo la muestra. */}
      <PopoverAnchor asChild>
        <div>
          <ColorInputs
            value={value}
            onChange={onChange}
            start={
              <EditorTooltip label="Elegir color">
                <PopoverTrigger asChild>
                  <InputGroupButton size="icon-xs" aria-label="Elegir color">
                    <Swatch color={value} />
                  </InputGroupButton>
                </PopoverTrigger>
              </EditorTooltip>
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-[288px] p-3" align="start">
        {/* La rueda se estira a lo ancho y conserva su altura. */}
        <div className="[&_.react-colorful]:w-full">
          <RgbaColorPicker
            color={parseColor(value)}
            onChange={(next) => onChange(rgbaToString(next))}
          />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Select value={mode} onValueChange={(next) => setMode(next as Mode)}>
            <SelectTrigger className="h-8 w-[64px] shrink-0 px-2 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-[12px]" value="hex">
                Hex
              </SelectItem>
              <SelectItem className="text-[12px]" value="rgb">
                RGB
              </SelectItem>
            </SelectContent>
          </Select>
          <ColorInputs
            value={value}
            onChange={onChange}
            mode={mode}
            className="min-w-0 flex-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
