import { useId, useState, useEffect } from "react"
import { useNode, useEditor } from "@craftjs/core"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/utils"
import { listPages, type VisualEditListItem } from "@/modules/ecommerce/editor/lib/editor-store"
import { BlockRenderer } from "@/modules/ecommerce/editor/components/block-renderer"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import { LinkSection } from "@/modules/ecommerce/editor/components/link-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"

interface EditableMegaMenuProps {
    buttonText?: string
    href?: string
    openInNewTab?: boolean
    selectedBlockSlug?: string
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
    size?: "sm" | "default" | "lg"
    widthMobile?: number
    fullWidth?: boolean
    menuGap?: number
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    /** Bordes del boton disparador. Ver BorderSection. */
    borderStyle?: BorderStyle
    borderColor?: string
    /**
     * Medidas y letra por modo de pantalla; las escriben sus secciones. La letra
     * es la del disparador: el bloque del desplegable trae la suya.
     */
    [key: string]: unknown
}

// El ancho en celular que el bloque guardaba como porcentaje, para que la
// seccion "Tamaño y espaciado" lo enseñe y lo migre al primer cambio.
function spacingLegacyOf(props: { widthMobile?: number }): SpacingLegacy {
    const { widthMobile = 100 } = props
    return { width: { mobile: { value: widthMobile, unit: "%", custom: "" } } }
}

export function EditableMegaMenu(props: EditableMegaMenuProps) {
    const {
        buttonText = "Menú",
        href = "",
        openInNewTab = false,
        selectedBlockSlug = "",
        variant = "default",
        size = "default",
        fullWidth = false,
        menuGap = 8,
        customClass = "",
        customCss,
        hiddenOnDesktop = false,
        hiddenOnTablet = false,
        hiddenOnMobile = false,
    } = props
    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))

    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })

    const id = useId()
    const megaMenuClass = `editable-mega-menu-${id.replace(/:/g, "")}`
    const [isOpen, setIsOpen] = useState(false)

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la
    // del componente, para que el usuario pueda pisar sus reglas.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)
    // Los bordes van en el boton disparador, no en el contenedor.
    const borde = useBorderCss(props as Record<string, unknown>)
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))
    // La letra, tambien en el disparador y por el mismo motivo de siempre, mas
    // uno propio: el desplegable es un bloque reutilizable con su tipografia, y
    // colgar la clase del contenedor se la pisaria por herencia. Sin legado: el
    // megamenu nunca guardo letra propia; `variant` y `size` son del boton.
    const letra = useTypographyCss(props as Record<string, unknown>)

    return (
        <>
        {visibilityJsx}
        {customCssTag}
        {borde.styleTag}
        {medidas.styleTag}
        {letra.styleTag}
        <SelectableNode
            clickable
            className={cn(
                "h-fit w-fit",
                megaMenuClass,
                customCssClass,
                customClass,
                visClass,
            )}
        >
            <div
                className="relative group"
                onMouseEnter={() => !enabled && setIsOpen(true)}
                onMouseLeave={() => !enabled && setIsOpen(false)}
            >
                <Button
                    asChild
                    variant={variant}
                    size={size}
                    className={cn(
                        "mega-menu-trigger flex items-center gap-2",
                        borde.className,
                        medidas.className,
                        letra.className,
                    )}
                >
                    <a
                        href={href || undefined}
                        target={openInNewTab ? "_blank" : undefined}
                        rel={openInNewTab ? "noreferrer noopener" : undefined}
                        onClick={(e) => {
                            if (enabled || !href) {
                                e.preventDefault()
                            }
                        }}
                    >
                        {buttonText}
                        <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen ? "rotate-180" : ""
                        )} />
                    </a>
                </Button>

                {/* Dropdown Menu Content */}
                {selectedBlockSlug && !enabled && (
                    <div
                        className={cn(
                            "bg-white border rounded-lg shadow-lg z-50 p-4 transition-all duration-200",
                            fullWidth
                                ? "fixed left-0 right-0 w-full rounded-none"
                                : "absolute top-full left-0 min-w-max",
                            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                        )}
                        style={{
                            marginTop: `${menuGap}px`,
                        }}
                    >
                        <BlockRenderer slug={selectedBlockSlug} />
                    </div>
                )}

                {/* Preview in edit mode */}
                {selectedBlockSlug && enabled && (
                    <div className="absolute top-full left-0 mt-2 min-w-max bg-gray-100 border border-dashed border-gray-300 rounded-lg p-2 text-xs text-gray-600 pointer-events-none">
                        Bloque: {selectedBlockSlug}
                    </div>
                )}
            </div>
        </SelectableNode>
        </>
    )
}

