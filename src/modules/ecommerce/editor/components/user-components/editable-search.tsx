import { useNode, useEditor } from "@craftjs/core";
import { Search, SearchCheck, SearchX, ZoomIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import {
  BorderSection,
  useBorderCss,
  type BorderLegacy,
} from "@/modules/ecommerce/editor/components/border-section";
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
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures";
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style";
import { useSearch } from "@/modules/ecommerce/editor/tienda/search-store";

const IconMap = {
  search: Search,
  searchCheck: SearchCheck,
  searchX: SearchX,
  zoomIn: ZoomIn,
};

type IconName = keyof typeof IconMap;

interface EditableSearchProps {
  icon?: IconName;
  /**
   * @deprecated El color del icono. Se sigue leyendo —como `legacy.textColor`
   * de la seccion "Tipografía"— porque lo traen las cabeceras ya publicadas,
   * pero ya no tiene campo propio: el SVG hereda el `color` del boton, asi que
   * este color y el de la tipografia siempre fueron el mismo y sobraba uno.
   */
  color?: string;
  /**
   * @deprecated El relleno de antes de que las medidas fueran por modo de
   * pantalla. Se sigue leyendo porque lo traen las cabeceras ya publicadas,
   * pero ya no tiene campo propio: solo alimenta el `legacy` de
   * SpacingSection.
   */
  paddingLeft?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingRight?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingTop?: number;
  /** @deprecated Mismo motivo que `paddingLeft`. */
  paddingBottom?: number;
  /**
   * @deprecated El grosor del borde sin modo de pantalla. Mismo motivo que
   * `paddingLeft`, con el `legacy` de BorderSection.
   */
  borderLeft?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  borderRight?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  borderTop?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  borderBottom?: number;
  borderColor?: string;
  borderStyle?: BorderStyle;
  /**
   * @deprecated El radio de la esquina sin modo de pantalla. Mismo motivo
   * que `borderLeft`.
   */
  radiusTopLeft?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  radiusTopRight?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  radiusBottomLeft?: number;
  /** @deprecated Mismo motivo que `borderLeft`. */
  radiusBottomRight?: number;
  customClass?: string;
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
  /** Bordes, medidas y letra por modo de pantalla; los escriben sus secciones. */
  [key: string]: unknown;
}

// Los bordes del formato anterior (borderLeft/…, radiusTopLeft/…), para que el
// render los siga pintando y la seccion los enseñe y migre al primer cambio.
// Render y panel lo llaman con las mismas props para ver lo mismo.
function borderLegacyOf(props: EditableSearchProps): BorderLegacy {
  const {
    borderLeft = 0,
    borderRight = 0,
    borderTop = 0,
    borderBottom = 0,
    radiusTopLeft = 0,
    radiusTopRight = 0,
    radiusBottomLeft = 0,
    radiusBottomRight = 0,
  } = props;
  return {
    width: {
      sides: {
        Top: borderTop,
        Right: borderRight,
        Bottom: borderBottom,
        Left: borderLeft,
      },
      unit: "px",
      custom: "",
    },
    widthValueFor: (side) => props[`border${side}`] as number | undefined,
    radius: {
      sides: {
        TopLeft: radiusTopLeft,
        TopRight: radiusTopRight,
        BottomLeft: radiusBottomLeft,
        BottomRight: radiusBottomRight,
      },
      unit: "px",
      custom: "",
    },
    radiusValueFor: (corner) => props[`radius${corner}`] as number | undefined,
  };
}

// El relleno del formato anterior (paddingLeft/…, 8px por lado), para que el
// render lo siga pintando y la seccion lo enseñe y migre al primer cambio.
function spacingLegacyOf(props: EditableSearchProps): SpacingLegacy {
  const {
    paddingLeft = 8,
    paddingRight = 8,
    paddingTop = 8,
    paddingBottom = 8,
  } = props;
  return {
    padding: {
      sides: {
        Top: paddingTop,
        Right: paddingRight,
        Bottom: paddingBottom,
        Left: paddingLeft,
      },
      unit: "px",
      custom: "",
    },
  };
}

/**
 * El color que el bloque guardaba como "Color del icono". Es el color del
 * bloque entero —el SVG no tiene color propio, hereda el del boton—, asi que la
 * seccion de tipografia lo lee de legado y lo pisa `textColor` al primer cambio.
 */
function typographyLegacyOf(props: EditableSearchProps): TypographyLegacy {
  return { textColor: props.color };
}

export function EditableSearch(props: EditableSearchProps) {
  const {
    icon = "search",
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
  } = props;
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const borde = useBorderCss(props as Record<string, unknown>, borderLegacyOf(props));
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props));
  // La letra del bloque. El legado es `color`, el viejo "Color del icono":
  // como el SVG hereda el `color` del boton, pintarlo aparte era pintar dos
  // veces la misma propiedad, y la de la seccion perdia por ir en una clase.
  const letra = useTypographyCss(
    props as Record<string, unknown>,
    typographyLegacyOf(props),
  );

  const { openSearch } = useSearch();

  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  });

  // El CSS escrito a mano en Avanzado, con su propia clase.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const SelectedIcon = IconMap[icon] || Search;

  return (
    <>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        // El buscador responde al clic por si mismo: el cursor de mano lo avisa
        // mientras se edita, aunque ahi el clic solo sirva para seleccionarlo.
        clickable
        className={`inline-flex h-fit w-fit ${customCssClass} ${customClass} ${visClass}`}
      >
        <button
          type="button"
          className={`relative flex items-center justify-center ${borde.className} ${medidas.className} ${letra.className}`}
          onClick={() => {
            if (!enabled) openSearch();
          }}
          aria-label="Buscar"
        >
          <SelectedIcon className="h-4 w-4" />
        </button>
      </SelectableNode>
    </>
  );
}

function EditableSearchSettings() {
  const {
    actions: { setProp },
    icon,
    customClass,
    customCss,
    nodeProps,
  } = useNode((node) => ({
    icon: node.data.props.icon,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
    nodeProps: node.data.props as EditableSearchProps,
  }));

  // Los mismos bordes y relleno anteriores que pinta el render.
  const borderLegacy = borderLegacyOf(nodeProps);
  const spacingLegacy = spacingLegacyOf(nodeProps);

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Icono</Label>
            <Select
              value={icon}
              onValueChange={(val) =>
                setProp((props: EditableSearchProps) => (props.icon = val as IconName))
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="search">Buscar</SelectItem>
                <SelectItem className="text-[12px]" value="searchCheck">Buscar (check)</SelectItem>
                <SelectItem className="text-[12px]" value="searchX">Buscar (x)</SelectItem>
                <SelectItem className="text-[12px]" value="zoomIn">Lupa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      {/* El boton no tiene letra: solo un SVG de lucide con el tamaño atado a
          su clase (`h-4 w-4`), y de la tipografia hereda el `color` y nada mas.
          Los demas campos no pintarian nada, asi que no se enseñan. */}
      <TypographySection
        legacy={typographyLegacyOf(nodeProps)}
        fields={{
          fontFamily: false,
          fontWeight: false,
          size: false,
          lineHeight: false,
          letterSpacing: false,
          textAlign: false,
        }}
      />

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={borderLegacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableSearchProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableSearchProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableSearch.craft = {
  displayName: "Buscador",
  props: {
    icon: "search",
    color: undefined,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: 0,
    borderColor: undefined,
    borderStyle: "solid" as const,
    radiusTopLeft: 0,
    radiusTopRight: 0,
    radiusBottomLeft: 0,
    radiusBottomRight: 0,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableSearchSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
