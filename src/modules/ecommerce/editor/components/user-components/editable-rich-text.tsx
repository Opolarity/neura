import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useEditor as useCraftEditor, useNode } from "@craftjs/core"
import {
    useEditor as useTiptapEditor,
    useEditorState,
    EditorContent,
    type Editor as TiptapEditor,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
    Bold,
    Italic,
    Strikethrough,
    Link2,
    List,
    ListOrdered,
    Quote,
    RemoveFormatting,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/shared/utils/utils"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { useViewport } from "@/modules/ecommerce/editor/components/viewport-context"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import {
    TypographySection,
    typographyRulesOf,
    type TextAlign,
    type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { FontFamily } from "@/modules/ecommerce/editor/lib/font-families"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BorderSection, borderRulesByViewport } from "@/modules/ecommerce/editor/components/border-section"
import {
    SpacingSection,
    measureFromCss,
    spacingRulesByViewport,
    uniformSpacing,
    type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import type { BorderStyle, MeasureSpec } from "@/modules/ecommerce/editor/components/box-measures"

interface EditableRichTextProps {
    content?: string
    /**
     * @deprecated Relleno del formato anterior: un solo numero en px para los
     * cuatro lados y para los tres tamanos de pantalla. Hoy hay un juego por
     * modo; este solo se lee mientras el bloque no tenga ninguna unidad por
     * modo guardada.
     */
    padding?: number
    /**
     * @deprecated Ancho maximo del formato anterior. Ya no se edita desde el
     * panel —el ancho por modo lo sustituye—, pero se sigue aplicando para no
     * ensanchar los bloques de las paginas ya publicadas que lo llevan.
     */
    maxWidth?: string
    widthDesktop?: number
    widthTablet?: number
    widthMobile?: number
    /**
     * Una unidad por modo de pantalla, como en el boton: aqui "auto" es en si
     * mismo el valor de un modo y con una sola unidad compartida no habria
     * manera de decirlo.
     */
    widthUnitDesktop?: PropertyUnit
    widthUnitTablet?: PropertyUnit
    widthUnitMobile?: PropertyUnit
    widthCustomDesktop?: string
    widthCustomTablet?: string
    widthCustomMobile?: string
    paddingTopDesktop?: number
    paddingRightDesktop?: number
    paddingBottomDesktop?: number
    paddingLeftDesktop?: number
    paddingTopTablet?: number
    paddingRightTablet?: number
    paddingBottomTablet?: number
    paddingLeftTablet?: number
    paddingTopMobile?: number
    paddingRightMobile?: number
    paddingBottomMobile?: number
    paddingLeftMobile?: number
    /**
     * Una sola unidad para los cuatro lados de ese modo: mezclarlas dentro de
     * un mismo modo —px arriba y % a los lados— no resuelve ningun caso real y
     * multiplicaria por cuatro los desplegables de un panel que ya va justo de
     * ancho.
     */
    paddingUnitDesktop?: PropertyUnit
    paddingUnitTablet?: PropertyUnit
    paddingUnitMobile?: PropertyUnit
    paddingCustomDesktop?: string
    paddingCustomTablet?: string
    paddingCustomMobile?: string
    marginTopDesktop?: number
    marginRightDesktop?: number
    marginBottomDesktop?: number
    marginLeftDesktop?: number
    marginTopTablet?: number
    marginRightTablet?: number
    marginBottomTablet?: number
    marginLeftTablet?: number
    marginTopMobile?: number
    marginRightMobile?: number
    marginBottomMobile?: number
    marginLeftMobile?: number
    marginUnitDesktop?: PropertyUnit
    marginUnitTablet?: PropertyUnit
    marginUnitMobile?: PropertyUnit
    marginCustomDesktop?: string
    marginCustomTablet?: string
    marginCustomMobile?: string
    fontFamily?: FontFamily
    /**
     * El grosor del trazo. Sin valor no se aplica: un bloque ya publicado
     * hereda el peso del sitio, y escribirle un 400 le cambiaria la letra.
     */
    fontWeight?: number
    /** Una sola unidad para los tres modos, como en el boton. */
    sizeUnit?: PropertyUnit
    sizeCustom?: string
    sizeDesktop?: number
    sizeTablet?: number
    sizeMobile?: number
    /**
     * La unidad del alto de linea, una sola para los tres modos. Nacio sin
     * guardarse —el bloque pintaba em mientras estuviera vacia—, y de ahi que
     * `typographyLegacyOf` declare ese em como formato anterior.
     */
    lineHeightUnit?: PropertyUnit | ""
    lineHeightCustom?: string
    lineHeightDesktop?: number
    lineHeightTablet?: number
    lineHeightMobile?: number
    /** Una sola unidad para los tres modos, como el tamano. */
    letterSpacingUnit?: PropertyUnit
    letterSpacingCustom?: string
    letterSpacingDesktop?: number
    letterSpacingTablet?: number
    letterSpacingMobile?: number
    /**
     * La alineacion del bloque entero, un valor por modo de pantalla como el
     * tamano y el alto de linea, sus vecinas en el panel: centrar un texto en
     * celular y dejarlo a la izquierda en escritorio es de lo mas corriente.
     *
     * Sin valor no se aplica, igual que el peso: hoy el bloque no escribe
     * ningun text-align y hereda el del contenedor —que puede estar centrando—,
     * asi que ponerle un "left" por defecto descolocaria lo ya publicado.
     */
    textAlignDesktop?: TextAlign
    textAlignTablet?: TextAlign
    textAlignMobile?: TextAlign
    textColor?: string
    backgroundColor?: string
    borderStyle?: BorderStyle
    borderColor?: string
    borderTopWidthDesktop?: number
    borderRightWidthDesktop?: number
    borderBottomWidthDesktop?: number
    borderLeftWidthDesktop?: number
    borderTopWidthTablet?: number
    borderRightWidthTablet?: number
    borderBottomWidthTablet?: number
    borderLeftWidthTablet?: number
    borderTopWidthMobile?: number
    borderRightWidthMobile?: number
    borderBottomWidthMobile?: number
    borderLeftWidthMobile?: number
    /**
     * Una unidad por modo. No admite porcentaje: `border-width` en % no existe
     * en CSS, el navegador lo descarta y el borde desaparece.
     */
    borderWidthUnitDesktop?: PropertyUnit
    borderWidthUnitTablet?: PropertyUnit
    borderWidthUnitMobile?: PropertyUnit
    borderWidthCustomDesktop?: string
    borderWidthCustomTablet?: string
    borderWidthCustomMobile?: string
    borderTopLeftRadiusDesktop?: number
    borderTopRightRadiusDesktop?: number
    borderBottomLeftRadiusDesktop?: number
    borderBottomRightRadiusDesktop?: number
    borderTopLeftRadiusTablet?: number
    borderTopRightRadiusTablet?: number
    borderBottomLeftRadiusTablet?: number
    borderBottomRightRadiusTablet?: number
    borderTopLeftRadiusMobile?: number
    borderTopRightRadiusMobile?: number
    borderBottomLeftRadiusMobile?: number
    borderBottomRightRadiusMobile?: number
    /** Aqui el porcentaje si vale: al 50% las esquinas salen redondas. */
    borderRadiusUnitDesktop?: PropertyUnit
    borderRadiusUnitTablet?: PropertyUnit
    borderRadiusUnitMobile?: PropertyUnit
    borderRadiusCustomDesktop?: string
    borderRadiusCustomTablet?: string
    borderRadiusCustomMobile?: string
    customClass?: string
    /** CSS escrito a mano para este bloque. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
}

/**
 * El relleno de siempre: un solo numero en px para los cuatro lados y los
 * tres modos. Solo se lee mientras el bloque no tenga unidades por modo.
 *
 * Igual el ancho maximo: era un texto —"100%"— que valia para los tres modos y
 * se aplicaba en linea. Como formato anterior del campo "Ancho máximo" se sigue
 * viendo igual y, ademas, se puede cambiar.
 */
function spacingLegacyOf(props: EditableRichTextProps): SpacingLegacy {
    const relleno = props.padding ?? 16
    const anchoMaximo = measureFromCss(props.maxWidth ?? "100%")
    return {
        padding: uniformSpacing(relleno),
        paddingValueFor: () => relleno,
        maxWidth: { desktop: anchoMaximo, tablet: anchoMaximo, mobile: anchoMaximo },
    }
}

/**
 * El alto de linea de siempre.
 *
 * Es lo unico que hace falta declarar: el resto de la letra de este bloque ya
 * se guardaba con los nombres de la seccion compartida. La unidad tambien se
 * llama igual (`lineHeightUnit`), pero el bloque la interpretaba en em mientras
 * estuviera vacia, y la seccion arranca en px: sin esto un "1.5" ya publicado
 * pasaria de 1.5em a 1.5px, que es media letra de alto.
 */
function typographyLegacyOf(props: EditableRichTextProps): TypographyLegacy {
    const em = (value: number | undefined): MeasureSpec => ({
        value,
        unit: "em",
        // El texto libre solo se lee con la unidad "custom", y este formato
        // anterior es justo el de no tener ninguna unidad guardada.
        custom: "",
    })
    return {
        lineHeight: {
            desktop: em(props.lineHeightDesktop),
            tablet: em(props.lineHeightTablet),
            mobile: em(props.lineHeightMobile),
        },
    }
}

export function EditableRichText(props: EditableRichTextProps) {
    const {
        content = "",
        backgroundColor,
        customClass = "",
        customCss,
        hiddenOnDesktop = false,
        hiddenOnTablet = false,
        hiddenOnMobile = false,
    } = props

    const { enabled } = useCraftEditor((state) => ({
        enabled: state.options.enabled,
    }))

    // Dentro del editor se pinta solo el modo que se esta viendo; fuera manda
    // el ancho real de la pantalla y las medidas salen por media query.
    const viewport = useViewport()
    const isEditorMode = viewport !== null

    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })

    // El texto ya no se escribe aqui: se edita desde el panel de propiedades.
    // El canvas solo pinta el HTML guardado.
    const vacio = !content || content === "<p></p>"

    // Una clase por instancia: casi todo lo que se puede medir tiene un valor
    // por modo de pantalla, y eso un estilo en linea no lo puede expresar.
    const instanceId = useId()
    const blockClass = `editable-rich-text-${instanceId.replace(/:/g, "")}`

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la de
    // las medidas, para que el usuario pueda pisarlas si quiere.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    // Las cascadas buscan las props por nombre, asi que reciben el objeto
    // entero y no los valores ya desestructurados.
    const bag = props as Record<string, unknown>

    // Ancho, alto, relleno y margen por modo, con el relleno de siempre como
    // formato anterior. Los bordes no tienen formato anterior: el bloque nunca
    // los tuvo, asi que los tres modos empiezan vacios.
    const spacingRules = spacingRulesByViewport(bag, spacingLegacyOf(props))
    const borderRules = borderRulesByViewport(bag)
    // La letra sale de la seccion compartida y no de reglas propias: fuente,
    // grosor, tamano, alto de linea, espaciado, alineacion y color en un solo
    // sitio, con la misma cascada por modo que las medidas de caja.
    const typographyRules = typographyRulesOf(bag, typographyLegacyOf(props))

    const rulesFor = (modo: "desktop" | "tablet" | "mobile") =>
        spacingRules[modo] + borderRules[modo] + typographyRules[modo]

    return (
        <>
            {visibilityJsx}
            <style>{`
        .rich-text-content p,
        .rich-text-editor .tiptap p { margin: 0.5em 0; }
        /* El primer y el ultimo bloque no separan hacia fuera: sin esto el
           parrafo inicial deja 0.5em por encima y el final 0.5em por debajo,
           que se ven como un relleno extra que el usuario no puso. */
        .rich-text-content > :first-child,
        .rich-text-editor .tiptap > :first-child { margin-top: 0; }
        .rich-text-content > :last-child,
        .rich-text-editor .tiptap > :last-child { margin-bottom: 0; }
        /* Los seis encabezados van en em y no en px: asi la escala se mide
           contra el tamano de letra del propio bloque y un h2 sigue siendo
           mitad mas grande que su texto aunque se cambie el tamano base. Cada
           regla se repite en los dos selectores para que el encabezado se vea
           igual dentro del editor y en la tienda publicada. */
        .rich-text-content h1,
        .rich-text-editor .tiptap h1 { font-size: 2em; font-weight: 700; margin: 0.75em 0 0.4em; }
        .rich-text-content h2,
        .rich-text-editor .tiptap h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0 0.4em; }
        .rich-text-content h3,
        .rich-text-editor .tiptap h3 { font-size: 1.25em; font-weight: 600; margin: 0.75em 0 0.4em; }
        .rich-text-content h4,
        .rich-text-editor .tiptap h4 { font-size: 1.125em; font-weight: 600; margin: 0.75em 0 0.4em; }
        /* h5 y h6 no crecen respecto al texto: lo que los distingue es el peso.
           Agrandarlos otro escalon los dejaria indistinguibles del h4. */
        .rich-text-content h5,
        .rich-text-editor .tiptap h5 { font-size: 1em; font-weight: 600; margin: 0.75em 0 0.4em; }
        .rich-text-content h6,
        .rich-text-editor .tiptap h6 { font-size: 0.875em; font-weight: 600; margin: 0.75em 0 0.4em; }
        .rich-text-content ul,
        .rich-text-editor .tiptap ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-text-content ol,
        .rich-text-editor .tiptap ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-text-content li,
        .rich-text-editor .tiptap li { margin: 0.25em 0; }
        .rich-text-content blockquote,
        .rich-text-editor .tiptap blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1em; margin: 0.75em 0; color: hsl(var(--muted-foreground)); font-style: italic; }
        .rich-text-content hr,
        .rich-text-editor .tiptap hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1em 0; }
        .rich-text-content strong,
        .rich-text-editor .tiptap strong { font-weight: 700; }
        .rich-text-content em,
        .rich-text-editor .tiptap em { font-style: italic; }
        .rich-text-content s,
        .rich-text-editor .tiptap s { text-decoration: line-through; }
        .rich-text-content a,
        .rich-text-editor .tiptap a { color: hsl(var(--primary)); text-decoration: underline; }
        .rich-text-editor .tiptap { outline: none; min-height: 80px; }
        ${isEditorMode ? `
        .${blockClass} { ${rulesFor(viewport)} }
        ` : `
        @media (max-width: 767px) {
          .${blockClass} { ${rulesFor("mobile")} }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .${blockClass} { ${rulesFor("tablet")} }
        }
        @media (min-width: 1024px) {
          .${blockClass} { ${rulesFor("desktop")} }
        }
        `}
      `}</style>

            {customCssTag}

            <SelectableNode
                className={cn(
                    "transition-all",
                    blockClass,
                    customCssClass,
                    customClass,
                    visClass,
                )}
                // La letra ya no viaja por aqui: la escribe `typographyRules`
                // dentro del <style> de arriba, y en linea se pisaria a si
                // misma. El ancho maximo tampoco: lo escribe `spacingRules`,
                // con el de siempre como formato anterior (ver spacingLegacyOf).
                style={{ backgroundColor }}
            >
                {vacio && enabled ? (
                    // Sin esto un bloque recien soltado no se ve ni se puede
                    // seleccionar: no ocupa nada. En la tienda no se pinta.
                    <p className="text-muted-foreground italic">Escribe tu contenido aquí...</p>
                ) : (
                    <div
                        className="rich-text-content"
                        dangerouslySetInnerHTML={{ __html: content || "" }}
                    />
                )}
            </SelectableNode>
        </>
    )
}

