import { useNode, useEditor } from "@craftjs/core";
import { useRouter } from "@/modules/ecommerce/editor/tienda/next-navigation";
import {
  User,
  UserRound,
  CircleUserRound,
  CircleUser,
  SquareUserRound,
  SquareUser,
} from "lucide-react";
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
import { useAuth } from "@/modules/ecommerce/editor/tienda/auth-provider";

const IconMap = {
  user: User,
  userRound: UserRound,
  circleUserRound: CircleUserRound,
  circleUser: CircleUser,
  squareUserRound: SquareUserRound,
  squareUser: SquareUser,
};

type IconName = keyof typeof IconMap;

interface EditableAccountProps {
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
function spacingLegacyOf(p: EditableAccountProps): SpacingLegacy {
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
function borderLegacyOf(p: EditableAccountProps): BorderLegacy {
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
function typographyLegacyOf(props: EditableAccountProps): TypographyLegacy {
  return { textColor: props.color };
}

export function EditableAccount(props: EditableAccountProps) {
  const {
    icon = "user",
    paddingLeft = 8,
    paddingRight = 8,
    paddingTop = 8,
    paddingBottom = 8,
    borderLeft = 8,
    borderRight = 8,
    borderTop = 8,
    borderBottom = 8,
    radiusTopLeft = 8,
    radiusTopRight = 8,
    radiusBottomLeft = 8,
    radiusBottomRight = 8,
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

  const { user } = useAuth();
  const router = useRouter();

  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  });

  // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
  // usuario pueda pisar lo que aplica el componente.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const SelectedIcon = IconMap[icon] || User;

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
            if (!enabled) router.push(user ? "/cuenta" : "/login");
          }}
          aria-label="Mi cuenta"
        >
          <SelectedIcon className="h-4 w-4" />
        </button>
      </SelectableNode>
    </>
  );
}

function EditableAccountSettings() {
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
    customClass: node.data.props.customClass,
    customCss: node.data.props.customCss,
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
                setProp((props: EditableAccountProps) => (props.icon = val as IconName))
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="user">Usuario</SelectItem>
                <SelectItem className="text-[12px]" value="userRound">Usuario Redondo</SelectItem>
                <SelectItem className="text-[12px]" value="circleUserRound">Usuario Circular Redondo</SelectItem>
                <SelectItem className="text-[12px]" value="circleUser">Usuario Circular</SelectItem>
                <SelectItem className="text-[12px]" value="squareUserRound">Usuario Cuadrado Redondo</SelectItem>
                <SelectItem className="text-[12px]" value="squareUser">Usuario Cuadrado</SelectItem>
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
          setProp((props: EditableAccountProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableAccountProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableAccount.craft = {
  displayName: "Cuenta",
  props: {
    icon: "user",
    color: undefined,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderLeft: 8,
    borderRight: 8,
    borderTop: 8,
    borderBottom: 8,
    borderStyle: "solid" as const,
    borderColor: "#0000",
    radiusTopLeft: 8,
    radiusTopRight: 8,
    radiusBottomLeft: 8,
    radiusBottomRight: 8,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableAccountSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};

export default EditableAccount;
