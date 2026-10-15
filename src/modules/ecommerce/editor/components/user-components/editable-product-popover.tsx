import { useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import {
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Mail,
  Phone,
  Download,
  Plus,
  Info,
  CheckCircle2,
  ArrowLeft,
  Menu,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { PRODUCT_PLACEHOLDER } from "@/modules/ecommerce/editor/tienda/adapters";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import { ColorField } from "@/modules/ecommerce/editor/components/color-field";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import {
  AdvancedSection,
  useCustomCss,
} from "@/modules/ecommerce/editor/components/advanced-section";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import {
  BorderSection,
  useBorderCss,
  type BorderLegacy,
} from "@/modules/ecommerce/editor/components/border-section";
import { type BorderStyle } from "@/modules/ecommerce/editor/components/box-measures";
import {
  SpacingSection,
  useSpacingCss,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section";
import {
  TypographySection,
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section";
import { FontFamilySelect } from "@/modules/ecommerce/editor/components/user-components/font-family-select";
import {
  PropertyUnitInput,
  resolveUnitValue,
} from "@/modules/ecommerce/editor/components/user-components/property-unit-input";
import { type PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select";
import { fontFamilyMap, type FontFamily } from "@/modules/ecommerce/editor/lib/font-families";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductGrid } from "@/modules/ecommerce/editor/tienda/api";

const IconMap = {
  none: null,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  externalLink: ExternalLink,
  shoppingCart: ShoppingCart,
  mail: Mail,
  phone: Phone,
  download: Download,
  plus: Plus,
  info: Info,
  check: CheckCircle2,
  menu: Menu,
};

type IconName = keyof typeof IconMap;
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style";
import { Separator } from "@/components/ui/separator";

interface EditableProductPopoverProps {
  text?: string;
  icon?: IconName;
  iconAlign?: "left" | "right";
  iconGap?: number;
  iconGapUnit?: PropertyUnit;
  iconGapCustom?: string;
  iconSize?: number;
  iconSizeUnit?: PropertyUnit;
  iconSizeCustom?: string;
  customClass?: string;
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: FontFamily;
  /**
   * El grosor del trazo. Sin valor no se aplica: un boton ya publicado se queda
   * con el peso que trae el componente, y escribirle uno le cambiaria la letra.
   */
  fontWeight?: number;
  sizeDesktop?: number;
  /**
   * El disparador no tenia campo de tableta: de 768px para arriba aplicaba
   * `sizeDesktop`, que es justo lo que da la cascada de la seccion compartida
   * cuando este queda vacio.
   */
  sizeTablet?: number;
  sizeMobile?: number;
  /** Una sola unidad para los tres modos, como en el resto de bloques. */
  sizeUnit?: PropertyUnit;
  sizeCustom?: string;
  /**
   * El alto de linea propio del disparador, un valor y una unidad sueltos, sin
   * modo de pantalla. No pasa a la seccion compartida y sigue editandose dentro
   * de ella: la unidad de la seccion se llama igual (`lineHeightUnit`) pero es
   * de otro tipo, asi que migrarlo perderia el valor de lo ya publicado. Ver el
   * comentario de `TypographySection` en el panel.
   */
  lineHeightNum?: string;
  lineHeightUnit?: string;
  /** Espaciado propio del disparador, sin modo de pantalla. Como el de arriba. */
  letterSpacing?: number;
  letterSpacingUnit?: PropertyUnit;
  letterSpacingCustom?: string;
  /**
   * @deprecated El grosor del borde sin modo de pantalla. Se sigue leyendo
   * porque lo traen los popovers ya publicados y solo alimenta el `legacy`
   * de BorderSection.
   */
  borderLeftWidth?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderRightWidth?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderTopWidth?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomWidth?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  /**
   * @deprecated El radio de la esquina sin modo de pantalla. Mismo motivo
   * que `borderLeftWidth`.
   */
  borderTopLeftRadius?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderTopRightRadius?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomLeftRadius?: number;
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomRightRadius?: number;
  /**
   * @deprecated El relleno sin modo de pantalla. Mismo motivo que
   * `borderLeftWidth`, con el `legacy` de SpacingSection.
   */
  paddingLeft?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingRight?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingTop?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingBottom?: number;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
  popoverAlign?: "start" | "center" | "end";
  popoverSide?: "top" | "bottom" | "left" | "right";
  popoverGap?: number;
  popoverGapUnit?: PropertyUnit;
  popoverGapCustom?: string;
  popoverBorderTopLeftRadius?: number;
  popoverBorderTopRightRadius?: number;
  popoverBorderBottomLeftRadius?: number;
  popoverBorderBottomRightRadius?: number;
  popoverWidth?: number;
  popoverWidthUnit?: PropertyUnit;
  popoverWidthCustom?: string;
  popoverTitle?: string;
  popoverFontFamily?: FontFamily;
  popoverFontSize?: number;
  popoverFontSizeUnit?: PropertyUnit;
  popoverFontSizeCustom?: string;
  popoverLineHeight?: number;
  popoverLineHeightUnit?: PropertyUnit;
  popoverLineHeightCustom?: string;
  popoverLetterSpacing?: number;
  popoverLetterSpacingUnit?: PropertyUnit;
  popoverLetterSpacingCustom?: string;
  productId?: number;
  [key: string]: unknown;
}

// El relleno del boton en el formato anterior (`paddingLeft`, `paddingTop`...),
// con el mismo 8 por defecto que aplicaba, para que la seccion "Tamaño y
// espaciado" lo enseñe y lo migre al primer cambio.
function spacingLegacyOf(p: EditableProductPopoverProps): SpacingLegacy {
  return {
    padding: {
      sides: {
        Top: p.paddingTop ?? 8,
        Right: p.paddingRight ?? 8,
        Bottom: p.paddingBottom ?? 8,
        Left: p.paddingLeft ?? 8,
      },
      unit: "px",
      custom: "",
    },
  };
}

// Los bordes del boton en el formato anterior (`borderTopWidth`,
// `borderTopLeftRadius`...), para que la seccion los enseñe y los migre al
// primer cambio, y para que el render los siga pintando mientras tanto. Los
// radios del popover (`popoverBorder*Radius`) son otra cosa y no entran aqui.
function borderLegacyOf(p: EditableProductPopoverProps): BorderLegacy {
  return {
    width: {
      sides: {
        Top: p.borderTopWidth,
        Right: p.borderRightWidth,
        Bottom: p.borderBottomWidth,
        Left: p.borderLeftWidth,
      },
      unit: "px",
      custom: "",
    },
    radius: {
      sides: {
        TopLeft: p.borderTopLeftRadius,
        TopRight: p.borderTopRightRadius,
        BottomLeft: p.borderBottomLeftRadius,
        BottomRight: p.borderBottomRightRadius,
      },
      unit: "px",
      custom: "",
    },
  };
}

/**
 * La letra del disparador antes de la seccion compartida.
 *
 * El tamano ya se guardaba con los nombres de ahora (`sizeDesktop`,
 * `sizeMobile`) y en px, que es la unidad con la que arranca la seccion, asi
 * que no hay nada que declarar por ahi. La fuente si: el boton pintaba "sans"
 * cuando no habia ninguna elegida (`fontFamilyMap[fontFamily ?? "sans"]` en
 * linea), y sin declararlo un bloque ya publicado sin fuente propia pasaria a
 * heredar la del sitio, que es otra letra.
 */
const TYPOGRAPHY_LEGACY: TypographyLegacy = { fontFamily: "sans" };

export function EditableProductPopover(props: EditableProductPopoverProps) {
  const {
    text = "Ver producto",
    icon = "none",
    iconAlign = "left",
    iconGap = 4,
    iconGapUnit = "px",
    iconGapCustom = "",
    iconSize = 16,
    iconSizeUnit = "px",
    iconSizeCustom = "",
    customClass = "",
    customCss,
    backgroundColor,
    lineHeightNum,
    lineHeightUnit,
    letterSpacing,
    letterSpacingUnit = "px",
    letterSpacingCustom = "",
    borderLeftWidth = 0,
    borderRightWidth = 0,
    borderTopWidth = 0,
    borderBottomWidth = 0,
    borderTopLeftRadius = 0,
    borderTopRightRadius = 0,
    borderBottomLeftRadius = 0,
    borderBottomRightRadius = 0,
    paddingLeft = 8,
    paddingRight = 8,
    paddingTop = 8,
    paddingBottom = 8,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
    popoverAlign = "center",
    popoverSide = "top",
    popoverGap = 8,
    popoverGapUnit = "px",
    popoverGapCustom = "",
    popoverBorderTopLeftRadius = 0,
    popoverBorderTopRightRadius = 0,
    popoverBorderBottomLeftRadius = 0,
    popoverBorderBottomRightRadius = 0,
    popoverWidth = 0,
    popoverWidthUnit = "custom",
    popoverWidthCustom = "auto",
    popoverTitle = "Título",
    popoverFontFamily = "sans",
    popoverFontSize = 16,
    popoverFontSizeUnit = "px",
    popoverFontSizeCustom = "",
    popoverLineHeight = 0,
    popoverLineHeightUnit = "custom",
    popoverLineHeightCustom = "auto",
    popoverLetterSpacing,
    popoverLetterSpacingUnit = "px",
    popoverLetterSpacingCustom = "",
    productId,
  } = props;
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const legacy = borderLegacyOf({
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  });
  const borde = useBorderCss(props as Record<string, unknown>, legacy);
  const medidas = useSpacingCss(
    props as Record<string, unknown>,
    spacingLegacyOf({ paddingLeft, paddingRight, paddingTop, paddingBottom }),
  );
  // La letra del disparador: fuente, grosor, tamano y color salen de la seccion
  // compartida, con su cascada por modo. El alto de linea y el espaciado siguen
  // siendo propios (ver TYPOGRAPHY_LEGACY y el panel) y van en `buttonStyle`.
  const letra = useTypographyCss(
    props as Record<string, unknown>,
    TYPOGRAPHY_LEGACY,
  );

  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  });

  // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la del
  // componente, para que el usuario pueda pisar sus estilos.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const SelectedIcon = IconMap[icon] || null;

  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["product-popover", productId];

  const { data: product, refetch } = useQuery({
    queryKey,
    enabled: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await getProductGrid({
        order: "date-desc",
        product_ids: [productId as number],
        category_id: null,
      });

      if (response.success && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    },
  });

  async function openPopoverWithProduct() {
    if (open) {
      setOpen(false);
      return;
    }

    if (!productId || productId <= 0) return;

    const cached = queryClient.getQueryData(queryKey);
    if (cached) {
      setOpen(true);
      return;
    }

    const result = await refetch();
    if (result.data) {
      setOpen(true);
    }
  }

  const popoverPrice =
    product?.sale_price || product?.regular_price || product?.price || 0;
  const popoverRegularPrice = product?.regular_price ?? product?.price ?? 0;
  const popoverImage =
    product?.images?.[0] || PRODUCT_PLACEHOLDER;

  // El color y la fuente ya no viajan por aqui: los escribe `letra` en su
  // <style>, y en linea se pisarian a si mismos.
  const buttonStyle = {
    backgroundColor,
    ...(lineHeightNum
      ? { lineHeight: `${lineHeightNum}${lineHeightUnit ?? ""}` }
      : {}),
    letterSpacing: resolveUnitValue(
      letterSpacing,
      letterSpacingUnit,
      letterSpacingCustom,
    ),
  } as const;

  const iconGapValue = resolveUnitValue(iconGap, iconGapUnit, iconGapCustom);
  const iconSizeValue = resolveUnitValue(
    iconSize,
    iconSizeUnit,
    iconSizeCustom,
  );
  const iconStyle = {
    width: iconSizeValue,
    height: iconSizeValue,
  };

  const popoverGapValue =
    parseInt(resolveUnitValue(popoverGap, popoverGapUnit, popoverGapCustom)) ||
    0;
  const popoverWidthValue = resolveUnitValue(
    popoverWidth,
    popoverWidthUnit,
    popoverWidthCustom,
  );
  const popoverFontSizeValue = resolveUnitValue(
    popoverFontSize,
    popoverFontSizeUnit,
    popoverFontSizeCustom,
  );
  const popoverLineHeightValue = resolveUnitValue(
    popoverLineHeight,
    popoverLineHeightUnit,
    popoverLineHeightCustom,
  );
  const popoverLetterSpacingValue = resolveUnitValue(
    popoverLetterSpacing,
    popoverLetterSpacingUnit,
    popoverLetterSpacingCustom,
  );
  const popoverContentStyle = {
    fontFamily: fontFamilyMap[popoverFontFamily],
    fontSize: popoverFontSizeValue,
    lineHeight: popoverLineHeightValue,
    letterSpacing: popoverLetterSpacingValue,
  };
  const popoverPriceStyle = {
    fontFamily: fontFamilyMap["open-sans"],
  };

  const buttonContent = (
    <span className="flex items-center" style={{ gap: iconGapValue }}>
      {SelectedIcon && iconAlign === "left" && (
        <SelectedIcon style={iconStyle} />
      )}
      {text}
      {SelectedIcon && iconAlign === "right" && (
        <SelectedIcon style={iconStyle} />
      )}
    </span>
  );

  return (
    <>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        // El boton abre el popover al pulsarlo: el cursor de mano lo avisa
        // mientras se edita, aunque ahi el clic solo sirva para seleccionarlo.
        clickable
        className={cn("h-fit w-fit group", customCssClass, customClass, visClass)}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                "btn-inner flex items-center",
                borde.className,
                medidas.className,
                letra.className,
              )}
              style={buttonStyle}
              onClick={(e) => {
                e.preventDefault();
                if (enabled) return;
                openPopoverWithProduct();
              }}
            >
              {buttonContent}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side={popoverSide}
            align={popoverAlign}
            sideOffset={popoverGapValue}
            className="p-6"
            style={{
              borderTopLeftRadius: popoverBorderTopLeftRadius,
              borderTopRightRadius: popoverBorderTopRightRadius,
              borderBottomLeftRadius: popoverBorderBottomLeftRadius,
              borderBottomRightRadius: popoverBorderBottomRightRadius,
              width: popoverWidthValue,
            }}
          >
            {product && (
              <div className="space-y-2" style={popoverContentStyle}>
                <h4 className="truncate whitespace-nowrap overflow-hidden">
                  {popoverTitle}
                </h4>
                <Separator />
                <div className="flex items-center justify-between gap-4 pt-4">
                  <img
                    src={popoverImage}
                    alt={product.name}
                    className="h-16 w-16 object-cover"
                  />
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <h3 className="truncate whitespace-nowrap overflow-hidden">
                      {product.name}
                    </h3>
                    <div className="flex flex-row flex-wrap">
                      <span
                        className={
                          product.sale_price
                            ? "text-[#ea6262] font-bold"
                            : "font-bold"
                        }
                        style={popoverPriceStyle}
                      >
                        S/.{popoverPrice.toFixed(2)}
                      </span>
                      {product.sale_price && (
                        <span
                          className="text-muted-foreground line-through ml-2"
                          style={popoverPriceStyle}
                        >
                          S/.{popoverRegularPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </SelectableNode>
    </>
  );
}

function EditableProductPopoverSettings() {
  const {
    actions: { setProp },
    text,
    icon,
    iconAlign,
    iconGap,
    iconGapUnit,
    iconGapCustom,
    iconSize,
    iconSizeUnit,
    iconSizeCustom,
    customClass,
    customCss,
    backgroundColor,
    lineHeightNum,
    lineHeightUnit,
    letterSpacing,
    letterSpacingUnit,
    letterSpacingCustom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    popoverAlign,
    popoverSide,
    popoverGap,
    popoverGapUnit,
    popoverGapCustom,
    popoverBorderTopLeftRadius,
    popoverBorderTopRightRadius,
    popoverBorderBottomLeftRadius,
    popoverBorderBottomRightRadius,
    popoverWidth,
    popoverWidthUnit,
    popoverWidthCustom,
    popoverTitle,
    popoverFontFamily,
    popoverFontSize,
    popoverFontSizeUnit,
    popoverFontSizeCustom,
    popoverLineHeight,
    popoverLineHeightUnit,
    popoverLineHeightCustom,
    popoverLetterSpacing,
    popoverLetterSpacingUnit,
    popoverLetterSpacingCustom,
    productId,
  } = useNode((node) => ({
    text: node.data.props.text,
    icon: node.data.props.icon,
    iconAlign: node.data.props.iconAlign,
    iconGap: node.data.props.iconGap,
    iconGapUnit: node.data.props.iconGapUnit,
    iconGapCustom: node.data.props.iconGapCustom,
    iconSize: node.data.props.iconSize,
    iconSizeUnit: node.data.props.iconSizeUnit,
    iconSizeCustom: node.data.props.iconSizeCustom,
    customClass: node.data.props.customClass,
    customCss: node.data.props.customCss,
    backgroundColor: node.data.props.backgroundColor,
    lineHeightNum: node.data.props.lineHeightNum,
    lineHeightUnit: node.data.props.lineHeightUnit,
    letterSpacing: node.data.props.letterSpacing,
    letterSpacingUnit: node.data.props.letterSpacingUnit,
    letterSpacingCustom: node.data.props.letterSpacingCustom,
    borderLeftWidth: node.data.props.borderLeftWidth,
    borderRightWidth: node.data.props.borderRightWidth,
    borderTopWidth: node.data.props.borderTopWidth,
    borderBottomWidth: node.data.props.borderBottomWidth,
    borderTopLeftRadius: node.data.props.borderTopLeftRadius,
    borderTopRightRadius: node.data.props.borderTopRightRadius,
    borderBottomLeftRadius: node.data.props.borderBottomLeftRadius,
    borderBottomRightRadius: node.data.props.borderBottomRightRadius,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    popoverAlign: node.data.props.popoverAlign,
    popoverSide: node.data.props.popoverSide,
    popoverGap: node.data.props.popoverGap,
    popoverGapUnit: node.data.props.popoverGapUnit,
    popoverGapCustom: node.data.props.popoverGapCustom,
    popoverBorderTopLeftRadius: node.data.props.popoverBorderTopLeftRadius,
    popoverBorderTopRightRadius: node.data.props.popoverBorderTopRightRadius,
    popoverBorderBottomLeftRadius:
      node.data.props.popoverBorderBottomLeftRadius,
    popoverBorderBottomRightRadius:
      node.data.props.popoverBorderBottomRightRadius,
    popoverWidth: node.data.props.popoverWidth,
    popoverWidthUnit: node.data.props.popoverWidthUnit,
    popoverWidthCustom: node.data.props.popoverWidthCustom,
    popoverTitle: node.data.props.popoverTitle,
    popoverFontFamily: node.data.props.popoverFontFamily,
    popoverFontSize: node.data.props.popoverFontSize,
    popoverFontSizeUnit: node.data.props.popoverFontSizeUnit,
    popoverFontSizeCustom: node.data.props.popoverFontSizeCustom,
    popoverLineHeight: node.data.props.popoverLineHeight,
    popoverLineHeightUnit: node.data.props.popoverLineHeightUnit,
    popoverLineHeightCustom: node.data.props.popoverLineHeightCustom,
    popoverLetterSpacing: node.data.props.popoverLetterSpacing,
    popoverLetterSpacingUnit: node.data.props.popoverLetterSpacingUnit,
    popoverLetterSpacingCustom: node.data.props.popoverLetterSpacingCustom,
    productId: node.data.props.productId,
  }));

  const legacy = borderLegacyOf({
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  });
  const spacingLegacy = spacingLegacyOf({
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
  });

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Texto</Label>
            <Input
              value={text}
              onChange={(e) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.text = e.target.value),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Icono</Label>
            <Select
              value={icon}
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.icon = val as any),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="none">Ninguno</SelectItem>
                <SelectItem className="text-[12px]" value="arrowRight">Flecha Derecha</SelectItem>
                <SelectItem className="text-[12px]" value="arrowLeft">Flecha Izquierda</SelectItem>
                <SelectItem className="text-[12px]" value="shoppingCart">Carrito</SelectItem>
                <SelectItem className="text-[12px]" value="mail">Email</SelectItem>
                <SelectItem className="text-[12px]" value="phone">Teléfono</SelectItem>
                <SelectItem className="text-[12px]" value="externalLink">Enlace Externo</SelectItem>
                <SelectItem className="text-[12px]" value="plus">Más (+)</SelectItem>
                <SelectItem className="text-[12px]" value="info">Información</SelectItem>
                <SelectItem className="text-[12px]" value="check">Check</SelectItem>
                <SelectItem className="text-[12px]" value="download">Descarga</SelectItem>
                <SelectItem className="text-[12px]" value="menu">Menú</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {icon !== "none" && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-foreground/80">Posición del ícono</Label>
                <ToggleGroup
                  type="single"
                  value={iconAlign}
                  onValueChange={(val) =>
                    val &&
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconAlign = val as any),
                    )
                  }
                >
                  <ToggleGroupItem value="left" aria-label="Izquierda">
                    <ArrowLeftToLine className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Derecha">
                    <ArrowRightToLine className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">Espaciado del ícono</Label>
                <PropertyUnitInput
                  // Un espaciado o un tamano no admiten "auto" en CSS.
                  exclude={["auto"]}
                  value={iconGap}
                  unit={iconGapUnit ?? "px"}
                  custom={iconGapCustom ?? ""}
                  onUnitChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconGapUnit = val),
                    )
                  }
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconGap = val ?? 4),
                    )
                  }
                  onCustomChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconGapCustom = val),
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">Tamaño del Ícono</Label>
                <PropertyUnitInput
                  // Un espaciado o un tamano no admiten "auto" en CSS.
                  exclude={["auto"]}
                  value={iconSize}
                  unit={iconSizeUnit ?? "px"}
                  custom={iconSizeCustom ?? ""}
                  onUnitChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconSizeUnit = val),
                    )
                  }
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconSize = val ?? 16),
                    )
                  }
                  onCustomChange={(val) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.iconSizeCustom = val),
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      </SettingsSection>

      {/* Cinco de los siete campos salen de la seccion compartida. Los otros
          dos se quedan escritos aqui, dentro de ella:

          - Alto de linea y Espaciado entre letras: el disparador los guarda en
            `lineHeightNum`/`lineHeightUnit` y `letterSpacing`/`letterSpacingUnit`,
            y esas dos unidades se llaman igual que las de la seccion pero son
            de otra forma: una cadena suelta y un valor sin modo de pantalla.
            `legacy` no las rescata porque solo entra cuando esa prop de unidad
            esta vacia, y aqui nunca lo esta —las trae `craft.props`—, asi que
            migrarlas dejaria sin alto de linea ni espaciado a lo ya publicado.
          - Alineacion: el boton se encoge hasta su contenido (`w-fit`) y dentro
            lleva un flex, asi que `text-align` no tendria nada que alinear. */}
      <TypographySection
        legacy={TYPOGRAPHY_LEGACY}
        fields={{ lineHeight: false, letterSpacing: false, textAlign: false }}
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-foreground/80">Alto de línea</Label>
          <div className="flex gap-2">
            <Input
              // El md:text-sm del Input de shadcn gana a partir de 768px: para
              // bajarlo de verdad hay que repetir el tamano en esa media query.
              className="flex-1 h-8 text-[12px] md:text-[12px]"
              value={lineHeightNum ?? ""}
              placeholder="1.5"
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.lineHeightNum = e.target.value),
                )
              }
            />
            <Select
              value={lineHeightUnit || "px"}
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.lineHeightUnit = val),
                )
              }
            >
              <SelectTrigger className="w-20 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="px">px</SelectItem>
                <SelectItem className="text-[12px]" value="rem">rem</SelectItem>
                <SelectItem className="text-[12px]" value="em">em</SelectItem>
                <SelectItem className="text-[12px]" value="%">%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-foreground/80">Espaciado entre letras</Label>
          <PropertyUnitInput
            // Un espaciado o un tamano no admiten "auto" en CSS.
            exclude={["auto"]}
            value={letterSpacing}
            unit={letterSpacingUnit ?? "px"}
            custom={letterSpacingCustom ?? ""}
            onUnitChange={(val) =>
              setProp(
                (props: EditableProductPopoverProps) =>
                  (props.letterSpacingUnit = val),
              )
            }
            onValueChange={(val) =>
              setProp(
                (props: EditableProductPopoverProps) =>
                  (props.letterSpacing = val),
              )
            }
            onCustomChange={(val) =>
              setProp(
                (props: EditableProductPopoverProps) =>
                  (props.letterSpacingCustom = val),
              )
            }
          />
        </div>
      </TypographySection>

      <SettingsSection title="Estilo del botón">
        {/* El color del texto se fue a "Tipografía", con el resto de la letra.
            Aqui queda lo que pinta la caja del boton y no su texto. */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Color de fondo</Label>
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={backgroundColor}
                onChange={(val) =>
                  setProp(
                    (props: EditableProductPopoverProps) =>
                      (props.backgroundColor = val),
                  )
                }
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Producto">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">ID de Producto</Label>
            <Input
              type="number"
              placeholder="70"
              value={productId ?? ""}
              onChange={(e) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.productId = e.target.value
                      ? parseInt(e.target.value) || undefined
                      : undefined),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Título</Label>
            <Input
              value={popoverTitle}
              onChange={(e) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverTitle = e.target.value),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Fuente de Texto</Label>
            <FontFamilySelect
              value={popoverFontFamily ?? "sans"}
              onChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverFontFamily = val),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Tamaño de fuente</Label>
            <PropertyUnitInput
              // Un espaciado o un tamano no admiten "auto" en CSS.
              exclude={["auto"]}
              value={popoverFontSize}
              unit={popoverFontSizeUnit ?? "px"}
              custom={popoverFontSizeCustom ?? ""}
              onUnitChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverFontSizeUnit = val),
                )
              }
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverFontSize = val ?? 16),
                )
              }
              onCustomChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverFontSizeCustom = val),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Alto de línea</Label>
            <PropertyUnitInput
              // Un espaciado o un tamano no admiten "auto" en CSS.
              exclude={["auto"]}
              value={popoverLineHeight}
              unit={popoverLineHeightUnit ?? "custom"}
              custom={popoverLineHeightCustom ?? "auto"}
              onUnitChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLineHeightUnit = val),
                )
              }
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLineHeight = val ?? 0),
                )
              }
              onCustomChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLineHeightCustom = val),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado entre letras</Label>
            <PropertyUnitInput
              // Un espaciado o un tamano no admiten "auto" en CSS.
              exclude={["auto"]}
              value={popoverLetterSpacing}
              unit={popoverLetterSpacingUnit ?? "px"}
              custom={popoverLetterSpacingCustom ?? ""}
              onUnitChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLetterSpacingUnit = val),
                )
              }
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLetterSpacing = val),
                )
              }
              onCustomChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverLetterSpacingCustom = val),
                )
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Posición">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Alineación</Label>
            <Select
              value={popoverAlign}
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverAlign = val as any),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="start">Al inicio</SelectItem>
                <SelectItem className="text-[12px]" value="center">Centrado</SelectItem>
                <SelectItem className="text-[12px]" value="end">Al final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Posición</Label>
            <Select
              value={popoverSide}
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverSide = val as any),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="top">Arriba</SelectItem>
                <SelectItem className="text-[12px]" value="bottom">Abajo</SelectItem>
                <SelectItem className="text-[12px]" value="left">Izquierda</SelectItem>
                <SelectItem className="text-[12px]" value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Separación</Label>
            <PropertyUnitInput
              // Un espaciado o un tamano no admiten "auto" en CSS.
              exclude={["auto"]}
              value={popoverGap}
              unit={popoverGapUnit ?? "px"}
              custom={popoverGapCustom ?? ""}
              onUnitChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverGapUnit = val),
                )
              }
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverGap = val ?? 8),
                )
              }
              onCustomChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverGapCustom = val),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Ancho</Label>
            <PropertyUnitInput
              value={popoverWidth}
              unit={popoverWidthUnit ?? "custom"}
              custom={popoverWidthCustom ?? "auto"}
              onUnitChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverWidthUnit = val),
                )
              }
              onValueChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverWidth = val ?? 0),
                )
              }
              onCustomChange={(val) =>
                setProp(
                  (props: EditableProductPopoverProps) =>
                    (props.popoverWidthCustom = val),
                )
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Borde">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Radio de Borde (px)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-foreground/60">Superior Izq</Label>
                <Input
                  type="number"
                  min={0}
                  value={popoverBorderTopLeftRadius}
                  onChange={(e) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.popoverBorderTopLeftRadius =
                          parseInt(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-foreground/60">Superior Der</Label>
                <Input
                  type="number"
                  min={0}
                  value={popoverBorderTopRightRadius}
                  onChange={(e) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.popoverBorderTopRightRadius =
                          parseInt(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-foreground/60">Inferior Izq</Label>
                <Input
                  type="number"
                  min={0}
                  value={popoverBorderBottomLeftRadius}
                  onChange={(e) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.popoverBorderBottomLeftRadius =
                          parseInt(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-foreground/60">Inferior Der</Label>
                <Input
                  type="number"
                  min={0}
                  value={popoverBorderBottomRightRadius}
                  onChange={(e) =>
                    setProp(
                      (props: EditableProductPopoverProps) =>
                        (props.popoverBorderBottomRightRadius =
                          parseInt(e.target.value) || 0),
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={legacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp(
            (props: EditableProductPopoverProps) => (props.customClass = val),
          )
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp(
            (props: EditableProductPopoverProps) => (props.customCss = val),
          )
        }
      />
    </div>
  );
}

EditableProductPopover.craft = {
  displayName: "Vista rápida",
  props: {
    text: "Ver producto",
    icon: "none",
    iconAlign: "left",
    iconGap: 4,
    iconGapUnit: "px" as const,
    iconGapCustom: "",
    iconSize: 16,
    iconSizeUnit: "px" as const,
    iconSizeCustom: "",
    customClass: "",
    textColor: undefined,
    backgroundColor: undefined,
    fontFamily: "sans" as const,
    sizeDesktop: undefined,
    sizeMobile: undefined,
    lineHeightNum: "",
    lineHeightUnit: "",
    letterSpacing: undefined,
    letterSpacingUnit: "px" as const,
    letterSpacingCustom: "",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
    popoverAlign: "center" as const,
    popoverSide: "top" as const,
    popoverGap: 8,
    popoverGapUnit: "px" as const,
    popoverGapCustom: "",
    popoverBorderTopLeftRadius: 0,
    popoverBorderTopRightRadius: 0,
    popoverBorderBottomLeftRadius: 0,
    popoverBorderBottomRightRadius: 0,
    popoverWidth: 0,
    popoverWidthUnit: "custom" as const,
    popoverWidthCustom: "auto",
    popoverTitle: "Título",
    popoverFontFamily: "sans" as const,
    popoverFontSize: 16,
    popoverFontSizeUnit: "px" as const,
    popoverFontSizeCustom: "",
    popoverLineHeight: 0,
    popoverLineHeightUnit: "custom" as const,
    popoverLineHeightCustom: "auto",
    popoverLetterSpacing: undefined,
    popoverLetterSpacingUnit: "px" as const,
    popoverLetterSpacingCustom: "",
    productId: undefined,
  },
  related: {
    settings: EditableProductPopoverSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