/**
 * Los niveles de encabezado que ofrece la barra.
 *
 * No hace falta configurar nada en el StarterKit: su extension de encabezados
 * ya viene encendida y con estos mismos seis niveles de fabrica.
 *
 * El 0 es el parrafo. Va en la misma lista porque el desplegable necesita un
 * valor para "quitar el encabezado", y Radix no admite uno vacio.
 */
const NIVELES_ENCABEZADO = [1, 2, 3, 4, 5, 6] as const
type NivelEncabezado = (typeof NIVELES_ENCABEZADO)[number]

/**
 * La barra de formato de Tiptap.
 *
 * No lleva deshacer ni rehacer: el historial del bloque y el del lienzo son el
 * mismo para el usuario y se manejan con Ctrl+Z / Ctrl+Y (ver EditorContenido).
 * Dos botones que solo deshicieran "parte" de lo hecho confundirian.
 */
function BarraFormato({ editor }: { editor: TiptapEditor }) {
    const [linkAbierto, setLinkAbierto] = useState(false)
    const [url, setUrl] = useState("")

    // useEditor no re-renderiza en cada transaccion (shouldRerenderOnTransaction
    // viene apagado de fabrica), asi que sin esto los botones se quedarian
    // encendidos o apagados con el estado del primer render. Se leen solo las
    // marcas que pinta la barra: el panel entero no se redibuja al teclear.
    const activo = useEditorState({
        editor,
        selector: ({ editor }) => ({
            negrita: editor?.isActive("bold") ?? false,
            italica: editor?.isActive("italic") ?? false,
            tachado: editor?.isActive("strike") ?? false,
            enlace: editor?.isActive("link") ?? false,
            vinetas: editor?.isActive("bulletList") ?? false,
            numerada: editor?.isActive("orderedList") ?? false,
            cita: editor?.isActive("blockquote") ?? false,
            // El nivel del encabezado donde esta el cursor, o 0 si esta en un
            // parrafo. Se lee aqui, con el resto de marcas, para que el
            // desplegable se refresque al mover el cursor como los botones.
            nivel:
                NIVELES_ENCABEZADO.find(
                    (n) => editor?.isActive("heading", { level: n }) ?? false,
                ) ?? 0,
        }),
    })

    const aplicarNivel = (valor: string) => {
        const nivel = Number(valor)
        if (nivel === 0) {
            editor.chain().focus().setParagraph().run()
            return
        }
        // setHeading y no toggleHeading: el desplegable ya dice a que nivel se
        // va, y alternar convertiria en parrafo al reelegir el nivel actual.
        editor
            .chain()
            .focus()
            .setHeading({ level: nivel as NivelEncabezado })
            .run()
    }

    const abrirLink = () => {
        if (linkAbierto) {
            setLinkAbierto(false)
            return
        }
        // Con el cursor dentro de un enlace se edita el que ya hay.
        setUrl(editor.getAttributes("link").href ?? "")
        setLinkAbierto(true)
    }

    const aplicarLink = () => {
        const escrito = url.trim()

        if (!escrito) {
            // El campo vacio quita el enlace: es la unica forma de deshacerlo
            // sin un boton propio.
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
        } else {
            // Sin esquema el navegador trataria "tienda.pe" como una ruta
            // relativa del propio sitio.
            const href = /^(https?:|mailto:|tel:|\/|#)/i.test(escrito)
                ? escrito
                : `https://${escrito}`

            if (editor.state.selection.empty && !activo.enlace) {
                // Sin nada seleccionado no habria texto que marcar y el boton
                // pareceria no hacer nada: se escribe la direccion y se enlaza.
                editor
                    .chain()
                    .focus()
                    .insertContent({
                        type: "text",
                        text: escrito,
                        marks: [{ type: "link", attrs: { href } }],
                    })
                    .run()
            } else {
                // extendMarkRange cubre el caso de estar dentro de un enlace sin
                // seleccionarlo entero: cambia la direccion de todo el enlace.
                editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
            }
        }

        setUrl("")
        setLinkAbierto(false)
    }

    return (
        <div className="mb-2 p-1 border border-border rounded-md bg-muted">
            {/* Los encabezados van en un desplegable y en su propia linea, no en
                seis botones: la fila de abajo ya llena el panel —que se puede
                arrastrar hasta 240px— y cualquier control mas la parte en dos. */}
            <Select value={String(activo.nivel)} onValueChange={aplicarNivel}>
                <SelectTrigger className="h-7 mb-1 text-[12px]" title="Estilo de párrafo">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem className="text-[12px]" value="0">
                        Párrafo
                    </SelectItem>
                    {NIVELES_ENCABEZADO.map((nivel) => (
                        <SelectItem
                            key={nivel}
                            className="text-[12px]"
                            value={String(nivel)}
                        >
                            Título {nivel}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex gap-0.5 flex-wrap">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={activo.negrita}
                    title="Negrita"
                >
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={activo.italica}
                    title="Itálica"
                >
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={activo.tachado}
                    title="Tachado"
                >
                    <Strikethrough className="h-3.5 w-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-0.5 self-center" />

                <ToolbarButton
                    onClick={abrirLink}
                    active={linkAbierto || activo.enlace}
                    title="Enlace"
                >
                    <Link2 className="h-3.5 w-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-0.5 self-center" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={activo.vinetas}
                    title="Lista con viñetas"
                >
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={activo.numerada}
                    title="Lista numerada"
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={activo.cita}
                    title="Cita"
                >
                    <Quote className="h-3.5 w-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-0.5 self-center" />

                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().clearNodes().unsetAllMarks().run()
                    }
                    active={false}
                    title="Limpiar formato"
                >
                    <RemoveFormatting className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>

            {/* El campo va aqui dentro y no flotando: el panel de propiedades
                tiene su propio scroll y recortaria un popover. */}
            {linkAbierto && (
                <div className="flex gap-1 mt-1 p-1">
                    <Input
                        autoFocus
                        className="h-8 text-[12px] md:text-[12px]"
                        value={url}
                        placeholder="https://..."
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                aplicarLink()
                            }
                            if (e.key === "Escape") {
                                e.preventDefault()
                                setLinkAbierto(false)
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={aplicarLink}
                        className="shrink-0 rounded px-2 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {url.trim() ? "Aplicar" : "Quitar"}
                    </button>
                </div>
            )}
        </div>
    )
}

interface ToolbarButtonProps {
    children: React.ReactNode
    onClick: () => void
    active: boolean
    disabled?: boolean
    title?: string
}

function ToolbarButton({
    children,
    onClick,
    active,
    disabled,
    title,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-1.5 rounded text-xs transition-colors",
                active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    )
}

/**
 * La instancia de Tiptap.
 *
 * Vive en un componente aparte para poder remontarla con una `key`: la pila de
 * deshacer de Tiptap no sabe nada del historial del lienzo, asi que en cuanto
 * el contenido cambia por fuera (un Ctrl+Z del lienzo, por ejemplo) hay que
 * tirarla entera. Ver el control de version en EditableRichTextSettings.
 *
 * `htmlInicial` se lee una sola vez, al montar. Los cambios posteriores no
 * reescriben el documento -- eso partiria el cursor a media palabra -- y por
 * eso los de fuera llegan como remonte.
 */
function EditorContenido({
    htmlInicial,
    onHtml,
    onDeshacerLienzo,
    onRehacerLienzo,
}: {
    htmlInicial: string
    onHtml: (html: string, sinHistorial: boolean) => void
    onDeshacerLienzo: () => void
    onRehacerLienzo: () => void
}) {
    // handleKeyDown se registra al crear el editor, antes de que exista la
    // instancia: la lee de aqui en el momento de la pulsacion.
    const editorRef = useRef<TiptapEditor | null>(null)
    // Marca el rato en que el cambio lo provoca un deshacer del propio Tiptap.
    // commands.undo() emite el update de forma sincrona, asi que basta con
    // levantarla alrededor de la llamada.
    const deshaciendo = useRef(false)

    const editor = useTiptapEditor({
        extensions: [
            StarterKit.configure({
                // Link ya viene en el StarterKit de Tiptap v3. Abrirlo al hacer
                // click es lo que trae de fabrica y dentro del editor estorba:
                // al pinchar para colocar el cursor se navegaria fuera.
                link: {
                    openOnClick: false,
                    defaultProtocol: "https",
                },
            }),
        ],
        content: htmlInicial,
        editable: true,
        immediatelyRender: false,
        onUpdate: ({ editor }) => onHtml(editor.getHTML(), deshaciendo.current),
        editorProps: {
            // Las props de la vista se consultan antes que las de los plugins,
            // asi que esto se ejecuta por delante del atajo de la extension de
            // historial de Tiptap y puede quitarselo.
            handleKeyDown: (_view, event) => {
                if (!(event.ctrlKey || event.metaKey) || event.altKey) return false
                const tecla = event.key.toLowerCase()
                const rehacer = tecla === "y" || (tecla === "z" && event.shiftKey)
                const deshacer = tecla === "z" && !event.shiftKey
                if (!deshacer && !rehacer) return false

                event.preventDefault()
                const ed = editorRef.current

                // Mientras a Tiptap le quede pila el atajo es suyo: deshace por
                // palabras, como cualquier editor de texto. Se ejecuta aqui en
                // vez de dejarselo a su propio atajo para poder marcar de donde
                // viene el cambio (ver `deshaciendo`).
                if (ed && (rehacer ? ed.can().redo() : ed.can().undo())) {
                    deshaciendo.current = true
                    if (rehacer) ed.commands.redo()
                    else ed.commands.undo()
                    deshaciendo.current = false
                    return true
                }

                // Agotada la pila, el atajo pasa al lienzo. Sin esto no pasaria
                // nada y pareceria un fallo: el atajo global de la barra
                // superior se inhibe dentro de un contenteditable (ver
                // isTypingTarget), asi que nadie mas lo recogeria.
                if (rehacer) onRehacerLienzo()
                else onDeshacerLienzo()
                return true
            },
        },
    })

    useEffect(() => {
        editorRef.current = editor
    }, [editor])

    if (!editor) return null

    return (
        <div className="rounded-md border border-border p-1">
            <BarraFormato editor={editor} />
            <EditorContent editor={editor} className="rich-text-editor px-1" />
        </div>
    )
}

/**
 * Cuanto agrupa el historial del lienzo al teclear. Sin esto cada letra seria
 * una entrada y un Ctrl+Z fuera del editor borraria un caracter.
 */
const MS_HISTORIAL = 1000

function EditableRichTextSettings() {
    const {
        id,
        actions: { setProp },
        content,
        nodeProps,
    } = useNode((node) => ({
        content: node.data.props.content as string | undefined,
        // El panel lee muchas props, y casi todas por nombre calculado, asi que
        // se lleva el objeto entero en vez de listarlas una a una.
        nodeProps: node.data.props as EditableRichTextProps,
    }))

    const { actions: accionesLienzo } = useCraftEditor()

    // Lo ultimo que escribio este panel en la prop. Sirve para distinguir el eco
    // de teclear aqui de un cambio venido de fuera.
    const propio = useRef<string | undefined>(undefined)
    if (propio.current === undefined) propio.current = content ?? ""

    const idPrevio = useRef(id)
    const [version, setVersion] = useState(0)

    useEffect(() => {
        const actual = content ?? ""

        // Craft reutiliza este mismo componente al cambiar de bloque. La `key`
        // lleva el id, asi que el editor ya se remonta solo: aqui basta con
        // apuntar el contenido del bloque nuevo.
        if (idPrevio.current !== id) {
            idPrevio.current = id
            propio.current = actual
            return
        }

        if (actual === propio.current) return

        // El contenido cambio sin pasar por el teclado: solo puede venir del
        // historial del lienzo. La pila de Tiptap apunta a texto que ya no
        // existe y resucitaria lo viejo al siguiente Ctrl+Z, asi que se remonta.
        propio.current = actual
        setVersion((v) => v + 1)
    }, [id, content])

    const guardar = useCallback(
        (html: string, sinHistorial: boolean) => {
            propio.current = html

            if (sinHistorial) {
                // El cambio sale de un deshacer de Tiptap. Tiene que llegar al
                // lienzo igual (lo que se ve y lo que se guarda sale de ahi),
                // pero no puede apuntarse como un paso nuevo: si se apuntara,
                // al agotarse la pila de Tiptap el siguiente Ctrl+Z desharia
                // ese deshacer y el texto volveria a aparecer.
                accionesLienzo.history
                    .ignore()
                    .setProp(id, (props: EditableRichTextProps) => {
                        props.content = html
                    })
                return
            }

            // El throttle agrupa en una sola entrada todo lo tecleado dentro de
            // la ventana. El estado del lienzo se actualiza igualmente en cada
            // tecla: lo que se agrupa es el historial, no el guardado.
            setProp((props: EditableRichTextProps) => {
                props.content = html
            }, MS_HISTORIAL)
        },
        [accionesLienzo, id, setProp]
    )

    const deshacerLienzo = useCallback(
        () => accionesLienzo.history.undo(),
        [accionesLienzo]
    )
    const rehacerLienzo = useCallback(
        () => accionesLienzo.history.redo(),
        [accionesLienzo]
    )

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Contenido</Label>
                        <EditorContenido
                            key={`${id}:${version}`}
                            htmlInicial={content ?? ""}
                            onHtml={guardar}
                            onDeshacerLienzo={deshacerLienzo}
                            onRehacerLienzo={rehacerLienzo}
                        />
                    </div>
                </div>
            </SettingsSection>

            <TypographySection legacy={typographyLegacyOf(nodeProps)} />

            <SettingsSection title="Apariencia">
                {/* El color del texto se fue a "Tipografía", con el resto de la
                    letra. Aqui queda lo que pinta la caja y no el texto. */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">
                            Color de fondo
                        </Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={nodeProps.backgroundColor}
                                onChange={(val) =>
                                    setProp(
                                        (props: EditableRichTextProps) =>
                                            (props.backgroundColor = val)
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf(nodeProps)} />

            <BorderSection />

            <AdvancedSection
                customClass={nodeProps.customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp(
                        (props: EditableRichTextProps) => (props.customClass = val)
                    )
                }
                customCss={nodeProps.customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableRichTextProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableRichText.craft = {
    displayName: "Texto enriquecido",
    props: {
        content: "",
        // Sin relleno: el texto arranca pegado al borde del bloque, como el
        // Boton. Los bloques guardados antes llevan su 16 de entonces.
        padding: 0,
        maxWidth: "100%",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableRichTextSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