function EditableMegaMenuSettings() {
    const {
        actions: { setProp },
        buttonText,
        selectedBlockSlug,
        variant,
        size,
        widthMobile,
        fullWidth,
        menuGap,
        customClass,
        customCss,
    } = useNode((node) => ({
        buttonText: node.data.props.buttonText,
        selectedBlockSlug: node.data.props.selectedBlockSlug,
        variant: node.data.props.variant,
        size: node.data.props.size,
        widthMobile: node.data.props.widthMobile,
        fullWidth: node.data.props.fullWidth,
        menuGap: node.data.props.menuGap,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    const [blocks, setBlocks] = useState<VisualEditListItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadBlocks() {
            try {
                const pages = await listPages()
                const blocksList = pages.filter((page) => page.type === "block")
                setBlocks(blocksList)
            } catch (error) {
                console.error("Error loading blocks:", error)
            } finally {
                setLoading(false)
            }
        }
        loadBlocks()
    }, [])

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Texto del Botón</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            value={buttonText}
                            onChange={(e) =>
                                setProp((props: EditableMegaMenuProps) => (props.buttonText = e.target.value))
                            }
                        />
                    </div>
                </div>
            </SettingsSection>

            <LinkSection placeholder="ej: /productos" />

            <SettingsSection title="Menú desplegable">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Bloque a Mostrar</Label>
                        <Select
                            value={selectedBlockSlug || ""}
                            onValueChange={(val) =>
                                setProp((props: EditableMegaMenuProps) => (props.selectedBlockSlug = val))
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue placeholder={loading ? "Cargando bloques..." : "Selecciona un bloque"} />
                            </SelectTrigger>
                            <SelectContent>
                                {blocks.map((block) => (
                                    <SelectItem className="text-[12px]" key={block.id} value={block.slug}>
                                        {block.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Ancho del Dropdown</Label>
                        <Select
                            value={fullWidth ? "fullwidth" : "normal"}
                            onValueChange={(val) =>
                                setProp((props: EditableMegaMenuProps) => (props.fullWidth = val === "fullwidth"))
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="text-[12px]" value="normal">Ancho Normal (como aparece)</SelectItem>
                                <SelectItem className="text-[12px]" value="fullwidth">Ancho Completo (pantalla completa)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Distancia entre Botón y Menú (px)</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            type="number"
                            value={menuGap}
                            min={0}
                            max={100}
                            onChange={(e) =>
                                setProp(
                                    (props: EditableMegaMenuProps) =>
                                        (props.menuGap = parseInt(e.target.value) || 0)
                                )
                            }
                        />
                    </div>
                </div>
            </SettingsSection>

            {/* Del disparador, no del desplegable: el bloque que se despliega se
                pinta aparte y lleva la tipografia que tenga guardada. */}
            <TypographySection title="Tipografía del botón" />

            <SettingsSection title="Apariencia">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Variante</Label>
                        <Select
                            value={variant}
                            onValueChange={(val) =>
                                setProp((props: EditableMegaMenuProps) => (props.variant = val as any))
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="text-[12px]" value="default">Default</SelectItem>
                                <SelectItem className="text-[12px]" value="secondary">Secondary</SelectItem>
                                <SelectItem className="text-[12px]" value="outline">Outline</SelectItem>
                                <SelectItem className="text-[12px]" value="ghost">Ghost</SelectItem>
                                <SelectItem className="text-[12px]" value="destructive">Destructive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Tamaño</Label>
                        <Select
                            value={size}
                            onValueChange={(val) =>
                                setProp((props: EditableMegaMenuProps) => (props.size = val as any))
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="text-[12px]" value="sm">Small</SelectItem>
                                <SelectItem className="text-[12px]" value="default">Medium</SelectItem>
                                <SelectItem className="text-[12px]" value="lg">Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf({ widthMobile })} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditableMegaMenuProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableMegaMenuProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableMegaMenu.craft = {
    displayName: "Megamenú",
    props: {
        buttonText: "Menú",
        href: "",
        openInNewTab: false,
        selectedBlockSlug: "",
        variant: "default",
        size: "default",
        widthMobile: 100,
        fullWidth: false,
        menuGap: 8,
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },

    related: {
        settings: EditableMegaMenuSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
