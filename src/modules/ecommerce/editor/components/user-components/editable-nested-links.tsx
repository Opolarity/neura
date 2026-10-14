import { useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { ChevronDown, Plus, Trash2, CornerDownRight } from "lucide-react"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Button } from "@/components/ui/button"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import {
    TypographySection,
    useTypographyCss,
    type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FontFamilySelect } from "@/modules/ecommerce/editor/components/user-components/font-family-select"
import { fontFamilyMap, type FontFamily } from "@/modules/ecommerce/editor/lib/font-families"

// ── Types ──────────────────────────────────────────────

interface NavLink {
    id: string
    label: string
    url: string
    openInNewTab: boolean
    className?: string
    fontFamily?: FontFamily
    fontSize?: number
    fontWeight?: string
    children: NavLink[]
}

interface EditableNestedLinksProps {
    links?: NavLink[]
    /** Color del texto del arbol. Ya es el nombre canonico de TypographySection. */
    textColor?: string
    /**
     * @deprecated El tamaño lo guarda ahora `size{Modo}` (ver TypographySection).
     * Se sigue leyendo, por `legacy`, para que las paginas ya publicadas —que no
     * traen las props nuevas— se sigan viendo igual.
     */
    fontSize?: number
    gap?: number
    indentSize?: number
    background?: string
    /**
     * @deprecated El relleno por lado, sin modo de pantalla. Se sigue leyendo
     * porque lo traen las paginas ya publicadas y solo alimenta el `legacy` de
     * SpacingSection.
     */
    paddingTop?: number
    /** @deprecated Mismo motivo que `paddingTop`. */
    paddingRight?: number
    /** @deprecated Mismo motivo que `paddingTop`. */
    paddingBottom?: number
    /** @deprecated Mismo motivo que `paddingTop`. */
    paddingLeft?: number
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    /** Bordes del contenedor. Ver BorderSection. */
    borderStyle?: BorderStyle
    borderColor?: string
    [key: string]: unknown
}

// ── Helpers ────────────────────────────────────────────

function generateId(): string {
    return Math.random().toString(36).slice(2, 9)
}

function makeLink(label = "Nuevo Link"): NavLink {
    return { id: generateId(), label, url: "", openInNewTab: false, className: "", fontFamily: "sans", fontSize: undefined, fontWeight: undefined, children: [] }
}

function addLink(links: NavLink[], parentId: string | null, newLink: NavLink): NavLink[] {
    if (parentId === null) return [...links, newLink]
    return links.map((link) => {
        if (link.id === parentId) {
            return { ...link, children: [...link.children, newLink] }
        }
        return { ...link, children: addLink(link.children, parentId, newLink) }
    })
}

function removeLink(links: NavLink[], id: string): NavLink[] {
    return links
        .filter((link) => link.id !== id)
        .map((link) => ({ ...link, children: removeLink(link.children, id) }))
}

function updateLink(links: NavLink[], id: string, updates: Partial<Omit<NavLink, "children" | "id">>): NavLink[] {
    return links.map((link) => {
        if (link.id === id) return { ...link, ...updates }
        return { ...link, children: updateLink(link.children, id, updates) }
    })
}

// ── Recursive link renderer (view) ─────────────────────

