const POPOVER_SIDE_OFFSET = 8;

import { useRef, useState, useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, ChevronRight, ExternalLink, Plus, Trash2, Copy, GripVertical, Info } from "lucide-react";
import {
  generateId,
  reorderById,
  backfillIdsAndNames,
  needsBackfill,
  nextDefaultName,
  duplicateAt,
  useDragReorder,
} from "./drag-reorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorField } from "@/modules/ecommerce/editor/components/color-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/utils";
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section";
import { SpacingSection, useSpacingCss } from "@/modules/ecommerce/editor/components/spacing-section";
import {
  TypographySection,
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section";
import type { BorderStyle, MeasureSpec } from "@/modules/ecommerce/editor/components/box-measures";
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select";

export type DropdownOptionContent = {
  title?: string;
  description?: string;
  image?: string;
  buttonLink?: string;
  buttonLabel?: string;
};

export type DropdownOption = {
  id?: string;
  name?: string;
  label: string;
  content: DropdownOptionContent;
};

interface EditableHoverableDropdownProps {
  triggerLabel?: string;
  options?: DropdownOption[];
  triggerVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  triggerSize?: "sm" | "default" | "lg";
  /**
   * @deprecated Tamano de letra del disparador, como numero y unidad sueltos y
   * sin modos de pantalla. Se sigue leyendo porque lo traen los desplegables ya
   * publicados; hoy va en `sizeDesktop/Tablet/Mobile` + `sizeUnit` (ver
   * TypographySection).
   */
  triggerFontSizeNum?: string;
  /** @deprecated La unidad del tamano anterior. Mismo motivo que `triggerFontSizeNum`. */
  triggerFontSizeUnit?: string;
  /**
   * @deprecated Alto de linea del disparador, como numero y unidad sueltos. Se
   * sigue leyendo porque lo traen los desplegables ya publicados; hoy va en
   * `lineHeightDesktop/Tablet/Mobile` + `lineHeightUnit`.
   */
  triggerLineHeightNum?: string;
  /** @deprecated La unidad del alto de linea anterior. Mismo motivo que `triggerLineHeightNum`. */
  triggerLineHeightUnit?: string;
  /**
   * @deprecated Color del texto del disparador. Se sigue leyendo porque lo traen
   * los desplegables ya publicados; hoy es `textColor` (ver TypographySection).
   */
  triggerTextColor?: string;
  triggerBgColor?: string;
  /** Color de estado, no de tipografia: vive con los demas colores del disparador. */
  triggerHoverBg?: string;
  /** Color de estado, no de tipografia: vive con los demas colores del disparador. */
  triggerHoverText?: string;
  customClass?: string;
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
  /** Bordes del boton disparador. Ver BorderSection. */
  borderStyle?: BorderStyle;
  borderColor?: string;
  [key: string]: unknown;
}

/** Las unidades que el control de medidas sabe pintar; el resto va como texto libre. */
const UNIDADES_CONOCIDAS: PropertyUnit[] = ["px", "em", "rem", "%"];

/**
 * El numero y la unidad sueltos del formato anterior, pasados a la medida que
 * entiende TypographySection.
 *
 * Sin unidad —un alto de linea sin unidad es un multiplicador— o con una que el
 * control no lista (vw, vh, pt, que si ofrecia el panel anterior), la medida va
 * como texto libre, que es lo unico que la pinta tal cual.
 */
function medidaDe(num: unknown, unidad: unknown): MeasureSpec | undefined {
  const texto = String(num ?? "").trim();
  if (!texto) return undefined;
  const sufijo = String(unidad ?? "").trim();
  const valor = Number(texto);
  if (sufijo && UNIDADES_CONOCIDAS.includes(sufijo as PropertyUnit) && Number.isFinite(valor))
    return { value: valor, unit: sufijo as PropertyUnit, custom: "" };
  return { value: undefined, unit: "custom", custom: `${texto}${sufijo}` };
}

/**
 * La letra del formato anterior, que este bloque guardaba entera con el prefijo
 * del disparador y sin modos de pantalla: el mismo tamano, alto de linea y
 * color valian para los tres, asi que basta declarar el escritorio y los otros
 * dos lo heredan, que es lo que ya hacian. Lo usan el render y el panel, para
 * que los dos vean lo mismo.
 *
 * El tamano sin unidad guardada se pintaba en px, que es lo que hacia el render.
 */
function typographyLegacyOf(props: EditableHoverableDropdownProps): TypographyLegacy {
  const {
    triggerFontSizeNum,
    triggerFontSizeUnit,
    triggerLineHeightNum,
    triggerLineHeightUnit,
    triggerTextColor,
  } = props;
  return {
    size: { desktop: medidaDe(triggerFontSizeNum, triggerFontSizeUnit ?? "px") },
    lineHeight: { desktop: medidaDe(triggerLineHeightNum, triggerLineHeightUnit) },
    textColor: triggerTextColor,
  };
}

function OptionPopoverContent({
  title,
  description,
  image,
  buttonLink,
  buttonLabel = "Ver más",
}: DropdownOptionContent) {
  return (
    <div className="flex flex-col gap-2">
      {title && <h3 className="text-base font-semibold">{title}</h3>}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {image && buttonLink && (
        <a
          href={buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full aspect-square overflow-hidden rounded-md block"
        >
          <img src={image} alt={title ?? ""} className="w-full h-full object-cover" />
        </a>
      )}
      {image && !buttonLink && (
        <div className="w-full aspect-square overflow-hidden rounded-md">
          <img src={image} alt={title ?? ""} className="w-full h-full object-cover" />
        </div>
      )}
      {buttonLink && (
        <a
          href={buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {buttonLabel}
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function HoverOptionItem({
  label,
  content,
  containerRef
}: {
  label: string;
  content: DropdownOptionContent;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [alignOffset, setAlignOffset] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setAlignOffset(-(triggerRect.top - containerRect.top));
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <DropdownMenuItem
          ref={triggerRef}
          onSelect={(e) => e.preventDefault()}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
          className="justify-between"
        >
          {label}
          <ChevronRight
            className="ml-auto size-4 transition-transform duration-200"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        alignOffset={alignOffset}
        sideOffset={POPOVER_SIDE_OFFSET}
        className="w-[26rem] p-0 bg-transparent border-none shadow-none"
        style={{ maxHeight: "var(--radix-popper-available-height)", overflowY: "visible" }}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
      >
        <div className="pr-2 overflow-visible">
          <div className="w-full bg-popover rounded-md shadow-md ring-1 ring-gray-200 p-4">
            <OptionPopoverContent {...content} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditableHoverableDropdown(props: EditableHoverableDropdownProps) {
  const {
    triggerLabel = "Dropdown",
    options = [],
    triggerVariant = "secondary",
    triggerSize = "sm",
    triggerBgColor,
    triggerHoverBg,
    triggerHoverText,
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
  } = props;
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile });
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);
  // Los bordes van en el boton disparador, no en el contenedor.
  const borde = useBorderCss(props as Record<string, unknown>);
  // El bloque nunca guardo medidas propias: sin legacy.
  const medidas = useSpacingCss(props as Record<string, unknown>);
  // La letra del disparador: fuente, grosor, tamano, alto de linea, espaciado y
  // color, por modo de pantalla. Mientras el bloque siga en el formato anterior
  // se pinta la letra de entonces.
  const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf(props));

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [triggerHovered, setTriggerHovered] = useState(false);

  // Solo los colores de estado: el color de reposo lo pone la tipografia, y en
  // linea gana igual porque el estilo en linea pisa a cualquier clase.
  const triggerStyle: React.CSSProperties = {
    ...(triggerBgColor && !triggerHovered ? { backgroundColor: triggerBgColor } : {}),
    ...(triggerHovered && triggerHoverBg ? { backgroundColor: triggerHoverBg } : {}),
    ...(triggerHovered && triggerHoverText ? { color: triggerHoverText } : {}),
  };

  return (
    <>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        className={cn(
          "h-fit w-fit group",
          visClass,
          customCssClass,
          customClass,
        )}
      >
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={triggerVariant}
              size={triggerSize}
              className={cn("group/btn", borde.className, medidas.className, letra.className)}
              style={triggerStyle}
              onMouseEnter={() => setTriggerHovered(true)}
              onMouseLeave={() => setTriggerHovered(false)}
            >
              {triggerLabel}
              <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]/btn:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent ref={contentRef}>
            {options.map((option, i) => (
              <HoverOptionItem
                key={i}
                label={option.label}
                content={option.content}
                containerRef={contentRef}
              />
            ))}
            {options.length === 0 && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                Sin opciones
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SelectableNode>
    </>
  );
}

function EditableHoverableDropdownSettings() {
  const {
    actions: { setProp },
    triggerLabel,
    options,
    typographyLegacy,
    triggerBgColor,
    triggerHoverBg,
    triggerHoverText,
    customClass,
    customCss,
  } = useNode((node) => ({
    triggerLabel: node.data.props.triggerLabel,
    options: node.data.props.options as DropdownOption[],
    // La letra del formato anterior, resuelta igual que en el render.
    typographyLegacy: typographyLegacyOf(node.data.props as EditableHoverableDropdownProps),
    triggerBgColor: node.data.props.triggerBgColor,
    triggerHoverBg: node.data.props.triggerHoverBg,
    triggerHoverText: node.data.props.triggerHoverText,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }));

  // Que items estan desplegados, para tintar solo esas cabeceras.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Opciones guardadas antes de este cambio pueden no tener id/nombre.
  useEffect(() => {
    if (needsBackfill(options ?? [])) {
      setProp((props: EditableHoverableDropdownProps) => {
        props.options = backfillIdsAndNames(props.options ?? [], "Opción");
      });
    }
  }, [options, setProp]);

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => {
      setProp((props: EditableHoverableDropdownProps) => {
        props.options = reorderById(props.options ?? [], fromId, toId);
      });
    });

  const addOption = () => {
    setProp((props: EditableHoverableDropdownProps) => {
      props.options = [
        ...(props.options ?? []),
        {
          id: generateId(),
          name: nextDefaultName(props.options ?? [], "Opción"),
          label: "Nueva opción",
          content: { title: "", description: "", image: "", buttonLink: "", buttonLabel: "Ver más" },
        },
      ];
    });
  };

  const duplicateOption = (index: number) => {
    setProp((props: EditableHoverableDropdownProps) => {
      props.options = duplicateAt(props.options ?? [], index, "Opción");
    });
  };

  const removeOption = (index: number) => {
    setProp((props: EditableHoverableDropdownProps) => {
      props.options = (props.options ?? []).filter((_, i) => i !== index);
    });
  };

  const updateOption = (index: number, key: keyof DropdownOption, value: string) => {
    setProp((props: EditableHoverableDropdownProps) => {
      const opts = [...(props.options ?? [])];
      opts[index] = { ...opts[index], [key]: value };
      props.options = opts;
    });
  };

  const updateOptionContent = (index: number, key: keyof DropdownOptionContent, value: string) => {
    setProp((props: EditableHoverableDropdownProps) => {
      const opts = [...(props.options ?? [])];
      opts[index] = { ...opts[index], content: { ...opts[index].content, [key]: value } };
      props.options = opts;
    });
  };

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Texto</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              value={triggerLabel}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setProp((props: EditableHoverableDropdownProps) => (props.triggerLabel = e.target.value))
              }
            />
          </div>
        </div>
      </SettingsSection>

      {/* La alineacion no se ofrece: el disparador es un flex con su contenido
          centrado, asi que alinear el texto dentro no mueve nada. */}
      <TypographySection legacy={typographyLegacy} fields={{ textAlign: false }} />

      <SettingsSection title="Colores">
        <div className="flex flex-col gap-3">
          {/* El color de texto vive en Tipografía, con el resto de la letra;
              aqui solo quedan el fondo y los colores de estado. */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Color de fondo</Label>
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={triggerBgColor}
                onChange={(val) =>
                  setProp((props: EditableHoverableDropdownProps) => (props.triggerBgColor = val))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Fondo de hover</Label>
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={triggerHoverBg}
                onChange={(val) =>
                  setProp((props: EditableHoverableDropdownProps) => (props.triggerHoverBg = val))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Texto de hover</Label>
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={triggerHoverText}
                onChange={(val) =>
                  setProp((props: EditableHoverableDropdownProps) => (props.triggerHoverText = val))
                }
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Opciones">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-foreground/80">Opciones</Label>
            <Button size="sm" variant="outline" className="h-7 px-2 text-[12px]" onClick={addOption}>
              <Plus className="size-3 mr-1" /> Agregar
            </Button>
          </div>

          {(options ?? []).length === 0 && (
            <p className="text-[11px] text-foreground/60">No hay opciones. Agrega una.</p>
          )}

          {(options ?? []).map((option, i) => {
            const itemKey = option.id ?? String(i)
            const isOpen = !!openItems[itemKey]
            const displayName = option.name?.trim() || `Opción ${i + 1}`

            return (
            <Collapsible
              key={itemKey}
              open={isOpen}
              onOpenChange={(value) =>
                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
              }
            >
              <div
                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(option.id)}`}
                onDragOver={(e) => handleDragOver(e, option.id)}
                onDrop={(e) => handleDrop(e, option.id)}
              >
                <CollapsibleTrigger asChild>
                  {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                      ocupan el alto completo de la fila y no quedan huecos
                      muertos que desplieguen el item por un click fallido.
                      La cabecera solo se tinta cuando el item esta desplegado. */}
                  <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                    <div className="flex items-stretch min-w-0 flex-1">
                      <span
                        draggable={!!option.id}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (option.id) handleDragStart(e, option.id)
                        }}
                        onDragEnd={handleDragEnd}
                        className="flex shrink-0 items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-3 w-3" />
                      </span>
                      {/* El truncate va en el hijo: sobre un contenedor flex el
                          ellipsis no se aplica. title = tooltip nativo. */}
                      <span className="flex items-center min-w-0 py-2.5 pr-2.5">
                        <span
                          className="truncate text-[12px] font-medium"
                          title={displayName}
                        >
                          {displayName}
                        </span>
                      </span>
                    </div>

                    {/* Botones pegados entre si: sus areas se tocan, pero el
                        px-2.5 de cada uno mantiene separados los iconos. */}
                    <div className="flex items-stretch shrink-0">
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateOption(i)
                        }}
                        title="Duplicar"
                        className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          removeOption(i)
                        }}
                        title="Eliminar"
                        className="flex items-center px-2.5 py-2.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 px-3 [&>*:first-child]:pt-3 [&>*:last-child]:pb-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-[11px] font-bold text-foreground/80">Nombre</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Para qué sirve el nombre"
                            className="text-muted-foreground hover:text-foreground cursor-help"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-[12px]">
                          Solo se utiliza para identificar la opción dentro del editor.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      value={option.name ?? ""}
                      onChange={(e) => updateOption(i, "name", e.target.value)}
                      placeholder={`Opción ${i + 1}`}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Etiqueta</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={option.label}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateOption(i, "label", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Título (popover)</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={option.content.title ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateOptionContent(i, "title", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Descripción</Label>
                    <Textarea
                      className="text-[12px]"
                      value={option.content.description ?? ""}
                      rows={3}
                      onChange={(e) => updateOptionContent(i, "description", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">URL imagen</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={option.content.image ?? ""}
                      placeholder="https://..."
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateOptionContent(i, "image", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Enlace botón</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={option.content.buttonLink ?? ""}
                      placeholder="https://..."
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateOptionContent(i, "buttonLink", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Texto del botón</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={option.content.buttonLabel ?? "Ver más"}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateOptionContent(i, "buttonLabel", e.target.value)}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            )
          })}
        </div>
      </SettingsSection>

      <SpacingSection />

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableHoverableDropdownProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableHoverableDropdownProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableHoverableDropdown.craft = {
  displayName: "Desplegable (hover)",
  props: {
    triggerLabel: "Dropdown",
    options: [],
    triggerVariant: "secondary",
    triggerSize: "sm",
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableHoverableDropdownSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
