import { useNode } from "@craftjs/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useEditorVideo } from "@/modules/ecommerce/editor/hooks/use-editor-video"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
    SpacingSection,
    measureFromCss,
    useSpacingCss,
    type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

interface EditableVideoProps {
    src: string
    autoplay?: boolean
    muted?: boolean
    controls?: boolean
    loop?: boolean
    /**
     * @deprecated El ancho como texto CSS, un solo valor para los tres
     * modos. Se sigue leyendo porque lo traen los videos ya publicados; hoy
     * el ancho va por modo (ver SpacingSection) y esto solo alimenta su
     * `legacy`.
     */
    width?: string
    /** @deprecated Mismo motivo que `width`. */
    height?: string
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    borderStyle?: BorderStyle
    borderColor?: string
    /** Grosores y radios de borde por modo de pantalla. Ver BorderSection. */
    [key: string]: unknown
}

// El ancho y el alto del formato anterior: un texto CSS ("100%", "auto") que
// valia para los tres modos. La seccion los enseña y los migra al primer
// cambio; el render los sigue pintando mientras tanto.
function spacingLegacyOf(props: Record<string, unknown>): SpacingLegacy {
    const width = measureFromCss((props.width as string | undefined) ?? "100%")
    const height = measureFromCss((props.height as string | undefined) ?? "auto")
    return {
        width: { desktop: width, tablet: width, mobile: width },
        height: { desktop: height, tablet: height, mobile: height },
    }
}

export function EditableVideo(props: EditableVideoProps) {
    const {
    src,
    autoplay = false,
    muted = false,
    controls = true,
    loop = false,
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
    } = props
    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })
    // Los bordes del bloque, en el envoltorio del <video>. Ver BorderSection.
    const borde = useBorderCss(props as Record<string, unknown>)
    // Las medidas por modo, en el mismo envoltorio. Ver SpacingSection.
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))
    // El CSS escrito a mano en Avanzado. Lleva su propia clase para poder
    // apuntarle reglas solo a este bloque.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)
    // Se le pasa la propiedad del usuario: un video configurado sin autoplay
    // tampoco debe arrancar al pasar a Preview.
    const { videoRef, canAutoPlay } = useEditorVideo(autoplay)

    return (
        <>
        {visibilityJsx}
        {customCssTag}
        {borde.styleTag}
        {medidas.styleTag}
        <SelectableNode
            className={`${borde.className} ${medidas.className} ${visClass} ${customCssClass} ${customClass}`}
        >
            <video
                ref={videoRef}
                src={src}
                // La propiedad del usuario se respeta, pero solo fuera del editor.
                autoPlay={autoplay && canAutoPlay}
                muted={muted}
                controls={controls}
                loop={loop}
                // El tamaño lo lleva el envoltorio; el video lo llena.
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </SelectableNode>
        </>
    )
}

function EditableVideoSettings() {
    const {
        actions: { setProp },
        src,
        autoplay,
        muted,
        controls,
        loop,
        customClass,
        customCss,
        bag,
    } = useNode((node) => ({
        bag: node.data.props as Record<string, unknown>,
        src: node.data.props.src,
        autoplay: node.data.props.autoplay,
        muted: node.data.props.muted,
        controls: node.data.props.controls,
        loop: node.data.props.loop,
        customClass: node.data.props.customClass,
        customCss: node.data.props.customCss,
    }))

    return (
        <div className="flex flex-col">
        <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">URL del video</Label>
                    <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={src}
                        onChange={(e) =>
                            setProp(
                                (props: EditableVideoProps) =>
                                    (props.src = e.target.value)
                            )
                        }
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={autoplay}
                        onChange={(e) =>
                            setProp(
                                (props: EditableVideoProps) =>
                                    (props.autoplay = e.target.checked)
                            )
                        }
                    />
                    <Label className="text-[11px] text-foreground/80">Autoplay</Label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={muted}
                        onChange={(e) =>
                            setProp(
                                (props: EditableVideoProps) =>
                                    (props.muted = e.target.checked)
                            )
                        }
                    />
                    <Label className="text-[11px] text-foreground/80">Silenciado</Label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={controls}
                        onChange={(e) =>
                            setProp(
                                (props: EditableVideoProps) =>
                                    (props.controls = e.target.checked)
                            )
                        }
                    />
                    <Label className="text-[11px] text-foreground/80">Controles</Label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={loop}
                        onChange={(e) =>
                            setProp(
                                (props: EditableVideoProps) =>
                                    (props.loop = e.target.checked)
                            )
                        }
                    />
                    <Label className="text-[11px] text-foreground/80">Loop</Label>
                </div>
            </div>
        </SettingsSection>

        <SpacingSection legacy={spacingLegacyOf(bag)} />

        <BorderSection />

        <AdvancedSection
            customClass={customClass ?? ""}
            onCustomClassChange={(val) =>
                setProp((props: EditableVideoProps) => (props.customClass = val))
            }
            customCss={customCss ?? ""}
            onCustomCssChange={(val) =>
                setProp((props: EditableVideoProps) => (props.customCss = val))
            }
        />
        </div>
    )
}

EditableVideo.craft = {
    displayName: "Video",
    props: {
        src: "",
        autoplay: false,
        muted: false,
        controls: true,
        loop: false,
        width: "100%",
        height: "auto",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
        borderStyle: "solid" as const,
        borderColor: "transparent",
    },
    related: {
        settings: EditableVideoSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