function NavLinkItem({
    link,
    gap,
    indentSize,
    depth,
    enabled,
}: {
    link: NavLink
    gap: number
    indentSize: number
    depth: number
    enabled: boolean
}) {
    const [open, setOpen] = useState(false)
    const hasChildren = link.children && link.children.length > 0

    // Solo la letra propia del enlace. La del bloque la pone el contenedor del
    // arbol y estos la heredan: escribirla tambien aqui la duplicaria y, al ser
    // un estilo en linea, le ganaria al <style> de la seccion.
    const linkStyle = {
        fontSize: link.fontSize,
        fontWeight: link.fontWeight ?? undefined,
        fontFamily: link.fontFamily ? fontFamilyMap[link.fontFamily] : undefined,
    }

    return (
        <div style={{ paddingLeft: depth > 0 ? indentSize : 0 }}>
            <div className="flex items-center" style={{ marginBottom: gap / 2, marginTop: gap / 2 }}>
                {hasChildren ? (
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className={`flex items-center gap-1 hover:opacity-70 transition-opacity text-left w-full${link.className ? ` ${link.className}` : ""}`}
                        style={linkStyle}
                    >
                        {link.label}
                        <ChevronDown
                            className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200"
                            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                    </button>
                ) : (
                    <a
                        href={link.url || "#"}
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        className={`hover:opacity-70 transition-opacity${link.className ? ` ${link.className}` : ""}`}
                        style={linkStyle}
                        onClick={(e) => { if (enabled) e.preventDefault() }}
                    >
                        {link.label}
                    </a>
                )}
            </div>
            {hasChildren && open && (
                <div
                    className="border-l border-current/20 ml-1"
                    style={{ paddingLeft: indentSize }}
                >
                    {link.children.map((child) => (
                        <NavLinkItem
                            key={child.id}
                            link={child}
                            gap={gap}
                            indentSize={indentSize}
                            depth={depth + 1}
                            enabled={enabled}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Default data ───────────────────────────────────────

const defaultLinks: NavLink[] = [
    {
        id: "root-1",
        label: "Categorías",
        url: "",
        openInNewTab: false,
        children: [
            { id: "child-1-1", label: "Ropa de Mujer", url: "/tienda?categoria=mujer", openInNewTab: false, children: [] },
            { id: "child-1-2", label: "Ropa de Hombre", url: "/tienda?categoria=hombre", openInNewTab: false, children: [] },
            { id: "child-1-3", label: "Accesorios", url: "/tienda?categoria=accesorios", openInNewTab: false, children: [] },
        ],
    },
    {
        id: "root-2",
        label: "Nosotros",
        url: "",
        openInNewTab: false,
        children: [
            { id: "child-2-1", label: "Quiénes somos", url: "/nosotros", openInNewTab: false, children: [] },
            { id: "child-2-2", label: "Contacto", url: "/contacto", openInNewTab: false, children: [] },
        ],
    },
]

// El relleno de cuatro lados que el bloque guardaba con sus propios nombres,
// para que la seccion "Tamaño y espaciado" lo enseñe y lo migre al primer
// cambio.
function spacingLegacyOf(props: {
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
}): SpacingLegacy {
    const { paddingTop = 12, paddingRight = 16, paddingBottom = 12, paddingLeft = 16 } = props
    return {
        padding: {
            sides: { Top: paddingTop, Right: paddingRight, Bottom: paddingBottom, Left: paddingLeft },
            unit: "px",
            custom: "",
        },
    }
}

// La letra que el bloque guardaba con sus propios nombres, por el mismo motivo
// que el relleno. Los valores por defecto son los de la firma del componente,
// para que una pagina publicada sin nada guardado no cambie de aspecto.
//
// Solo hay dos: el arbol nunca aplico una fuente ni un grosor a nivel de bloque
// —esos viven en cada enlace— asi que no hay nada viejo que migrar de ellos.
function typographyLegacyOf(props: {
    fontSize?: number
    textColor?: string
}): TypographyLegacy {
    return {
        size: { desktop: { value: props.fontSize ?? 14, unit: "px", custom: "" } },
        textColor: props.textColor ?? "#111827",
    }
}

// ── Main Component ─────────────────────────────────────

export function EditableNestedLinks(props: EditableNestedLinksProps) {
    const {
        links = defaultLinks,
        textColor = "#111827",
        fontSize = 14,
        gap = 8,
        indentSize = 16,
        background = "transparent",
        customClass = "",
        customCss,
        hiddenOnDesktop = false,
        hiddenOnTablet = false,
        hiddenOnMobile = false,
    } = props
    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })

    // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
    // usuario pueda apuntar al componente desde el campo de CSS libre.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)
    const borde = useBorderCss(props as Record<string, unknown>)
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

    // Letra de la seccion general del panel (ver TypographySection). Es la base
    // del arbol: va en el contenedor del que cuelgan los enlaces, y cada uno la
    // hereda salvo que traiga la suya.
    const letra = useTypographyCss(
        props as Record<string, unknown>,
        typographyLegacyOf({ fontSize, textColor }),
    )

    return (
        <>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode
                className={`w-full transition-all duration-200 ${visClass} ${customCssClass} ${customClass} ${borde.className} ${medidas.className}`}
                style={{ background }}
            >
                {links.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-muted rounded-xl">
                        <p className="text-muted-foreground text-sm">Agrega links desde el panel lateral.</p>
                    </div>
                ) : (
                    <div className={letra.className}>
                        {links.map((link) => (
                            <NavLinkItem
                                key={link.id}
                                link={link}
                                gap={gap}
                                indentSize={indentSize}
                                depth={0}
                                enabled={enabled}
                            />
                        ))}
                    </div>
                )}
            </SelectableNode>
        </>
    )
}

// ── Settings tree node ─────────────────────────────────

function LinkTreeNode({
    link,
    depth,
    onUpdate,
    onRemove,
    onAddChild,
}: {
    link: NavLink
    depth: number
    onUpdate: (id: string, updates: Partial<Omit<NavLink, "children" | "id">>) => void
    onRemove: (id: string) => void
    onAddChild: (parentId: string) => void
}) {
    return (
        <div className={depth > 0 ? "ml-3 border-l border-dashed border-muted-foreground/30 pl-2" : ""}>
            <Collapsible>
                <div className="bg-muted/50 border rounded-lg overflow-hidden mb-1.5">
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between w-full p-2.5 text-left hover:bg-muted/80 transition-colors cursor-pointer">
                            <span className="truncate text-[12px] font-medium max-w-[160px]">
                                {link.label || `Link ${depth + 1}`}
                            </span>
                            <div className="flex items-center gap-1">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRemove(link.id)
                                    }}
                                    className="text-destructive hover:text-destructive/80 p-1 cursor-pointer"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-3 px-3 pb-3 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Etiqueta</Label>
                            <Input
                                value={link.label}
                                onChange={(e) => onUpdate(link.id, { label: e.target.value })}
                                className="h-8 text-[12px] md:text-[12px]"
                                placeholder="Texto del link"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">URL</Label>
                            <Input
                                value={link.url}
                                onChange={(e) => onUpdate(link.id, { url: e.target.value })}
                                className="h-8 text-[12px] md:text-[12px]"
                                placeholder="/ruta o https://..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Fuente</Label>
                            <FontFamilySelect
                                value={link.fontFamily ?? "sans"}
                                onChange={(val) => onUpdate(link.id, { fontFamily: val })}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Tamaño de fuente (px)</Label>
                            <Input
                                type="number"
                                value={link.fontSize ?? ""}
                                min={10}
                                max={96}
                                onChange={(e) => onUpdate(link.id, { fontSize: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="h-8 text-[12px] md:text-[12px]"
                                placeholder="Heredado del componente"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Peso de fuente</Label>
                            <Select
                                value={link.fontWeight ?? ""}
                                onValueChange={(val) => onUpdate(link.id, { fontWeight: val === "inherit" ? undefined : val })}
                            >
                                <SelectTrigger className="h-8 text-[12px]">
                                    <SelectValue placeholder="Heredado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="text-[12px]" value="inherit">Heredado</SelectItem>
                                    <SelectItem className="text-[12px]" value="normal">Normal</SelectItem>
                                    <SelectItem className="text-[12px]" value="500">Medium</SelectItem>
                                    <SelectItem className="text-[12px]" value="600">Semibold</SelectItem>
                                    <SelectItem className="text-[12px]" value="bold">Bold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Clases CSS</Label>
                            <Input
                                value={link.className ?? ""}
                                onChange={(e) => onUpdate(link.id, { className: e.target.value })}
                                className="h-8 text-[12px] md:text-[12px]"
                                placeholder="font-bold text-red-500 ..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`tab-${link.id}`}
                                checked={link.openInNewTab}
                                onChange={(e) => onUpdate(link.id, { openInNewTab: e.target.checked })}
                                className="h-3.5 w-3.5 cursor-pointer"
                            />
                            <Label htmlFor={`tab-${link.id}`} className="text-[11px] text-foreground/80 cursor-pointer">
                                Abrir en nueva pestaña
                            </Label>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddChild(link.id)}
                            className="w-full h-7 text-[12px]"
                        >
                            <CornerDownRight className="h-3 w-3 mr-1.5" />
                            Agregar sub-link
                        </Button>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {link.children.map((child) => (
                <LinkTreeNode
                    key={child.id}
                    link={child}
                    depth={depth + 1}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onAddChild={onAddChild}
                />
            ))}
        </div>
    )
}

// ── Settings Panel ─────────────────────────────────────

function EditableNestedLinksSettings() {
    const {
        actions: { setProp },
        links,
        textColor,
        fontSize,
        gap,
        indentSize,
        background,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        customClass,
        customCss,
    } = useNode((node) => ({
        links: node.data.props.links as NavLink[],
        textColor: node.data.props.textColor as string,
        fontSize: node.data.props.fontSize as number,
        gap: node.data.props.gap as number,
        indentSize: node.data.props.indentSize as number,
        background: node.data.props.background as string,
        paddingTop: node.data.props.paddingTop as number,
        paddingRight: node.data.props.paddingRight as number,
        paddingBottom: node.data.props.paddingBottom as number,
        paddingLeft: node.data.props.paddingLeft as number,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    const handleUpdate = (id: string, updates: Partial<Omit<NavLink, "children" | "id">>) => {
        setProp((props: Required<EditableNestedLinksProps>) => {
            props.links = updateLink(props.links, id, updates)
        })
    }

    const handleRemove = (id: string) => {
        setProp((props: Required<EditableNestedLinksProps>) => {
            props.links = removeLink(props.links, id)
        })
    }

    const handleAddChild = (parentId: string) => {
        setProp((props: Required<EditableNestedLinksProps>) => {
            props.links = addLink(props.links, parentId, makeLink("Nuevo sub-link"))
        })
    }

    const handleAddRoot = () => {
        setProp((props: Required<EditableNestedLinksProps>) => {
            props.links = addLink(props.links, null, makeLink("Nuevo link"))
        })
    }

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                        {links.map((link) => (
                            <LinkTreeNode
                                key={link.id}
                                link={link}
                                depth={0}
                                onUpdate={handleUpdate}
                                onRemove={handleRemove}
                                onAddChild={handleAddChild}
                            />
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddRoot}
                        className="w-full h-8 text-[12px]"
                    >
                        <Plus className="h-3 w-3 mr-2" />
                        Agregar link raíz
                    </Button>
                </div>
            </SettingsSection>

            {/* Es la letra base del arbol, la que heredan los enlaces que no
                traen la suya; la de cada enlace sigue en su propia card.

                Sin "Alineación": cada enlace es un elemento flexible medido por
                su texto dentro de su fila, asi que `text-align` no tiene caja
                donde repartir el sobrante. Moverlos seria `justify-content` de
                la fila, que es disposicion y no letra. */}
            <TypographySection
                legacy={typographyLegacyOf({ fontSize, textColor })}
                fields={{ textAlign: false }}
            />

            <SettingsSection title="Diseño">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Espacio entre links (px)</Label>
                        <Input
                            type="number"
                            value={gap}
                            min={0}
                            max={32}
                            onChange={(e) => setProp((props: any) => (props.gap = Number(e.target.value)))}
                            className="h-8 text-[12px] md:text-[12px]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Sangría de hijos (px)</Label>
                        <Input
                            type="number"
                            value={indentSize}
                            min={4}
                            max={48}
                            onChange={(e) => setProp((props: any) => (props.indentSize = Number(e.target.value)))}
                            className="h-8 text-[12px] md:text-[12px]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={background}
                                onChange={(val) => setProp((props: any) => (props.background = val))}
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf({ paddingTop, paddingRight, paddingBottom, paddingLeft })} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditableNestedLinksProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableNestedLinksProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

// ── Craft metadata ─────────────────────────────────────

EditableNestedLinks.craft = {
    displayName: "Enlaces anidados",
    props: {
        links: defaultLinks,
        textColor: "#111827",
        fontSize: 14,
        gap: 8,
        indentSize: 16,
        background: "transparent",
        paddingTop: 12,
        paddingRight: 16,
        paddingBottom: 12,
        paddingLeft: 16,
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableNestedLinksSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
