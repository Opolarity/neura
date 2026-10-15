import { useId } from "react";
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
import { cn } from "@/shared/utils/utils";
import { ColorField } from "@/modules/ecommerce/editor/components/color-field";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { LinkSection, type PopupLinkAction } from "@/modules/ecommerce/editor/components/link-section";
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import { BorderSection, type BorderLegacy } from "@/modules/ecommerce/editor/components/border-section";
import { SpacingSection, limitRulesByViewport, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section";
import {
  TypographySection,
  typographyRulesOf,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import { PropertyUnitInput, resolveUnitValue } from "@/modules/ecommerce/editor/components/user-components/property-unit-input";
import { type PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select";
import { type FontFamily } from "@/modules/ecommerce/editor/lib/font-families";
import {
  BOX_SIDE_KEYS,
  RADIUS_CORNER_KEYS,
  borderRulesOf,
  boxRule,
  radiusRulesOf,
  resolveMeasureCascade,
  resolveSidesCascade,
  sidesRulesOf,
  type BorderStyle,
  type MeasureSpec,
} from "@/modules/ecommerce/editor/components/box-measures";

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

import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useViewport } from "@/modules/ecommerce/editor/components/viewport-context"

// AQUI
interface EditableButtonProps {
  text?: string;
  href?: string;
  linkType?: "url" | "button" | "popup";
  popupSlug?: string;
  popupAction?: PopupLinkAction;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  icon?: IconName;
  iconAlign?: "left" | "right";
  iconGap?: number;
  iconGapUnit?: PropertyUnit;
  iconGapCustom?: string;
  iconSize?: number;
  iconSizeUnit?: PropertyUnit;
  iconSizeCustom?: string;
  widthDesktop?: number;
  widthTablet?: number;
  widthMobile?: number;
  /**
   * Una unidad por modo de pantalla, y no una compartida como en el tamano de
   * letra: aqui "auto" es en si mismo el valor de un modo —ancho automatico en
   * escritorio y 100% en el celular es el reparto de siempre—, y con una sola
   * unidad no habria manera de decirlo.
   *
   * Sin valor por defecto a proposito: que falten es la senal de que el boton
   * es anterior a las unidades, y de ahi vive el resto de la migracion.
   */
  widthUnitDesktop?: PropertyUnit;
  widthUnitTablet?: PropertyUnit;
  widthUnitMobile?: PropertyUnit;
  widthCustomDesktop?: string;
  widthCustomTablet?: string;
  widthCustomMobile?: string;
  customClass?: string;
  /** CSS escrito a mano para este boton. Ver AdvancedSection. */
  customCss?: string;
  openInNewTab?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: FontFamily;
  fontWeight?: number;
  sizeUnit?: PropertyUnit;
  sizeCustom?: string;
  sizeDesktop?: number;
  sizeTablet?: number;
  sizeMobile?: number;
  /**
   * @deprecated Valor unico del formato viejo; hoy hay uno por dispositivo. Se
   * sigue leyendo para que un boton ya publicado conserve el alto de linea que
   * guardo entonces: ver `typographyLegacyOf`.
   */
  lineHeightNum?: string;
  /**
   * La cadena vacia es del formato viejo, donde era el valor por defecto: el
   * numero de al lado no llevaba unidad y se aplicaba como factor.
   */
  lineHeightUnit?: PropertyUnit | "";
  lineHeightCustom?: string;
  lineHeightDesktop?: number;
  lineHeightTablet?: number;
  lineHeightMobile?: number;
  letterSpacingUnit?: PropertyUnit;
  letterSpacingCustom?: string;
  letterSpacingDesktop?: number;
  letterSpacingTablet?: number;
  letterSpacingMobile?: number;
  /**
   * @deprecated Grosor de borde del formato de un solo valor para todos los
   * tamanos. Hoy hay un juego por modo; estos solo se leen mientras el boton no
   * tenga ninguna unidad por modo guardada.
   */
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderWidthUnit?: PropertyUnit;
  borderWidthCustom?: string;
  borderTopWidthDesktop?: number;
  borderRightWidthDesktop?: number;
  borderBottomWidthDesktop?: number;
  borderLeftWidthDesktop?: number;
  borderTopWidthTablet?: number;
  borderRightWidthTablet?: number;
  borderBottomWidthTablet?: number;
  borderLeftWidthTablet?: number;
  borderTopWidthMobile?: number;
  borderRightWidthMobile?: number;
  borderBottomWidthMobile?: number;
  borderLeftWidthMobile?: number;
  /**
   * Una unidad por modo. No admite porcentaje: `border-width` en % no existe en
   * CSS, el navegador lo descarta y el borde desaparece.
   */
  borderWidthUnitDesktop?: PropertyUnit;
  borderWidthUnitTablet?: PropertyUnit;
  borderWidthUnitMobile?: PropertyUnit;
  borderWidthCustomDesktop?: string;
  borderWidthCustomTablet?: string;
  borderWidthCustomMobile?: string;
  borderColor?: string;
  /** El trazo del borde. Sin grosor no se pinta ninguno. */
  borderStyle?: BorderStyle;
  /**
   * @deprecated Radio del formato de un solo valor para todos los tamanos. Hoy
   * hay un juego por modo; estos solo se leen mientras el boton no tenga ninguna
   * unidad por modo guardada.
   */
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderRadiusUnit?: PropertyUnit;
  borderRadiusCustom?: string;
  borderTopLeftRadiusDesktop?: number;
  borderTopRightRadiusDesktop?: number;
  borderBottomLeftRadiusDesktop?: number;
  borderBottomRightRadiusDesktop?: number;
  borderTopLeftRadiusTablet?: number;
  borderTopRightRadiusTablet?: number;
  borderBottomLeftRadiusTablet?: number;
  borderBottomRightRadiusTablet?: number;
  borderTopLeftRadiusMobile?: number;
  borderTopRightRadiusMobile?: number;
  borderBottomLeftRadiusMobile?: number;
  borderBottomRightRadiusMobile?: number;
  /**
   * Una unidad por modo. Aqui el porcentaje si vale y ademas sirve: al 50% el
   * boton sale redondo.
   */
  borderRadiusUnitDesktop?: PropertyUnit;
  borderRadiusUnitTablet?: PropertyUnit;
  borderRadiusUnitMobile?: PropertyUnit;
  borderRadiusCustomDesktop?: string;
  borderRadiusCustomTablet?: string;
  borderRadiusCustomMobile?: string;
  /**
   * @deprecated Alto unico del formato viejo, guardado como texto: "40px".
   * Hoy hay uno por modo de pantalla; este solo se lee mientras el boton no
   * tenga ninguna unidad guardada.
   */
  height?: string;
  heightDesktop?: number;
  heightTablet?: number;
  heightMobile?: number;
  heightUnitDesktop?: PropertyUnit;
  heightUnitTablet?: PropertyUnit;
  heightUnitMobile?: PropertyUnit;
  heightCustomDesktop?: string;
  heightCustomTablet?: string;
  heightCustomMobile?: string;
  /**
   * @deprecated Relleno del formato viejo: cuatro lados y una unidad, iguales
   * para todos los tamanos de pantalla. Hoy hay un juego por modo; estos solo
   * se leen mientras el boton no tenga ninguna unidad por modo guardada.
   */
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingUnit?: PropertyUnit;
  paddingCustom?: string;
  paddingTopDesktop?: number;
  paddingRightDesktop?: number;
  paddingBottomDesktop?: number;
  paddingLeftDesktop?: number;
  paddingTopTablet?: number;
  paddingRightTablet?: number;
  paddingBottomTablet?: number;
  paddingLeftTablet?: number;
  paddingTopMobile?: number;
  paddingRightMobile?: number;
  paddingBottomMobile?: number;
  paddingLeftMobile?: number;
  /**
   * Una unidad por modo de pantalla, como en el ancho y el alto, y una sola
   * para los cuatro lados de ese modo: mezclarlas dentro de un mismo modo —px
   * arriba y % a los lados— no resuelve ningun caso real y multiplicaria por
   * cuatro los desplegables de un panel que ya va justo de ancho.
   */
  paddingUnitDesktop?: PropertyUnit;
  paddingUnitTablet?: PropertyUnit;
  paddingUnitMobile?: PropertyUnit;
  paddingCustomDesktop?: string;
  paddingCustomTablet?: string;
  paddingCustomMobile?: string;
  /**
   * @deprecated Margen del formato de un solo valor para todos los tamanos.
   * Hoy hay un juego por modo; estos solo se leen mientras el boton no tenga
   * ninguna unidad por modo guardada.
   */
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginUnit?: PropertyUnit;
  marginCustom?: string;
  marginTopDesktop?: number;
  marginRightDesktop?: number;
  marginBottomDesktop?: number;
  marginLeftDesktop?: number;
  marginTopTablet?: number;
  marginRightTablet?: number;
  marginBottomTablet?: number;
  marginLeftTablet?: number;
  marginTopMobile?: number;
  marginRightMobile?: number;
  marginBottomMobile?: number;
  marginLeftMobile?: number;
  marginUnitDesktop?: PropertyUnit;
  marginUnitTablet?: PropertyUnit;
  marginUnitMobile?: PropertyUnit;
  marginCustomDesktop?: string;
  marginCustomTablet?: string;
  marginCustomMobile?: string;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
}

/**
 * Lo que el boton aplicaba antes de que su letra se llamara como la nombra la
 * seccion compartida. De los siete campos solo el alto de linea cambio de
 * formato: se guardaba como un valor unico en texto (`lineHeightNum`), su
 * unidad podia quedar vacia y admitia "auto", que la seccion ya no ofrece.
 *
 * Devuelve tambien la unidad con la que se le habla a la seccion: sin valor
 * cuando manda el formato anterior, porque esa ausencia es la senal con la que
 * la cascada mira `legacy` en lugar de lo guardado.
 *
 * Vive fuera de los dos componentes porque el panel y el render la necesitan
 * igual y cada uno lee las props por su cuenta.
 */
function typographyLegacyOf({
  lineHeightNum,
  lineHeightUnit,
}: {
  lineHeightNum?: string;
  lineHeightUnit?: PropertyUnit | "";
}): { legacy: TypographyLegacy; lineHeightUnit: PropertyUnit | undefined } {
  // La unidad era una sola para los tres modos, asi que lo anterior valia para
  // los tres: se repite en los tres para que ninguno se cuele con lo guardado.
  const enLosTres = (spec: MeasureSpec): TypographyLegacy => ({
    lineHeight: { desktop: spec, tablet: spec, mobile: spec },
  });

  // "auto" no existe en line-height: lo suyo se llama "normal".
  if (lineHeightUnit === "auto")
    return {
      legacy: enLosTres({ value: undefined, unit: "custom", custom: "normal" }),
      lineHeightUnit: undefined,
    };

  if (lineHeightUnit) return { legacy: {}, lineHeightUnit };

  // Sin unidad guardada el numero era el factor tal cual —"line-height: 1.5"—,
  // y eso solo lo reproduce el texto libre: em se le parece, pero se resuelve
  // contra la letra del propio elemento en vez de heredarse.
  if (lineHeightNum)
    return {
      legacy: enLosTres({ value: undefined, unit: "custom", custom: lineHeightNum }),
      lineHeightUnit: undefined,
    };

  // Sin unidad y sin numero se leia en em, que era el respaldo de entonces.
  return { legacy: {}, lineHeightUnit: "em" };
}

export function EditableButton({
  text = "Botón",
  href = "#",
  linkType = "url",
  popupSlug = "",
  popupAction = "open",
  variant = "default",
  size = "default",
  icon = "none",
  iconAlign = "left",
  iconGap = 4,
  iconGapUnit = "px",
  iconGapCustom = "",
  iconSize = 16,
  iconSizeUnit = "px",
  iconSizeCustom = "",
  widthDesktop,
  widthTablet,
  // El 100 de siempre ya no se pone aqui: solo les toca a los botones
  // anteriores, y de eso se encarga `legacyWidth` mas abajo. Dejarlo de valor
  // por defecto se lo daria tambien a los nuevos, que deben nacer en automatico.
  widthMobile,
  widthUnitDesktop,
  widthUnitTablet,
  widthUnitMobile,
  widthCustomDesktop = "",
  widthCustomTablet = "",
  widthCustomMobile = "",
  customClass = "",
  customCss,
  textColor,
  backgroundColor,
  fontFamily = "sans",
  // Sin grosor ni espaciado por defecto a proposito: los botones ya publicados
  // no traen estas props y sin valor la seccion no emite regla, asi que siguen
  // con el `font-medium` de su variante y sin tocar el espaciado.
  fontWeight,
  // px es lo que asumia el tamano de fuente cuando era un numero suelto: los
  // botones ya publicados no traen unidad y con este valor se ven igual.
  sizeUnit = "px",
  sizeCustom = "",
  sizeDesktop,
  sizeTablet,
  sizeMobile,
  lineHeightNum,
  lineHeightUnit,
  lineHeightCustom = "",
  lineHeightDesktop,
  lineHeightTablet,
  lineHeightMobile,
  letterSpacingUnit,
  letterSpacingCustom = "",
  letterSpacingDesktop,
  letterSpacingTablet,
  letterSpacingMobile,
  borderLeftWidth = 0,
  borderRightWidth = 0,
  borderTopWidth = 0,
  borderBottomWidth = 0,
  borderWidthUnit,
  borderWidthCustom = "",
  borderTopWidthDesktop,
  borderRightWidthDesktop,
  borderBottomWidthDesktop,
  borderLeftWidthDesktop,
  borderTopWidthTablet,
  borderRightWidthTablet,
  borderBottomWidthTablet,
  borderLeftWidthTablet,
  borderTopWidthMobile,
  borderRightWidthMobile,
  borderBottomWidthMobile,
  borderLeftWidthMobile,
  borderWidthUnitDesktop,
  borderWidthUnitTablet,
  borderWidthUnitMobile,
  borderWidthCustomDesktop = "",
  borderWidthCustomTablet = "",
  borderWidthCustomMobile = "",
  borderColor = "transparent",
  borderStyle = "solid",
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  borderRadiusUnit,
  borderRadiusCustom = "",
  borderTopLeftRadiusDesktop,
  borderTopRightRadiusDesktop,
  borderBottomLeftRadiusDesktop,
  borderBottomRightRadiusDesktop,
  borderTopLeftRadiusTablet,
  borderTopRightRadiusTablet,
  borderBottomLeftRadiusTablet,
  borderBottomRightRadiusTablet,
  borderTopLeftRadiusMobile,
  borderTopRightRadiusMobile,
  borderBottomLeftRadiusMobile,
  borderBottomRightRadiusMobile,
  borderRadiusUnitDesktop,
  borderRadiusUnitTablet,
  borderRadiusUnitMobile,
  borderRadiusCustomDesktop = "",
  borderRadiusCustomTablet = "",
  borderRadiusCustomMobile = "",
  height = "",
  heightDesktop,
  heightTablet,
  heightMobile,
  heightUnitDesktop,
  heightUnitTablet,
  heightUnitMobile,
  heightCustomDesktop = "",
  heightCustomTablet = "",
  heightCustomMobile = "",
  // Sin valor por defecto a proposito: los botones ya publicados no traen
  // estas props y su relleno lo pone la variante de shadcn. Fijar un numero
  // aqui se lo pisaria y les cambiaria el tamano.
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  paddingUnit,
  paddingCustom = "",
  paddingTopDesktop,
  paddingRightDesktop,
  paddingBottomDesktop,
  paddingLeftDesktop,
  paddingTopTablet,
  paddingRightTablet,
  paddingBottomTablet,
  paddingLeftTablet,
  paddingTopMobile,
  paddingRightMobile,
  paddingBottomMobile,
  paddingLeftMobile,
  paddingUnitDesktop,
  paddingUnitTablet,
  paddingUnitMobile,
  paddingCustomDesktop = "",
  paddingCustomTablet = "",
  paddingCustomMobile = "",
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  marginUnit,
  marginCustom = "",
  marginTopDesktop,
  marginRightDesktop,
  marginBottomDesktop,
  marginLeftDesktop,
  marginTopTablet,
  marginRightTablet,
  marginBottomTablet,
  marginLeftTablet,
  marginTopMobile,
  marginRightMobile,
  marginBottomMobile,
  marginLeftMobile,
  marginUnitDesktop,
  marginUnitTablet,
  marginUnitMobile,
  marginCustomDesktop = "",
  marginCustomTablet = "",
  marginCustomMobile = "",
  openInNewTab = false,
  hiddenOnDesktop = false,
  hiddenOnTablet = false,
  hiddenOnMobile = false,
}: EditableButtonProps) {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile });
  const viewport = useViewport();

  const isEditorMode = viewport !== null;

  // El ancho y el alto los arma el boton por su cuenta (ver mas abajo); los
  // minimos y maximos son los de la seccion compartida, tal cual.
  const { limits } = useNode((node) => ({
    limits: limitRulesByViewport(node.data.props as Record<string, unknown>),
  }));

  // La letra entera —familia, grosor, tamano, alto de linea, espaciado y
  // color— la resuelve la seccion compartida: devuelve las reglas ya hechas por
  // modo de pantalla y se interpolan en el <style> de abajo, junto a las del
  // ancho, el alto y el relleno. La cascada de cada medida es la suya.
  const { legacy: typographyLegacy, lineHeightUnit: lineHeightUnitValue } =
    typographyLegacyOf({ lineHeightNum, lineHeightUnit });

  const typographyBag = {
    fontFamily,
    fontWeight,
    textColor,
    sizeDesktop,
    sizeTablet,
    sizeMobile,
    sizeUnit,
    sizeCustom,
    lineHeightDesktop,
    lineHeightTablet,
    lineHeightMobile,
    lineHeightUnit: lineHeightUnitValue,
    lineHeightCustom,
    letterSpacingDesktop,
    letterSpacingTablet,
    letterSpacingMobile,
    letterSpacingUnit,
    letterSpacingCustom,
  };

  const letra = typographyRulesOf(typographyBag, typographyLegacy);

  const activeTypographyRules = viewport ? letra[viewport] : "";

  // El ancho cae en cascada de la pantalla grande a la pequena, como el alto:
  // cada modo usa el suyo y, si no lo tiene, el del modo inmediatamente mayor.
  //
  // Un boton anterior a las unidades no guarda ninguna, y ese hueco es el guard
  // de la migracion: mientras las tres falten se le lee el ancho en %, que es lo
  // unico que existia, y el celular recupera el 100 que entonces era el valor
  // por defecto —los mas viejos ni siquiera lo tienen guardado, porque nacieron
  // cuando ese 100 vivia solo en la firma—. Asi estrenar el desplegable no le
  // cambia el aspecto a ningun boton ya publicado.
  const legacyWidth =
    widthUnitDesktop === undefined &&
    widthUnitTablet === undefined &&
    widthUnitMobile === undefined;
  const widthUnitDesktopValue = widthUnitDesktop ?? "%";
  const widthUnitTabletValue = widthUnitTablet ?? "%";
  const widthUnitMobileValue = widthUnitMobile ?? "%";
  const widthMobileValue = widthMobile ?? (legacyWidth ? 100 : undefined);

  // El 100% del celular de un boton anterior es suyo, asi que no hereda: el
  // escritorio y la tableta siguen sin ancho, como hasta ahora.
  const widthByViewport = resolveMeasureCascade(
    {
      value: widthDesktop,
      unit: widthUnitDesktopValue,
      custom: widthCustomDesktop,
    },
    {
      value: widthTablet,
      unit: widthUnitTabletValue,
      custom: widthCustomTablet,
    },
    {
      value: widthMobileValue,
      unit: widthUnitMobileValue,
      custom: widthCustomMobile,
    },
  );

  const widthRuleFor = (spec: MeasureSpec) =>
    boxRule("width", spec.value, spec.unit, spec.custom);

  const activeWidthRule =
    viewport === "mobile"
      ? widthRuleFor(widthByViewport.mobile)
      : viewport === "tablet"
        ? widthRuleFor(widthByViewport.tablet)
        : viewport === "desktop"
          ? widthRuleFor(widthByViewport.desktop)
          : "";

  // El alto era un valor unico guardado como texto —"40px"— que valia para los
  // tres modos a la vez. Mientras no haya unidad guardada se sigue leyendo asi:
  // en px, que es la unidad que ese texto ya llevaba dentro, y repetido en los
  // tres modos. Es el mismo guard del ancho, cambiando % por px.
  const legacyHeight =
    heightUnitDesktop === undefined &&
    heightUnitTablet === undefined &&
    heightUnitMobile === undefined;
  const legacyHeightValue = height ? parseInt(height) || undefined : undefined;
  const heightUnitDesktopValue = heightUnitDesktop ?? "px";
  const heightUnitTabletValue = heightUnitTablet ?? "px";
  const heightUnitMobileValue = heightUnitMobile ?? "px";
  const legacyFor = (value: number | undefined) =>
    value ?? (legacyHeight ? legacyHeightValue : undefined);

  // El alto cae en cascada de la pantalla grande a la pequena, como el tamano
  // de letra: basta con definir el de escritorio para que valga en los tres, y
  // solo se rellenan los modos que deban diferenciarse. El ancho no lo hace a
  // proposito —un 100% del celular no tiene por que estirarse en escritorio—,
  // pero un alto fijo si suele querer valer para todos.
  //
  // Con el formato viejo los tres modos traen ya el mismo alto, asi que la
  // cascada no les cambia nada.
  const heightByViewport = resolveMeasureCascade(
    {
      value: legacyFor(heightDesktop),
      unit: heightUnitDesktopValue,
      custom: heightCustomDesktop,
    },
    {
      value: legacyFor(heightTablet),
      unit: heightUnitTabletValue,
      custom: heightCustomTablet,
    },
    {
      value: legacyFor(heightMobile),
      unit: heightUnitMobileValue,
      custom: heightCustomMobile,
    },
  );

  const heightRuleFor = (spec: MeasureSpec) =>
    boxRule("height", spec.value, spec.unit, spec.custom);

  const activeHeightRule =
    viewport === "mobile"
      ? heightRuleFor(heightByViewport.mobile)
      : viewport === "tablet"
        ? heightRuleFor(heightByViewport.tablet)
        : viewport === "desktop"
          ? heightRuleFor(heightByViewport.desktop)
          : "";

  const id = useId();
  const buttonClass = `editable-btn-${id.replace(/:/g, "")}`;

  // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la de
  // las medidas, para que el usuario pueda pisarlas si quiere.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const SelectedIcon = IconMap[icon] || null;

  // El grosor de borde, por modo y en cascada lado a lado, como el relleno. Un
  // lado vacio hereda; para quitar el borde en un modo se escribe un 0, que es
  // un valor suyo y corta la herencia.
  const legacyBorderWidth =
    borderWidthUnitDesktop === undefined &&
    borderWidthUnitTablet === undefined &&
    borderWidthUnitMobile === undefined;

  const legacyBorderUnit: PropertyUnit = borderWidthUnit ?? "px";
  const borderByViewport = resolveSidesCascade(
    BOX_SIDE_KEYS,
    legacyBorderWidth
      ? {
          sides: {
            Top: borderTopWidth,
            Right: borderRightWidth,
            Bottom: borderBottomWidth,
            Left: borderLeftWidth,
          },
          unit: legacyBorderUnit,
          custom: borderWidthCustom,
        }
      : {
          sides: {
            Top: borderTopWidthDesktop,
            Right: borderRightWidthDesktop,
            Bottom: borderBottomWidthDesktop,
            Left: borderLeftWidthDesktop,
          },
          unit: borderWidthUnitDesktop ?? "px",
          custom: borderWidthCustomDesktop,
        },
    {
      sides: {
        Top: borderTopWidthTablet,
        Right: borderRightWidthTablet,
        Bottom: borderBottomWidthTablet,
        Left: borderLeftWidthTablet,
      },
      unit: borderWidthUnitTablet ?? "px",
      custom: borderWidthCustomTablet,
    },
    {
      sides: {
        Top: borderTopWidthMobile,
        Right: borderRightWidthMobile,
        Bottom: borderBottomWidthMobile,
        Left: borderLeftWidthMobile,
      },
      unit: borderWidthUnitMobile ?? "px",
      custom: borderWidthCustomMobile,
    },
  );

  const desktopBorderRules = borderRulesOf(borderByViewport.desktop, borderStyle);
  const tabletBorderRules = borderRulesOf(borderByViewport.tablet, borderStyle);
  const mobileBorderRules = borderRulesOf(borderByViewport.mobile, borderStyle);

  const activeBorderRules =
    viewport === "mobile"
      ? mobileBorderRules
      : viewport === "tablet"
        ? tabletBorderRules
        : viewport === "desktop"
          ? desktopBorderRules
          : "";

  // El relleno tiene un valor por lado y por modo de pantalla, y cae en cascada
  // lado a lado: cada modo pisa del que hereda solo los lados que trae.
  //
  // Un boton anterior guarda los cuatro lados sueltos y una unidad para todos
  // los tamanos. Ese hueco es el guard: mientras no haya unidad por modo se le
  // leen aquellas props en el escritorio, y los otros dos modos las heredan.
  const legacyPadding =
    paddingUnitDesktop === undefined &&
    paddingUnitTablet === undefined &&
    paddingUnitMobile === undefined;

  const legacyPaddingUnit: PropertyUnit = paddingUnit ?? "px";
  // Con el formato viejo el relleno vive en el escritorio y los otros dos modos
  // lo heredan, que es lo que hacia cuando no habia modos.
  const paddingByViewport = resolveSidesCascade(
    BOX_SIDE_KEYS,
    legacyPadding
      ? {
          sides: {
            Top: paddingTop,
            Right: paddingRight,
            Bottom: paddingBottom,
            Left: paddingLeft,
          },
          unit: legacyPaddingUnit,
          custom: paddingCustom,
        }
      : {
          sides: {
            Top: paddingTopDesktop,
            Right: paddingRightDesktop,
            Bottom: paddingBottomDesktop,
            Left: paddingLeftDesktop,
          },
          unit: paddingUnitDesktop ?? "px",
          custom: paddingCustomDesktop,
        },
    {
      sides: {
        Top: paddingTopTablet,
        Right: paddingRightTablet,
        Bottom: paddingBottomTablet,
        Left: paddingLeftTablet,
      },
      unit: paddingUnitTablet ?? "px",
      custom: paddingCustomTablet,
    },
    {
      sides: {
        Top: paddingTopMobile,
        Right: paddingRightMobile,
        Bottom: paddingBottomMobile,
        Left: paddingLeftMobile,
      },
      unit: paddingUnitMobile ?? "px",
      custom: paddingCustomMobile,
    },
  );

  const desktopPaddingRules = sidesRulesOf("padding", paddingByViewport.desktop);
  const tabletPaddingRules = sidesRulesOf("padding", paddingByViewport.tablet);
  const mobilePaddingRules = sidesRulesOf("padding", paddingByViewport.mobile);

  const activePaddingRules =
    viewport === "mobile"
      ? mobilePaddingRules
      : viewport === "tablet"
        ? tabletPaddingRules
        : viewport === "desktop"
          ? desktopPaddingRules
          : "";

  // El radio, por modo. Las esquinas sin valor no se emiten: es lo que deja al
  // boton conservar el redondeo de su variante.
  const legacyRadius =
    borderRadiusUnitDesktop === undefined &&
    borderRadiusUnitTablet === undefined &&
    borderRadiusUnitMobile === undefined;

  const legacyRadiusUnit: PropertyUnit = borderRadiusUnit ?? "px";
  // Con el formato viejo el radio vive en el escritorio y los otros dos modos
  // lo heredan, que es lo que hacia cuando no habia modos.
  const radiusByViewport = resolveSidesCascade(
    RADIUS_CORNER_KEYS,
    legacyRadius
      ? {
          sides: {
            TopLeft: borderTopLeftRadius,
            TopRight: borderTopRightRadius,
            BottomLeft: borderBottomLeftRadius,
            BottomRight: borderBottomRightRadius,
          },
          unit: legacyRadiusUnit,
          custom: borderRadiusCustom,
        }
      : {
          sides: {
            TopLeft: borderTopLeftRadiusDesktop,
            TopRight: borderTopRightRadiusDesktop,
            BottomLeft: borderBottomLeftRadiusDesktop,
            BottomRight: borderBottomRightRadiusDesktop,
          },
          unit: borderRadiusUnitDesktop ?? "px",
          custom: borderRadiusCustomDesktop,
        },
    {
      sides: {
        TopLeft: borderTopLeftRadiusTablet,
        TopRight: borderTopRightRadiusTablet,
        BottomLeft: borderBottomLeftRadiusTablet,
        BottomRight: borderBottomRightRadiusTablet,
      },
      unit: borderRadiusUnitTablet ?? "px",
      custom: borderRadiusCustomTablet,
    },
    {
      sides: {
        TopLeft: borderTopLeftRadiusMobile,
        TopRight: borderTopRightRadiusMobile,
        BottomLeft: borderBottomLeftRadiusMobile,
        BottomRight: borderBottomRightRadiusMobile,
      },
      unit: borderRadiusUnitMobile ?? "px",
      custom: borderRadiusCustomMobile,
    },
  );

  const desktopRadiusRules = radiusRulesOf(radiusByViewport.desktop);
  const tabletRadiusRules = radiusRulesOf(radiusByViewport.tablet);
  const mobileRadiusRules = radiusRulesOf(radiusByViewport.mobile);

  const activeRadiusRules =
    viewport === "mobile"
      ? mobileRadiusRules
      : viewport === "tablet"
        ? tabletRadiusRules
        : viewport === "desktop"
          ? desktopRadiusRules
          : "";

  // El margen, como el relleno pero aplicado al contenedor y no al boton: la
  // marca de seleccion del editor se dibuja pegada a los bordes de ese
  // contenedor, y con el margen por dentro rodearia tambien el hueco. Por eso
  // sus reglas salen con otro selector en el bloque <style>.
  const legacyMargin =
    marginUnitDesktop === undefined &&
    marginUnitTablet === undefined &&
    marginUnitMobile === undefined;

  const legacyMarginUnit: PropertyUnit = marginUnit ?? "px";
  // Con el formato viejo el margen vive en el escritorio y los otros dos modos
  // lo heredan, que es lo que hacia cuando no habia modos.
  const marginByViewport = resolveSidesCascade(
    BOX_SIDE_KEYS,
    legacyMargin
      ? {
          sides: {
            Top: marginTop,
            Right: marginRight,
            Bottom: marginBottom,
            Left: marginLeft,
          },
          unit: legacyMarginUnit,
          custom: marginCustom,
        }
      : {
          sides: {
            Top: marginTopDesktop,
            Right: marginRightDesktop,
            Bottom: marginBottomDesktop,
            Left: marginLeftDesktop,
          },
          unit: marginUnitDesktop ?? "px",
          custom: marginCustomDesktop,
        },
    {
      sides: {
        Top: marginTopTablet,
        Right: marginRightTablet,
        Bottom: marginBottomTablet,
        Left: marginLeftTablet,
      },
      unit: marginUnitTablet ?? "px",
      custom: marginCustomTablet,
    },
    {
      sides: {
        Top: marginTopMobile,
        Right: marginRightMobile,
        Bottom: marginBottomMobile,
        Left: marginLeftMobile,
      },
      unit: marginUnitMobile ?? "px",
      custom: marginCustomMobile,
    },
  );

  const desktopMarginRules = sidesRulesOf("margin", marginByViewport.desktop);
  const tabletMarginRules = sidesRulesOf("margin", marginByViewport.tablet);
  const mobileMarginRules = sidesRulesOf("margin", marginByViewport.mobile);

  const activeMarginRules =
    viewport === "mobile"
      ? mobileMarginRules
      : viewport === "tablet"
        ? tabletMarginRules
        : viewport === "desktop"
          ? desktopMarginRules
          : "";

  // Aqui solo quedan las propiedades que valen igual en los tres modos de
  // pantalla y que no toca la seccion de tipografia. El ancho, el alto, el
  // relleno, el grosor de borde y el radio tienen un valor por modo, y eso un
  // estilo en linea no lo puede expresar; la letra —familia, color incluido—
  // sale del mismo bloque <style> para no escribirla en dos sitios.
  const buttonStyle = {
    backgroundColor,
    borderColor,
  } as const;

  const iconGapValue = resolveUnitValue(iconGap, iconGapUnit, iconGapCustom);
  const iconSizeValue = resolveUnitValue(iconSize, iconSizeUnit, iconSizeCustom);
  const iconStyle = {
    width: iconSizeValue,
    height: iconSizeValue,
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
    <SelectableNode
      // El boton responde al clic por si mismo: el cursor de mano lo avisa
      // mientras se edita, aunque ahi el clic solo sirva para seleccionarlo.
      clickable
      className={cn(
        "h-fit w-fit group",
        buttonClass,
        customCssClass,
        customClass,
        visClass,
      )}
    >
      <style>{isEditorMode ? `
                .${buttonClass} {
                    ${activeMarginRules}
                }
                .${buttonClass} .btn-inner {
                    ${activeWidthRule}
                    ${activeHeightRule}
                    ${viewport ? limits[viewport] : ""}
                    ${activePaddingRules}
                    ${activeBorderRules}
                    ${activeRadiusRules}
                    ${activeTypographyRules}
                }
            ` : `
                @media (max-width: 767px) {
                    .${buttonClass} {
                        ${mobileMarginRules}
                    }
                    .${buttonClass} .btn-inner {
                        ${widthRuleFor(widthByViewport.mobile)}
                        ${heightRuleFor(heightByViewport.mobile)}
                        ${limits.mobile}
                        ${mobilePaddingRules}
                        ${mobileBorderRules}
                        ${mobileRadiusRules}
                        ${letra.mobile}
                    }
                }
                @media (min-width: 768px) and (max-width: 1023px) {
                    .${buttonClass} {
                        ${tabletMarginRules}
                    }
                    .${buttonClass} .btn-inner {
                        ${widthRuleFor(widthByViewport.tablet)}
                        ${heightRuleFor(heightByViewport.tablet)}
                        ${limits.tablet}
                        ${tabletPaddingRules}
                        ${tabletBorderRules}
                        ${tabletRadiusRules}
                        ${letra.tablet}
                    }
                }
                @media (min-width: 1024px) {
                    .${buttonClass} {
                        ${desktopMarginRules}
                    }
                    .${buttonClass} .btn-inner {
                        ${widthRuleFor(widthByViewport.desktop)}
                        ${heightRuleFor(heightByViewport.desktop)}
                        ${limits.desktop}
                        ${desktopPaddingRules}
                        ${desktopBorderRules}
                        ${desktopRadiusRules}
                        ${letra.desktop}
                    }
                }
            `}</style>
      {linkType === "button" || linkType === "popup" ? (
        <Button
          variant={variant}
          size={size}
          className="btn-inner flex items-center"
          style={buttonStyle}
          // La accion la ejecuta ModalProvider. En el editor no se pone: un clic
          // en el canvas es para seleccionar el boton, no para abrir el popup.
          {...(linkType === "popup" && !enabled
            ? { "data-popup-action": popupAction, "data-popup-slug": popupSlug }
            : {})}
          onClick={(e) => {
            if (enabled) {
              e.preventDefault();
            }
          }}
        >
          {buttonContent}
        </Button>
      ) : (
        <Button asChild variant={variant} size={size} className="btn-inner" style={buttonStyle}>
          <a
            href={href}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noreferrer noopener" : undefined}
            onClick={(e) => {
              if (enabled) {
                e.preventDefault();
              }
            }}
            className="flex items-center"
          >
            {buttonContent}
          </a>
        </Button>
      )}
    </SelectableNode>
    </>
  );
}

