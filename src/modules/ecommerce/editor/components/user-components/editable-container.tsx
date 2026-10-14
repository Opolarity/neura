import { useEffect, useId, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style";
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { LinkSection, popupTargetOf, type PopupLinkAction } from "@/modules/ecommerce/editor/components/link-section";
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section";
import { BorderSection, useBorderCss, type BorderLegacy } from "@/modules/ecommerce/editor/components/border-section";
import { SpacingSection, useSpacingCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section";
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import {
  AppearanceSection,
  useAppearance,
  APPEARANCE_CRAFT_PROPS,
  type AppearanceProps,
} from "@/modules/ecommerce/editor/components/appearance-section";

interface EditableContainerProps extends AppearanceProps {
  children?: React.ReactNode;
  containerId?: string;
  /** @deprecated Nombre anterior de la clase CSS. Se sigue leyendo para no romper las paginas ya publicadas. */
  customClassName?: string;
  customClass?: string;
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string;
  /** @deprecated Relleno unico. Lo siguen trayendo las paginas guardadas antes de tener relleno por lado. */
  padding?: number;
  /** @deprecated Grosor de borde unico. Idem: se conserva para no romper el contenido ya publicado. */
  border?: number;
  /** @deprecated Radio unico. Idem. */
  borderRadius?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  /**
   * Enlace al que lleva el contenedor entero. Mientras este vacio el bloque se
   * sirve como <div>, que es lo que vienen haciendo los ya publicados.
   */
  href?: string;
  openInNewTab?: boolean;
  /** Sin valor es "url", como los ya publicados. Ver LinkSection. */
  linkType?: "url" | "popup";
  popupSlug?: string;
  popupAction?: PopupLinkAction;
  /**
   * Como reparte a sus hijos. `flex` es con lo que nacio el contenedor y tiene
   * que seguir siendo el valor por defecto: las paginas ya publicadas no
   * llevan esta prop escrita, asi que cualquier otro valor les daria la vuelta
   * al diseño a todas.
   */
  display?: "flex" | "grid";
  /**
   * Columnas de la cuadricula por modo de pantalla. Solo pintan con
   * `display: "grid"`, asi que a un contenedor flex no le cambian nada.
   */
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  /**
   * Si los hijos saltan de linea cuando no caben. `nowrap` es el valor con el
   * que nacio el contenedor y el que CSS aplica por defecto, asi que los ya
   * publicados se siguen viendo igual.
   */
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  gap?: number;
  alignItems?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  minHeight?: string | number;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
  overflowX?: "hidden" | "auto";
  overflowY?: "hidden" | "auto";
  [key: string]: unknown;
}

/**
 * Los bordes del formato anterior (un grosor y un radio por lado, en px), con
 * los mismos valores por defecto que aplicaba el componente: el grosor cae al
 * `border` unico y el radio al `borderRadius` unico, y si no hay nada, a 0.
 * Lo usan el render y el panel, para que los dos vean lo mismo.
 */
/**
 * El relleno del formato anterior: cuatro lados en px que caen al `padding`
 * unico y, si no hay nada, a 16. Lo usan el render y el panel.
 */
function spacingLegacyOf(props: EditableContainerProps): SpacingLegacy {
  const { padding, paddingTop, paddingRight, paddingBottom, paddingLeft } = props;
  return {
    padding: {
      sides: {
        Top: paddingTop ?? padding ?? 16,
        Right: paddingRight ?? padding ?? 16,
        Bottom: paddingBottom ?? padding ?? 16,
        Left: paddingLeft ?? padding ?? 16,
      },
      unit: "px",
      custom: "",
    },
  };
}

function borderLegacyOf({
  border,
  borderRadius,
  borderLeftWidth = border ?? 0,
  borderRightWidth = border ?? 0,
  borderTopWidth = border ?? 0,
  borderBottomWidth = border ?? 0,
  borderTopLeftRadius = borderRadius ?? 0,
  borderTopRightRadius = borderRadius ?? 0,
  borderBottomLeftRadius = borderRadius ?? 0,
  borderBottomRightRadius = borderRadius ?? 0,
}: EditableContainerProps): BorderLegacy {
  return {
    width: {
      sides: {
        Top: borderTopWidth,
        Right: borderRightWidth,
        Bottom: borderBottomWidth,
        Left: borderLeftWidth,
      },
      unit: "px",
      custom: "",
    },
    radius: {
      sides: {
        TopLeft: borderTopLeftRadius,
        TopRight: borderTopRightRadius,
        BottomLeft: borderBottomLeftRadius,
        BottomRight: borderBottomRightRadius,
      },
      unit: "px",
      custom: "",
    },
  };
}

export function EditableContainer(props: EditableContainerProps) {
  const {
    children,
    containerId,
    customClassName,
    customClass,
    customCss,
    href = "",
    openInNewTab = false,
    linkType,
    popupSlug,
    popupAction,
    display = "flex",
    columnsDesktop = 3,
    columnsTablet = 2,
    columnsMobile = 1,
    flexDirection = "column",
    flexWrap = "nowrap",
    gap = 8,
    alignItems = "stretch",
    justifyContent = "flex-start",
    minHeight = "60px",
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
    overflowX = "hidden",
    overflowY = "hidden",
  } = props;
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  // El fondo —color, imagen, video o degradado— lo resuelve la seccion
  // Apariencia, comun a varios bloques (ver appearance-section.tsx).
  const fondo = useAppearance(props);

  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile });

  // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la que
  // escriba el usuario, para que pueda pisarla si quiere.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  // Los bordes: grosor, estilo, color y radio, por modo de pantalla. Mientras
  // el bloque siga en el formato anterior se pintan los de entonces.
  const borde = useBorderCss(props as Record<string, unknown>, borderLegacyOf(props));
  // Ancho, alto, relleno y margen por modo; el relleno de siempre mientras el
  // bloque siga en el formato anterior.
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props));

  // La clase personalizada se guardaba antes como `customClassName`. Se lee el
  // nombre nuevo primero y se cae al anterior para las paginas ya publicadas.
  const claseUsuario = customClass ?? customClassName;

  // Antes era un numero de px; ahora es una cadena con unidad.
  const resolvedMinHeight =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  const isEmpty =
    !children || (Array.isArray(children) && children.length === 0);

  const esGrid = display === "grid";
  // Un enlace vacio no es enlace: el bloque se sigue sirviendo como <div>. Se
  // comprueba con && y no con .trim() a secas porque el valor viene de una
  // pagina guardada, donde la prop puede estar ausente o en null.
  // De tipo "Popup" no navega aunque conserve un href de antes: abre el popup.
  const popup = popupTargetOf({ linkType, popupSlug, popupAction });
  const esEnlace = linkType !== "popup" && Boolean(href && href.trim());

  // Las columnas se reparten con el mismo criterio que el componente Columnas,
  // para que los dos se comporten igual: en el editor manda el modo que se esta
  // previsualizando (useResponsiveValue trae su valor), y en la tienda devuelve
  // null y deciden las media queries contra el ancho real del navegador.
  const columnasActivas = useResponsiveValue({
    desktop: columnsDesktop,
    tablet: columnsTablet,
    mobile: columnsMobile,
  });
  const gridId = useId();
  const gridClass = `editable-container-grid-${gridId.replace(/:/g, "")}`;

  return (
    <>
      {/* Solo las columnas van por clase; el `display: grid` se queda en el
          style, que es donde el contenedor lleva siempre el suyo. Sin grid no
          se emite nada, para no dejar CSS muerto en cada contenedor de la
          pagina. */}
      {esGrid && (
        <style>{columnasActivas !== null ? `
        .${gridClass} {
          grid-template-columns: repeat(${columnasActivas}, 1fr);
        }
      ` : `
        .${gridClass} {
          grid-template-columns: repeat(${columnsMobile}, 1fr);
        }
        @media (min-width: 768px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsTablet}, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsDesktop}, 1fr);
          }
        }
      `}</style>
      )}
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {fondo.styleTag}
      <SelectableNode
        // Con enlace el propio nodo pasa a ser el <a>, no un envoltorio: asi
        // sigue siendo el elemento que craft conecta, arrastra y sobre el que
        // se sueltan los hijos. Dentro del editor el wrapper no escribe el
        // href, con lo que el clic solo selecciona (ver SelectableNode).
        //
        // Si dentro hay otro enlace (un Boton, un Icono), en la tienda manda el
        // de dentro: el navegador activa el <a> mas cercano al clic.
        as={esEnlace ? "a" : "div"}
        href={esEnlace ? href : undefined}
        target={esEnlace && openInNewTab ? "_blank" : undefined}
        rel={esEnlace && openInNewTab ? "noreferrer noopener" : undefined}
        popup={popup}
        // El cursor de mano avisa de que ahi hay algo que en la tienda reacciona.
        clickable={esEnlace || Boolean(popup)}
        style={{
          display: esGrid ? "grid" : "flex",
          // En cuadricula estas dos no aplican, y dejarlas escritas ensuciaria
          // el HTML publicado con propiedades que el navegador ignora.
          flexDirection: esGrid ? undefined : flexDirection,
          flexWrap: esGrid ? undefined : flexWrap,
          gap,
          alignItems,
          justifyContent,
          minHeight: resolvedMinHeight,
          overflowX,
          overflowY,
        }}
        id={containerId || undefined}
        // El "relative isolate" se queda aqui, tambien fuera del editor: el
        // video de fondo es absolute con -z-10 y cuelga de el.
        className={`relative isolate w-full ${esGrid ? gridClass : ""} ${borde.className} ${medidas.className} ${fondo.className} ${customCssClass} ${claseUsuario ?? ""} ${visClass} ${enabled && isEmpty
            ? "border-2 border-dashed border-muted-foreground/30"
            : ""
          }`}
      >
        {fondo.backgroundVideo}
        {enabled && isEmpty ? (
          <div
            className="flex items-center justify-center w-full text-xs text-muted-foreground/50"
            // En cuadricula el aviso ocupa la fila entera; si no, se metia en
            // la primera columna y quedaba recortado.
            style={esGrid ? { gridColumn: "1 / -1" } : undefined}
          >
            Arrastra componentes aqui
          </div>
        ) : (
          children
        )}
      </SelectableNode>
    </>
  );
}

