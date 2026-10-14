import { useNode, useEditor } from "@craftjs/core";
import { ShoppingBag, ShoppingCart, ShoppingBasket, Handbag } from "lucide-react";
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
import { type BorderStyle } from "@/modules/ecommerce/editor/components/box-measures";
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style";
import { useCart } from "@/modules/ecommerce/editor/tienda/cart-store";

const IconMap = {
  shoppingBag: ShoppingBag,
  shoppingCart: ShoppingCart,
  shoppingBasket: ShoppingBasket,
  handbag: Handbag,
};

type IconName = keyof typeof IconMap;

interface EditableCartProps {
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
  borderStyle?: BorderStyle;
  borderColor?: string;
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

// El relleno del formato anterior (`paddingLeft`, `paddingTop`...), con el
// mismo 8 por defecto que aplicaba el boton, para que la seccion "Tamaño y
// espaciado" lo enseñe y lo migre al primer cambio.
function spacingLegacyOf(p: EditableCartProps): SpacingLegacy {
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

// Los bordes del formato anterior (`borderLeft`, `radiusTopLeft`...), para que
// la seccion los enseñe y los migre al primer cambio, y para que el render los
// siga pintando mientras tanto. Se lee de las props del nodo en los dos sitios.
function borderLegacyOf(p: EditableCartProps): BorderLegacy {
  return {
    width: {
      sides: {
        Top: p.borderTop,
        Right: p.borderRight,
        Bottom: p.borderBottom,
        Left: p.borderLeft,
      },
      unit: "px",
      custom: "",
    },
    widthValueFor: (s) => p[`border${s}`],
    radius: {
      sides: {
        TopLeft: p.radiusTopLeft,
        TopRight: p.radiusTopRight,
        BottomLeft: p.radiusBottomLeft,
        BottomRight: p.radiusBottomRight,
      },
      unit: "px",
      custom: "",
    },
    radiusValueFor: (c) => p[`radius${c}`],
  };
}

/**
 * El color que el bloque guardaba como "Color del icono". Es el color del
 * bloque entero —el SVG no tiene color propio, hereda el del boton—, asi que la
 * seccion de tipografia lo lee de legado y lo pisa `textColor` al primer cambio.
 */
function typographyLegacyOf(props: EditableCartProps): TypographyLegacy {
  return { textColor: props.color };
}

export function EditableCart(props: EditableCartProps) {
  const {
    icon = "shoppingBag",
    paddingLeft = 8,
    paddingRight = 8,
    paddingTop = 8,
    paddingBottom = 8,
    borderLeft = 0,
    borderRight = 0,
    borderTop = 0,
    borderBottom = 0,
    radiusTopLeft = 0,
    radiusTopRight = 0,
    radiusBottomLeft = 0,
    radiusBottomRight = 0,
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
  } = props;
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const legacy = borderLegacyOf({
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomLeft,
    radiusBottomRight,
  });
  const borde = useBorderCss(props as Record<string, unknown>, legacy);
  const medidas = useSpacingCss(
    props as Record<string, unknown>,
    spacingLegacyOf({ paddingLeft, paddingRight, paddingTop, paddingBottom }),
  );
  // La letra del bloque. El legado es `color`, el viejo "Color del icono":
  // como el SVG hereda el `color` del boton, pintarlo aparte era pintar dos
  // veces la misma propiedad, y la de la seccion perdia por ir en una clase.
  const letra = useTypographyCss(
    props as Record<string, unknown>,
    typographyLegacyOf(props),
  );

  const { count, openDrawer } = useCart();

  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  });

  // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
  // usuario pueda apuntar a este componente en concreto.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const SelectedIcon = IconMap[icon] || ShoppingBag;

  return (
    <>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        clickable
        className={`inline-flex h-fit w-fit ${visClass} ${customCssClass} ${customClass}`}
      >
        <button
          type="button"
          className={`relative flex items-center justify-center ${borde.className} ${medidas.className} ${letra.className}`}
          onClick={() => {
            if (!enabled) openDrawer();
          }}
          aria-label="Carrito de compras"
        >
          <SelectedIcon className="h-4 w-4" />
          {count > 0 && (
            // El contador se queda fuera de la tipografia del bloque a
            // proposito: su color es el de contraste contra `bg-primary`, y el
            // tamaño lo ata el circulo que lo envuelve. Heredar el color del
            // icono podria dejar el numero ilegible sobre el fondo primario.
            <span
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
              {count}
            </span>
          )}
        </button>
      </SelectableNode>
    </>
  );
}

function EditableCartSettings() {
  const {
    actions: { setProp },
    icon,
    color,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomLeft,
    radiusBottomRight,
    customClass,
    customCss,
  } = useNode((node) => ({
    icon: node.data.props.icon,
    color: node.data.props.color,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    borderLeft: node.data.props.borderLeft,
    borderRight: node.data.props.borderRight,
    borderTop: node.data.props.borderTop,
    borderBottom: node.data.props.borderBottom,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    radiusBottomRight: node.data.props.radiusBottomRight,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }));

  const legacy = borderLegacyOf({
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomLeft,
    radiusBottomRight,
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
            <Label className="text-[11px] text-foreground/80">Icono</Label>
            <Select
              value={icon}
              onValueChange={(val) =>
                setProp((props: EditableCartProps) => (props.icon = val as IconName))
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="shoppingBag">Bolsa de compras</SelectItem>
                <SelectItem className="text-[12px]" value="shoppingCart">Carrito de compras</SelectItem>
                <SelectItem className="text-[12px]" value="shoppingBasket">Canasta de compras</SelectItem>
                <SelectItem className="text-[12px]" value="handbag">Bolso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      {/* El boton no tiene letra: solo un SVG de lucide con el tamaño atado a
          su clase (`h-4 w-4`), y de la tipografia hereda el `color` y nada mas.
          Los demas campos no pintarian nada, asi que no se enseñan. */}
      <TypographySection
        legacy={typographyLegacyOf({ color })}
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

      <BorderSection legacy={legacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableCartProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableCartProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableCart.craft = {
  displayName: "Carrito",
  props: {
    icon: "shoppingBag",
    color: undefined,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: 0,
    borderStyle: "solid" as const,
    borderColor: undefined,
    radiusTopLeft: 0,
    radiusTopRight: 0,
    radiusBottomLeft: 0,
    radiusBottomRight: 0,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableCartSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
