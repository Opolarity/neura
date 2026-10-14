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
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section";
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node";
import {
  LinkSection,
  popupDataAttributes,
  popupTargetOf,
  type PopupLinkAction,
} from "@/modules/ecommerce/editor/components/link-section";
import {
  BorderSection,
  uniformSides,
  useBorderCss,
  type BorderLegacy,
} from "@/modules/ecommerce/editor/components/border-section";
import {
  SpacingSection,
  measureFromCss,
  useSpacingCss,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section";
import { RADIUS_CORNER_KEYS, type BorderStyle } from "@/modules/ecommerce/editor/components/box-measures";

interface EditableImageProps {
  src: string;
  alt: string;
  href?: string;
  /** Sin valor es "url", como las ya publicadas. Ver LinkSection. */
  linkType?: "url" | "popup";
  popupSlug?: string;
  popupAction?: PopupLinkAction;
  /**
   * @deprecated El ancho como texto CSS, un solo valor para los tres modos.
   * Se sigue leyendo porque lo traen las imagenes ya publicadas; hoy el
   * ancho va por modo (ver SpacingSection) y esto solo alimenta su
   * `legacy`.
   */
  width?: string;
  /** @deprecated Mismo motivo que `width`. */
  height?: string;
  objectFit?: "cover" | "contain" | "fill";
  /**
   * @deprecated El radio uniforme anterior. Mismo motivo que `width`, con
   * el `legacy` de BorderSection.
   */
  borderRadius?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  openInNewTab?: boolean;
  customClass?: string;
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string;
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;
  /** Bordes por modo de pantalla; los escribe BorderSection. */
  [key: string]: unknown;
}

// El radio unico del formato anterior, para que el render lo siga pintando y
// la seccion lo enseñe y migre al primer cambio. Render y panel lo llaman con
// las mismas props para ver lo mismo.
function borderLegacyOf({ borderRadius = 0 }: EditableImageProps): BorderLegacy {
  return {
    radius: uniformSides(RADIUS_CORNER_KEYS, borderRadius),
    radiusValueFor: () => borderRadius,
  };
}

// El ancho y el alto del formato anterior, un texto CSS que valia para los
// tres modos ("100%", "300px", "auto"; un "rem" cae en texto libre), para que
// el render los siga pintando y la seccion los enseñe y migre al primer cambio.
function spacingLegacyOf({ width = "100%", height = "300px" }: EditableImageProps): SpacingLegacy {
  return {
    width: {
      desktop: measureFromCss(width),
      tablet: measureFromCss(width),
      mobile: measureFromCss(width),
    },
    height: {
      desktop: measureFromCss(height),
      tablet: measureFromCss(height),
      mobile: measureFromCss(height),
    },
  };
}

export function EditableImage(props: EditableImageProps) {
  const {
    src,
    alt,
    href = "#",
    linkType = "url",
    popupSlug,
    popupAction,
    objectFit = "cover",
    openInNewTab = false,
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

  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile });

  // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
  // usuario pueda apuntar al componente desde el campo de CSS libre.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss);

  const popup = popupTargetOf({ linkType, popupSlug, popupAction });

  const image = (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit,
        display: "block",
      }}
    />
  );

  return (
    <>
    {visibilityJsx}
    {customCssTag}
    {borde.styleTag}
    {medidas.styleTag}
    <SelectableNode
      clickable
      className={`${borde.className} ${medidas.className} ${visClass} ${customCssClass} ${customClass}`}
      style={{ overflow: "hidden" }}
    >
      {/* El tamaño lo lleva el contenedor (medidas); el enlace y la imagen
          lo ocupan entero. */}
      {linkType === "popup" ? (
        // Un <button> de verdad, sin estilos propios. Sin popup elegido no
        // hace nada, y en el editor no lleva la accion: el clic selecciona.
        <button
          type="button"
          className="m-0 block w-full cursor-pointer border-0 bg-transparent p-0"
          style={{ height: "100%" }}
          {...(popup && !enabled ? popupDataAttributes(popup) : {})}
        >
          {image}
        </button>
      ) : (
        <a
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noreferrer noopener" : undefined}
          style={{ display: "block", height: "100%" }}
          onClick={(e) => {
            if (enabled) e.preventDefault();
          }}
        >
          {image}
        </a>
      )}
    </SelectableNode>
    </>
  );
}

function EditableImageSettings() {
  const {
    actions: { setProp },
    src,
    alt,
    objectFit,
    customClass,
    customCss,
    nodeProps,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    objectFit: node.data.props.objectFit,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
    nodeProps: node.data.props as EditableImageProps,
  }));

  // El mismo radio y las mismas medidas anteriores que pinta el render.
  const borderLegacy = borderLegacyOf(nodeProps);
  const spacingLegacy = spacingLegacyOf(nodeProps);

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">URL de la imagen</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              value={src}
              onChange={(e) =>
                setProp((props: EditableImageProps) => (props.src = e.target.value))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Texto alternativo</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              value={alt}
              onChange={(e) =>
                setProp((props: EditableImageProps) => (props.alt = e.target.value))
              }
            />
          </div>
        </div>
      </SettingsSection>

      {/* La misma seccion que Boton, Contenedor e Icono: mismas props (href,
          linkType, openInNewTab), mas el tipo "Popup". */}
      <LinkSection linkTypes={["url", "popup"]} />

      <SettingsSection title="Apariencia">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Ajuste de imagen</Label>
            <Select
              value={objectFit}
              onValueChange={(val) =>
                setProp(
                  (props: EditableImageProps) =>
                    (props.objectFit = val as EditableImageProps["objectFit"]),
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="cover">Cubrir</SelectItem>
                <SelectItem className="text-[12px]" value="contain">Contener</SelectItem>
                <SelectItem className="text-[12px]" value="fill">Rellenar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={borderLegacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableImageProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableImageProps) => (props.customCss = val))
        }
      />
    </div>
  );
}

EditableImage.craft = {
  displayName: "Imagen",
  props: {
    src: "/images/hero-banner.jpg",
    alt: "Imagen",
    width: "100%",
    height: "auto",
    objectFit: "cover" as const,
    borderRadius: 0,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    openInNewTab: false,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableImageSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
};