function EditableButtonSettings() {
  const viewport = useViewport();
  const {
    actions: { setProp },
    text,
    variant,
    size,
    icon,
    iconAlign,
    iconGap,
    iconGapUnit,
    iconGapCustom,
    iconSize,
    iconSizeUnit,
    iconSizeCustom,
    widthDesktop,
    widthTablet,
    widthMobile,
    widthUnitDesktop,
    widthUnitTablet,
    widthUnitMobile,
    widthCustomDesktop,
    widthCustomTablet,
    widthCustomMobile,
    customClass,
    customCss,
    backgroundColor,
    // La letra la lee y la escribe TypographySection por su cuenta; de aqui
    // solo sale lo que hace falta para armar su `legacy`.
    lineHeightNum,
    lineHeightUnit,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
    borderWidthUnit,
    borderWidthCustom,
    borderTopWidthDesktop,
    borderRightWidthDesktop,
    borderBottomWidthDesktop,
    borderLeftWidthDesktop,
    borderTopWidthTablet,
    borderRightWidthTablet,
    borderBottomWidthTablet,
    borderLeftWidthTablet,
    borderTopWidthMobile,
    borderRightWidthMobile,
    borderBottomWidthMobile,
    borderLeftWidthMobile,
    borderWidthUnitDesktop,
    borderWidthUnitTablet,
    borderWidthUnitMobile,
    borderWidthCustomDesktop,
    borderWidthCustomTablet,
    borderWidthCustomMobile,
    borderColor,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderRadiusUnit,
    borderRadiusCustom,
    borderTopLeftRadiusDesktop,
    borderTopRightRadiusDesktop,
    borderBottomLeftRadiusDesktop,
    borderBottomRightRadiusDesktop,
    borderTopLeftRadiusTablet,
    borderTopRightRadiusTablet,
    borderBottomLeftRadiusTablet,
    borderBottomRightRadiusTablet,
    borderTopLeftRadiusMobile,
    borderTopRightRadiusMobile,
    borderBottomLeftRadiusMobile,
    borderBottomRightRadiusMobile,
    borderRadiusUnitDesktop,
    borderRadiusUnitTablet,
    borderRadiusUnitMobile,
    borderRadiusCustomDesktop,
    borderRadiusCustomTablet,
    borderRadiusCustomMobile,
    height,
    heightDesktop,
    heightTablet,
    heightMobile,
    heightUnitDesktop,
    heightUnitTablet,
    heightUnitMobile,
    heightCustomDesktop,
    heightCustomTablet,
    heightCustomMobile,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    paddingUnit,
    paddingCustom,
    paddingTopDesktop,
    paddingRightDesktop,
    paddingBottomDesktop,
    paddingLeftDesktop,
    paddingTopTablet,
    paddingRightTablet,
    paddingBottomTablet,
    paddingLeftTablet,
    paddingTopMobile,
    paddingRightMobile,
    paddingBottomMobile,
    paddingLeftMobile,
    paddingUnitDesktop,
    paddingUnitTablet,
    paddingUnitMobile,
    paddingCustomDesktop,
    paddingCustomTablet,
    paddingCustomMobile,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    marginUnit,
    marginCustom,
    marginTopDesktop,
    marginRightDesktop,
    marginBottomDesktop,
    marginLeftDesktop,
    marginTopTablet,
    marginRightTablet,
    marginBottomTablet,
    marginLeftTablet,
    marginTopMobile,
    marginRightMobile,
    marginBottomMobile,
    marginLeftMobile,
    marginUnitDesktop,
    marginUnitTablet,
    marginUnitMobile,
    marginCustomDesktop,
    marginCustomTablet,
    marginCustomMobile,
  } = useNode((node) => ({
    text: node.data.props.text,
    variant: node.data.props.variant,
    size: node.data.props.size,
    icon: node.data.props.icon,
    iconAlign: node.data.props.iconAlign,
    iconGap: node.data.props.iconGap,
    iconGapUnit: node.data.props.iconGapUnit,
    iconGapCustom: node.data.props.iconGapCustom,
    iconSize: node.data.props.iconSize,
    iconSizeUnit: node.data.props.iconSizeUnit,
    iconSizeCustom: node.data.props.iconSizeCustom,
    widthDesktop: node.data.props.widthDesktop,
    widthTablet: node.data.props.widthTablet,
    widthMobile: node.data.props.widthMobile,
    widthUnitDesktop: node.data.props.widthUnitDesktop,
    widthUnitTablet: node.data.props.widthUnitTablet,
    widthUnitMobile: node.data.props.widthUnitMobile,
    widthCustomDesktop: node.data.props.widthCustomDesktop,
    widthCustomTablet: node.data.props.widthCustomTablet,
    widthCustomMobile: node.data.props.widthCustomMobile,
    customClass: node.data.props.customClass,
    customCss: node.data.props.customCss,
    backgroundColor: node.data.props.backgroundColor,
    lineHeightNum: node.data.props.lineHeightNum,
    lineHeightUnit: node.data.props.lineHeightUnit,
    borderLeftWidth: node.data.props.borderLeftWidth,
    borderRightWidth: node.data.props.borderRightWidth,
    borderTopWidth: node.data.props.borderTopWidth,
    borderBottomWidth: node.data.props.borderBottomWidth,
    borderWidthUnit: node.data.props.borderWidthUnit,
    borderWidthCustom: node.data.props.borderWidthCustom,
    borderTopWidthDesktop: node.data.props.borderTopWidthDesktop,
    borderRightWidthDesktop: node.data.props.borderRightWidthDesktop,
    borderBottomWidthDesktop: node.data.props.borderBottomWidthDesktop,
    borderLeftWidthDesktop: node.data.props.borderLeftWidthDesktop,
    borderTopWidthTablet: node.data.props.borderTopWidthTablet,
    borderRightWidthTablet: node.data.props.borderRightWidthTablet,
    borderBottomWidthTablet: node.data.props.borderBottomWidthTablet,
    borderLeftWidthTablet: node.data.props.borderLeftWidthTablet,
    borderTopWidthMobile: node.data.props.borderTopWidthMobile,
    borderRightWidthMobile: node.data.props.borderRightWidthMobile,
    borderBottomWidthMobile: node.data.props.borderBottomWidthMobile,
    borderLeftWidthMobile: node.data.props.borderLeftWidthMobile,
    borderWidthUnitDesktop: node.data.props.borderWidthUnitDesktop,
    borderWidthUnitTablet: node.data.props.borderWidthUnitTablet,
    borderWidthUnitMobile: node.data.props.borderWidthUnitMobile,
    borderWidthCustomDesktop: node.data.props.borderWidthCustomDesktop,
    borderWidthCustomTablet: node.data.props.borderWidthCustomTablet,
    borderWidthCustomMobile: node.data.props.borderWidthCustomMobile,
    borderColor: node.data.props.borderColor,
    borderTopLeftRadius: node.data.props.borderTopLeftRadius,
    borderTopRightRadius: node.data.props.borderTopRightRadius,
    borderBottomLeftRadius: node.data.props.borderBottomLeftRadius,
    borderBottomRightRadius: node.data.props.borderBottomRightRadius,
    borderRadiusUnit: node.data.props.borderRadiusUnit,
    borderRadiusCustom: node.data.props.borderRadiusCustom,
    borderTopLeftRadiusDesktop: node.data.props.borderTopLeftRadiusDesktop,
    borderTopRightRadiusDesktop: node.data.props.borderTopRightRadiusDesktop,
    borderBottomLeftRadiusDesktop: node.data.props.borderBottomLeftRadiusDesktop,
    borderBottomRightRadiusDesktop:
      node.data.props.borderBottomRightRadiusDesktop,
    borderTopLeftRadiusTablet: node.data.props.borderTopLeftRadiusTablet,
    borderTopRightRadiusTablet: node.data.props.borderTopRightRadiusTablet,
    borderBottomLeftRadiusTablet: node.data.props.borderBottomLeftRadiusTablet,
    borderBottomRightRadiusTablet: node.data.props.borderBottomRightRadiusTablet,
    borderTopLeftRadiusMobile: node.data.props.borderTopLeftRadiusMobile,
    borderTopRightRadiusMobile: node.data.props.borderTopRightRadiusMobile,
    borderBottomLeftRadiusMobile: node.data.props.borderBottomLeftRadiusMobile,
    borderBottomRightRadiusMobile: node.data.props.borderBottomRightRadiusMobile,
    borderRadiusUnitDesktop: node.data.props.borderRadiusUnitDesktop,
    borderRadiusUnitTablet: node.data.props.borderRadiusUnitTablet,
    borderRadiusUnitMobile: node.data.props.borderRadiusUnitMobile,
    borderRadiusCustomDesktop: node.data.props.borderRadiusCustomDesktop,
    borderRadiusCustomTablet: node.data.props.borderRadiusCustomTablet,
    borderRadiusCustomMobile: node.data.props.borderRadiusCustomMobile,
    height: node.data.props.height,
    heightDesktop: node.data.props.heightDesktop,
    heightTablet: node.data.props.heightTablet,
    heightMobile: node.data.props.heightMobile,
    heightUnitDesktop: node.data.props.heightUnitDesktop,
    heightUnitTablet: node.data.props.heightUnitTablet,
    heightUnitMobile: node.data.props.heightUnitMobile,
    heightCustomDesktop: node.data.props.heightCustomDesktop,
    heightCustomTablet: node.data.props.heightCustomTablet,
    heightCustomMobile: node.data.props.heightCustomMobile,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    paddingUnit: node.data.props.paddingUnit,
    paddingCustom: node.data.props.paddingCustom,
    paddingTopDesktop: node.data.props.paddingTopDesktop,
    paddingRightDesktop: node.data.props.paddingRightDesktop,
    paddingBottomDesktop: node.data.props.paddingBottomDesktop,
    paddingLeftDesktop: node.data.props.paddingLeftDesktop,
    paddingTopTablet: node.data.props.paddingTopTablet,
    paddingRightTablet: node.data.props.paddingRightTablet,
    paddingBottomTablet: node.data.props.paddingBottomTablet,
    paddingLeftTablet: node.data.props.paddingLeftTablet,
    paddingTopMobile: node.data.props.paddingTopMobile,
    paddingRightMobile: node.data.props.paddingRightMobile,
    paddingBottomMobile: node.data.props.paddingBottomMobile,
    paddingLeftMobile: node.data.props.paddingLeftMobile,
    paddingUnitDesktop: node.data.props.paddingUnitDesktop,
    paddingUnitTablet: node.data.props.paddingUnitTablet,
    paddingUnitMobile: node.data.props.paddingUnitMobile,
    paddingCustomDesktop: node.data.props.paddingCustomDesktop,
    paddingCustomTablet: node.data.props.paddingCustomTablet,
    paddingCustomMobile: node.data.props.paddingCustomMobile,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    marginUnit: node.data.props.marginUnit,
    marginCustom: node.data.props.marginCustom,
    marginTopDesktop: node.data.props.marginTopDesktop,
    marginRightDesktop: node.data.props.marginRightDesktop,
    marginBottomDesktop: node.data.props.marginBottomDesktop,
    marginLeftDesktop: node.data.props.marginLeftDesktop,
    marginTopTablet: node.data.props.marginTopTablet,
    marginRightTablet: node.data.props.marginRightTablet,
    marginBottomTablet: node.data.props.marginBottomTablet,
    marginLeftTablet: node.data.props.marginLeftTablet,
    marginTopMobile: node.data.props.marginTopMobile,
    marginRightMobile: node.data.props.marginRightMobile,
    marginBottomMobile: node.data.props.marginBottomMobile,
    marginLeftMobile: node.data.props.marginLeftMobile,
    marginUnitDesktop: node.data.props.marginUnitDesktop,
    marginUnitTablet: node.data.props.marginUnitTablet,
    marginUnitMobile: node.data.props.marginUnitMobile,
    marginCustomDesktop: node.data.props.marginCustomDesktop,
    marginCustomTablet: node.data.props.marginCustomTablet,
    marginCustomMobile: node.data.props.marginCustomMobile,
  }));

  // La letra del formato anterior, para que la seccion la enseñe y la migre al
  // primer cambio. Es el mismo legado que resuelve el render.
  const { legacy: typographyLegacy } = typographyLegacyOf({
    lineHeightNum,
    lineHeightUnit,
  });

  // Los bordes del formato anterior, para que la seccion los enseñe y los
  // migre al primer cambio. Las esquinas sin valor se quedan sin valor: es lo
  // que deja al boton conservar el redondeo de su variante.
  const borderLegacy: BorderLegacy = {
    width: {
      sides: {
        Top: borderTopWidth,
        Right: borderRightWidth,
        Bottom: borderBottomWidth,
        Left: borderLeftWidth,
      },
      unit: borderWidthUnit ?? "px",
      custom: borderWidthCustom ?? "",
    },
    radius: {
      sides: {
        TopLeft: borderTopLeftRadius,
        TopRight: borderTopRightRadius,
        BottomLeft: borderBottomLeftRadius,
        BottomRight: borderBottomRightRadius,
      },
      unit: borderRadiusUnit ?? "px",
      custom: borderRadiusCustom ?? "",
    },
  };

  // Las medidas del formato anterior, para que la seccion las enseñe y las
  // migre al primer cambio. El mismo legado que resuelve el render: el ancho
  // de siempre era el celular al 100% y nada en los otros dos; el alto, un
  // texto —"40px"— que valia para los tres; relleno y margen, cuatro lados
  // sueltos con una unidad.
  const legacyHeightValue = height ? parseInt(height) || undefined : undefined;
  const spacingLegacy: SpacingLegacy = {
    width: { mobile: { value: 100, unit: "%", custom: "" } },
    height: {
      desktop: { value: legacyHeightValue, unit: "px", custom: "" },
      tablet: { value: legacyHeightValue, unit: "px", custom: "" },
      mobile: { value: legacyHeightValue, unit: "px", custom: "" },
    },
    padding: {
      sides: {
        Top: paddingTop,
        Right: paddingRight,
        Bottom: paddingBottom,
        Left: paddingLeft,
      },
      unit: paddingUnit ?? "px",
      custom: paddingCustom ?? "",
    },
    margin: {
      sides: {
        Top: marginTop,
        Right: marginRight,
        Bottom: marginBottom,
        Left: marginLeft,
      },
      unit: marginUnit ?? "px",
      custom: marginCustom ?? "",
    },
  };

  return (
    <div className="flex flex-col [&_input]:h-8 [&_input]:text-[12px] md:[&_input]:text-[12px]">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <PanelField label="Texto">
            {(id) => (
            <Input
              id={id}
              value={text}
              onChange={(e) =>
                setProp(
                  (props: EditableButtonProps) => (props.text = e.target.value),
                )
              }
            />
            )}
          </PanelField>

          <PanelField label="Variante">
            {(id) => (
            <Select
              value={variant}
              onValueChange={(val) =>
                setProp(
                  (props: EditableButtonProps) => (props.variant = val as any),
                )
              }
            >
              <SelectTrigger id={id} className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="default">Predeterminado</SelectItem>
                <SelectItem className="text-[12px]" value="secondary">Secundario</SelectItem>
                <SelectItem className="text-[12px]" value="outline">Contorno</SelectItem>
                <SelectItem className="text-[12px]" value="ghost">Transparente</SelectItem>
                <SelectItem className="text-[12px]" value="destructive">Destructivo</SelectItem>
              </SelectContent>
            </Select>
            )}
          </PanelField>

          {/* El tamano del boton, no el de su letra: el de la letra vive en
              Tipografía y aqui se elige el porte que le da su variante. */}
          <PanelField label="Tamaño">
            {(id) => (
            <Select
              value={size}
              onValueChange={(val) =>
                setProp((props: EditableButtonProps) => (props.size = val as any))
              }
            >
              <SelectTrigger id={id} className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="sm">Pequeño</SelectItem>
                <SelectItem className="text-[12px]" value="default">Mediano</SelectItem>
                <SelectItem className="text-[12px]" value="lg">Grande</SelectItem>
              </SelectContent>
            </Select>
            )}
          </PanelField>

          <PanelField label="Ícono">
            {(id) => (
            <Select
              value={icon}
              onValueChange={(val) =>
                setProp((props: EditableButtonProps) => (props.icon = val as any))
              }
            >
              <SelectTrigger id={id} className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="none">Ninguno</SelectItem>
                <SelectItem className="text-[12px]" value="arrowRight">Flecha derecha</SelectItem>
                <SelectItem className="text-[12px]" value="arrowLeft">Flecha izquierda</SelectItem>
                <SelectItem className="text-[12px]" value="shoppingCart">Carrito</SelectItem>
                <SelectItem className="text-[12px]" value="mail">Email</SelectItem>
                <SelectItem className="text-[12px]" value="phone">Teléfono</SelectItem>
                <SelectItem className="text-[12px]" value="externalLink">Enlace externo</SelectItem>
                <SelectItem className="text-[12px]" value="plus">Más (+)</SelectItem>
                <SelectItem className="text-[12px]" value="info">Información</SelectItem>
                <SelectItem className="text-[12px]" value="check">Verificado</SelectItem>
                <SelectItem className="text-[12px]" value="download">Descarga</SelectItem>
                <SelectItem className="text-[12px]" value="menu">Menú</SelectItem>
              </SelectContent>
            </Select>
            )}
          </PanelField>
    
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
                      (props: EditableButtonProps) => (props.iconAlign = val as any),
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
    
              <PanelField label="Espaciado del ícono">
                {(id) => (
                <PropertyUnitInput
                  id={id}
                  // Un espaciado o un tamano no admiten "auto" en CSS.
                  exclude={["auto"]}
                  value={iconGap}
                  unit={iconGapUnit ?? "px"}
                  custom={iconGapCustom ?? ""}
                  onUnitChange={(val) =>
                    setProp((props: EditableButtonProps) => (props.iconGapUnit = val))
                  }
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableButtonProps) => (props.iconGap = val ?? 4),
                    )
                  }
                  onCustomChange={(val) =>
                    setProp((props: EditableButtonProps) => (props.iconGapCustom = val))
                  }
                />
                )}
              </PanelField>

              <PanelField label="Tamaño del ícono">
                {(id) => (
                <PropertyUnitInput
                  id={id}
                  // Un espaciado o un tamano no admiten "auto" en CSS.
                  exclude={["auto"]}
                  value={iconSize}
                  unit={iconSizeUnit ?? "px"}
                  custom={iconSizeCustom ?? ""}
                  onUnitChange={(val) =>
                    setProp((props: EditableButtonProps) => (props.iconSizeUnit = val))
                  }
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableButtonProps) => (props.iconSize = val ?? 16),
                    )
                  }
                  onCustomChange={(val) =>
                    setProp(
                      (props: EditableButtonProps) => (props.iconSizeCustom = val),
                    )
                  }
                />
                )}
              </PanelField>
            </>
          )}
        </div>
      </SettingsSection>

      {/* Un boton de tipo "Botón" dispara algo en la propia pagina y no navega,
          asi que es de los pocos bloques que necesitan el desplegable de tipo:
          ver LinkSection. */}
      <LinkSection withLinkType />

      {/* "Alineación" se recorta: el contenido del boton lo coloca flex
          —`justify-center` de la variante de shadcn— y ahi `text-align` no
          mueve nada, asi que ofrecerla seria prometer lo que no se aplica. */}
      <TypographySection legacy={typographyLegacy} fields={{ textAlign: false }} />

      <SettingsSection title="Apariencia">
        <div className="flex flex-col gap-3">
          <PanelField label="Color de fondo">
            {(id) => (
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={backgroundColor}
                onChange={(val) =>
                  setProp((props: EditableButtonProps) => (props.backgroundColor = val))
                }
              />
            </div>
            )}
          </PanelField>
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={borderLegacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableButtonProps) => (props.customClass = val))
        }
        classHelp="Se aplica al contenedor del botón. Útil para disparadores de modales."
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableButtonProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableButton.craft = {
  displayName: "Botón",
  props: {
    text: "Botón",
    href: "#",
    linkType: "url",
    variant: "default" as const,
    size: "default" as const,
    icon: "none",
    iconAlign: "left",
    iconGap: 4,
    iconGapUnit: "px" as const,
    iconGapCustom: "",
    iconSize: 16,
    iconSizeUnit: "px" as const,
    iconSizeCustom: "",
    // El ancho queda fuera a proposito, como los radios y el relleno: craft.js
    // arma las props como { ...craft.props, ...guardadas }, asi que declarar
    // aqui las unidades en "auto" se las inyectaria tambien a los botones ya
    // publicados y perderian su ancho. Los nuevos las traen desde el panel de
    // bloques, que es el unico sitio donde se distingue un boton recien puesto.
    customClass: "",
    textColor: undefined,
    backgroundColor: undefined,
    fontFamily: "sans" as const,
    sizeUnit: "px" as const,
    sizeCustom: "",
    // Los que trae la variante de shadcn con `text-sm`: 14px de letra y 20px de
    // alto de linea. Se declaran de verdad en vez de dejarse vacios para que el
    // panel enseñe lo que el boton mide, no un campo en blanco.
    sizeDesktop: 14,
    sizeTablet: undefined,
    sizeMobile: undefined,
    lineHeightUnit: "px" as const,
    lineHeightCustom: "",
    lineHeightDesktop: 20,
    lineHeightTablet: undefined,
    lineHeightMobile: undefined,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: "transparent",
    borderStyle: "solid" as const,
    // Radios y relleno quedan fuera a proposito. craft.js arma las props como
    // { ...craft.props, ...guardadas }, asi que declararlos aqui se los
    // inyectaria a los botones ya publicados y perderian el redondeo y el
    // relleno que hoy les da su variante.
    height: "",
    openInNewTab: false,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableButtonSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
