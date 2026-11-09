import { useId } from "react";
import { ROOT_NODE, useEditor } from "@craftjs/core";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePaper } from "../lib/paper-context";
import { paperSizeKey } from "../lib/imposition";
import { PROPERTY_HELP } from "../lib/property-help";
import type { Imposition } from "../../types/printTemplates.types";
import { HelpLabel } from "./help-label";
import { EditorTooltip } from "./editor-tooltip";
import { ImpositionFields } from "./imposition-fields";

/**
 * «Impresión», en la barra del editor: columnas y copias de la hoja al
 * imprimir (lib/imposition). No cambian el diseño ni sus cortes de página;
 * se guardan con la plantilla (en la Hoja) y se deshacen como lo demás.
 */
export function ImpositionButton({ disabled }: { disabled?: boolean }) {
  const { actions, perSize } = useEditor((state) => ({
    perSize: Boolean(state.nodes[ROOT_NODE]?.data.props.impositionPerSize),
  }));
  const paper = usePaper();
  const perSizeId = useId();
  if (!paper) return null;
  // La medida de ahora, con la que se recuerda su impresión.
  const sizeKey = paperSizeKey(
    paper.presets,
    paper.widthMm,
    paper.heightMm as number,
  );
  const setImposition = (imposition: Imposition) =>
    actions.setProp(ROOT_NODE, (props) => {
      props.imposition = imposition;
      if (props.impositionPerSize)
        props.impositionBySize = {
          ...props.impositionBySize,
          [sizeKey]: imposition,
        };
    });
  return (
    <Popover>
      <EditorTooltip label="Columnas y copias al imprimir">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={disabled}
          >
            <Printer className="h-4 w-4" />
            Impresión
          </Button>
        </PopoverTrigger>
      </EditorTooltip>
      {/* Sin enfocar el primer campo al abrir: su icono de ayuda abría solo
          el tooltip. */}
      <PopoverContent
        align="end"
        className="w-80 p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="text-sm font-semibold">Impresión</p>
        <p className="pb-1 text-[12px] text-muted-foreground">
          Cómo se acomoda la hoja en el papel. El diseño no cambia.
        </p>
        <ImpositionFields
          value={paper.imposition}
          onChange={setImposition}
          presets={paper.impositionPresets}
          pageWidthMm={paper.widthMm}
          pageHeightMm={paper.heightMm}
          multiPage={paper.multiPage}
        />
        {/* Solo con medidas elegibles (las que tienen «Personalizada»). */}
        {paper.presets && (
          <div className="flex items-center gap-2 border-t border-border px-0.5 pt-2 mt-2">
            <Checkbox
              id={perSizeId}
              checked={perSize}
              onCheckedChange={(checked) =>
                actions.setProp(ROOT_NODE, (props) => {
                  props.impositionPerSize = checked === true;
                  // Al encenderla, la medida de ahora arranca con la de ahora;
                  // al apagarla, se olvida lo guardado.
                  props.impositionBySize =
                    checked === true
                      ? { [sizeKey]: paper.imposition }
                      : undefined;
                })
              }
            />
            <label
              htmlFor={perSizeId}
              className="flex cursor-pointer items-center gap-1 text-[11px] text-foreground"
            >
              <HelpLabel
                label="Recordar la impresión de cada medida"
                help={PROPERTY_HELP.impositionPerSize}
              />
            </label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