type MinHeightUnit = "px" | "em" | "rem" | "vh" | "%" | "auto";

function parseMinHeight(
  minHeight: string | number
): { value: string; unit: MinHeightUnit } {
  // Un numero pelado viene del formato viejo, donde el alto minimo era px.
  if (typeof minHeight === "number") {
    return { value: String(minHeight), unit: "px" };
  }
  if (minHeight === "auto") return { value: "", unit: "auto" };
  const match = /^([\d.]+)(px|em|rem|vh|%)$/.exec(minHeight);
  if (match) return { value: match[1], unit: match[2] as MinHeightUnit };
  if (/^[\d.]+$/.test(minHeight)) return { value: minHeight, unit: "px" };
  return { value: "60", unit: "px" };
}

// Las mismas opciones que ofrece el componente Columnas: un contenedor en
// cuadricula y una fila de columnas tienen que poder hacer lo mismo.
const COLUMN_OPTIONS = [
  { value: "1", label: "1 columna" },
  { value: "2", label: "2 columnas" },
  { value: "3", label: "3 columnas" },
  { value: "4", label: "4 columnas" },
  { value: "5", label: "5 columnas" },
  { value: "6", label: "6 columnas" },
];

function EditableContainerSettings() {
  const {
    actions: { setProp },
    containerId,
    customClassName,
    customClass,
    customCss,
    display,
    columnsDesktop,
    columnsTablet,
    columnsMobile,
    flexDirection,
    flexWrap,
    gap,
    alignItems,
    justifyContent,
    minHeight,
    borderLegacy,
    spacingLegacy,
    overflowX,
    overflowY,
  } = useNode((node) => ({
    containerId: node.data.props.containerId,
    customClassName: node.data.props.customClassName,
    customClass: node.data.props.customClass,
    customCss: node.data.props.customCss,
    // Los valores por defecto se repiten aqui porque el panel lee el nodo
    // crudo: una pagina guardada antes de que existieran estas props no las
    // trae, y sin esto los selects saldrian en blanco.
    display: (node.data.props.display ?? "flex") as "flex" | "grid",
    columnsDesktop: node.data.props.columnsDesktop ?? 3,
    columnsTablet: node.data.props.columnsTablet ?? 2,
    columnsMobile: node.data.props.columnsMobile ?? 1,
    flexDirection: node.data.props.flexDirection,
    flexWrap: node.data.props.flexWrap,
    gap: node.data.props.gap,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    minHeight: node.data.props.minHeight,
    // Los bordes del formato anterior, resueltos igual que en el render.
    borderLegacy: borderLegacyOf(node.data.props as EditableContainerProps),
    // El relleno del formato anterior, resuelto igual que en el render.
    spacingLegacy: spacingLegacyOf(node.data.props as EditableContainerProps),
    overflowX: node.data.props.overflowX,
    overflowY: node.data.props.overflowY,
  }));

  const parsedMinHeight = parseMinHeight(minHeight ?? "60px");
  const [minHeightValue, setMinHeightValue] = useState(parsedMinHeight.value);
  const [minHeightUnit, setMinHeightUnit] = useState(parsedMinHeight.unit);

  useEffect(() => {
    const parsed = parseMinHeight(minHeight ?? "60px");
    setMinHeightValue(parsed.value);
    setMinHeightUnit(parsed.unit);
  }, [minHeight]);

  return (
    <div className="flex flex-col">
      {/* Quien usa el editor vende ropa, no escribe CSS: los campos se llaman
          por lo que hacen, no por la propiedad que tocan. Las dos alineaciones
          se nombran por el sentido en el que de verdad mueven el contenido, y
          ese sentido lo decide la Direccion: en columnas, la primera reparte de
          arriba abajo; en filas, de izquierda a derecha. */}
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">
              Disposición
            </Label>
            <Select
              value={display}
              onValueChange={(val) =>
                setProp(
                  (props: EditableContainerProps) =>
                  (props.display =
                    val as EditableContainerProps["display"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="flex">En línea</SelectItem>
                <SelectItem className="text-[12px]" value="grid">En cuadrícula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* En cuadricula las columnas sustituyen a la direccion y al ajuste:
              esas dos son de flex y el navegador las ignora, asi que dejarlas a
              la vista solo haria creer que sirven para algo. La alineacion y el
              espaciado si valen en los dos y se quedan siempre. */}
          {display === "grid" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">
                  Columnas en escritorio (≥1024px)
                </Label>
                <Select
                  value={String(columnsDesktop)}
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableContainerProps) =>
                        (props.columnsDesktop = parseInt(val)),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_OPTIONS.map((opt) => (
                      <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">
                  Columnas en tableta (≥768px)
                </Label>
                <Select
                  value={String(columnsTablet)}
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableContainerProps) =>
                        (props.columnsTablet = parseInt(val)),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_OPTIONS.map((opt) => (
                      <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">
                  Columnas en celular (&lt;768px)
                </Label>
                <Select
                  value={String(columnsMobile)}
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableContainerProps) =>
                        (props.columnsMobile = parseInt(val)),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_OPTIONS.map((opt) => (
                      <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">
                  Dirección de elementos
                </Label>
                <Select
                  value={flexDirection}
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableContainerProps) =>
                      (props.flexDirection =
                        val as EditableContainerProps["flexDirection"]),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-[12px]" value="row">Horizontal</SelectItem>
                    <SelectItem className="text-[12px]" value="row-reverse">Horizontal invertida</SelectItem>
                    <SelectItem className="text-[12px]" value="column">Vertical</SelectItem>
                    <SelectItem className="text-[12px]" value="column-reverse">Vertical invertida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">
                  Ajuste de elementos
                </Label>
                <Select
                  value={flexWrap}
                  onValueChange={(val) =>
                    setProp(
                      (props: EditableContainerProps) =>
                      (props.flexWrap =
                        val as EditableContainerProps["flexWrap"]),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-[12px]" value="nowrap">No ajustar</SelectItem>
                    <SelectItem className="text-[12px]" value="wrap">Ajustar</SelectItem>
                    <SelectItem className="text-[12px]" value="wrap-reverse">Ajustar al revés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">
              Alineación horizontal
            </Label>
            <Select
              value={justifyContent}
              onValueChange={(val) =>
                setProp(
                  (props: EditableContainerProps) =>
                  (props.justifyContent =
                    val as EditableContainerProps["justifyContent"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="flex-start">Inicio</SelectItem>
                <SelectItem className="text-[12px]" value="flex-end">Final</SelectItem>
                <SelectItem className="text-[12px]" value="center">Centro</SelectItem>
                <SelectItem className="text-[12px]" value="space-between">Entre elementos</SelectItem>
                <SelectItem className="text-[12px]" value="space-around">Alrededor</SelectItem>
                <SelectItem className="text-[12px]" value="space-evenly">Espaciado uniforme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">
              Alineación vertical
            </Label>
            <Select
              value={alignItems}
              onValueChange={(val) =>
                setProp(
                  (props: EditableContainerProps) =>
                  (props.alignItems =
                    val as EditableContainerProps["alignItems"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="flex-start">Inicio</SelectItem>
                <SelectItem className="text-[12px]" value="flex-end">Final</SelectItem>
                <SelectItem className="text-[12px]" value="center">Centro</SelectItem>
                <SelectItem className="text-[12px]" value="stretch">Estirar</SelectItem>
                <SelectItem className="text-[12px]" value="baseline">Línea base</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <AppearanceSection />

      {/* El enlace va aparte del diseño: no cambia como se ve el bloque, solo
          lo que pasa al hacerle clic. La seccion es la misma que usa el Boton
          (ver LinkSection), para que se busque donde ya se busca. */}
      <LinkSection
        help="Con un enlace, todo el contenedor lleva a esa dirección."
        helpLabel="Qué hace el enlace del contenedor"
        linkTypes={["url", "popup"]}
      />

      {/* El Alto mínimo compartido no se enseña: el contenedor ya tiene el
          suyo, justo debajo, y dos campos con el mismo nombre se pisarian. */}
      <SpacingSection legacy={spacingLegacy} fields={{ minHeight: false }}>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Alto mínimo</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                className="h-8 text-[12px] md:text-[12px]"
                min={0}
                max={800}
                value={minHeightValue}
                disabled={minHeightUnit === "auto"}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setMinHeightValue(newValue);
                  setProp(
                    (props: EditableContainerProps) =>
                      (props.minHeight = `${newValue || "60"}${minHeightUnit}`),
                  );
                }}
              />
              <Select
                value={minHeightUnit}
                onValueChange={(val) => {
                  const unit = val as MinHeightUnit;
                  setMinHeightUnit(unit);
                  setProp((props: EditableContainerProps) => {
                    props.minHeight =
                      unit === "auto"
                        ? "auto"
                        : `${minHeightValue || "60"}${unit}`;
                  });
                }}
              >
                <SelectTrigger className="w-20 h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-[12px]" value="px">px</SelectItem>
                  <SelectItem className="text-[12px]" value="em">em</SelectItem>
                  <SelectItem className="text-[12px]" value="rem">rem</SelectItem>
                  <SelectItem className="text-[12px]" value="vh">vh</SelectItem>
                  <SelectItem className="text-[12px]" value="%">%</SelectItem>
                  <SelectItem className="text-[12px]" value="auto">auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Desbordamiento X</Label>
            <Select
              value={overflowX}
              onValueChange={(val) =>
                setProp(
                  (props: EditableContainerProps) =>
                  (props.overflowX =
                    val as EditableContainerProps["overflowX"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="auto">Auto</SelectItem>
                <SelectItem className="text-[12px]" value="hidden">Ocultar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Desbordamiento Y</Label>
            <Select
              value={overflowY}
              onValueChange={(val) =>
                setProp(
                  (props: EditableContainerProps) =>
                  (props.overflowY =
                    val as EditableContainerProps["overflowY"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="auto">Auto</SelectItem>
                <SelectItem className="text-[12px]" value="hidden">Ocultar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado (gap)</Label>
            <Input
              type="number"
              className="h-8 text-[12px] md:text-[12px]"
              value={gap}
              min={0}
              max={100}
              onChange={(e) =>
                setProp(
                  (props: EditableContainerProps) =>
                    (props.gap = parseInt(e.target.value) || 0),
                )
              }
            />
          </div>

      </SpacingSection>

      <BorderSection legacy={borderLegacy} />

      <AdvancedSection
        // El nombre nuevo manda; el anterior se sigue leyendo para las paginas
        // ya publicadas, pero lo que se escriba va siempre al nuevo.
        customClass={customClass ?? customClassName ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableContainerProps) => {
            props.customClass = val || undefined;
          })
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableContainerProps) => (props.customCss = val))
        }
        elementId={containerId ?? ""}
        onElementIdChange={(val) =>
          setProp((props: EditableContainerProps) => {
            const value = val.replace(/\s/g, "");
            props.containerId = value || undefined;
          })
        }
        idLabel="Id"
      />
    </div>
  );
}

EditableContainer.craft = {
  displayName: "Contenedor",
  // craft.js arma las props como { ...craft.props, ...propsGuardadas }, asi que
  // todo lo que se declare aca gana sobre lo que falte en el JSON guardado. Las
  // props que tienen equivalente antiguo (relleno, borde y radio por lado) se
  // dejan fuera a proposito: si estuvieran, taparian a `padding`, `border` y
  // `borderRadius` de las paginas ya publicadas. Sus valores por defecto viven
  // en la firma del componente.
  props: {
    containerId: undefined,
    customClassName: undefined,
    ...APPEARANCE_CRAFT_PROPS,
    // Sin enlace, como han nacido siempre: una cadena vacia no hace <a>.
    href: "",
    openInNewTab: false,
    // "flex" es obligatorio aqui: es lo que hace hoy un contenedor publicado
    // que no trae la prop, y poner "grid" les cambiaria el diseño a todos.
    display: "flex" as const,
    // Las columnas solo pintan en cuadricula, asi que declararlas no le cambia
    // nada a un contenedor flex. Son las mismas con las que nace Columnas.
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    flexDirection: "column" as const,
    // `nowrap` es lo que CSS aplica por defecto y lo que vienen haciendo los
    // contenedores ya publicados, asi que declararlo no le cambia nada a nadie.
    flexWrap: "nowrap" as const,
    gap: 8,
    alignItems: "stretch" as const,
    justifyContent: "flex-start" as const,
    minHeight: "60px",
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
    overflowX: "hidden" as const,
    overflowY: "hidden" as const,
  },
  related: {
    settings: EditableContainerSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
