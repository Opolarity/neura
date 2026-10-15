import { useId, useEffect, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import Image from "@/modules/ecommerce/editor/tienda/next-image"
import Link from "@/modules/ecommerce/editor/tienda/next-link"
import { getCategoryGrid } from "@/modules/ecommerce/editor/tienda/api"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, uniformSpacing, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import { TypographySection, useTypographyCss, type TypographyLegacy } from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

interface EditableCategoryGridProps {
    columnsDesktop?: number
    columnsTablet?: number
    columnsMobile?: number
    gap?: number
    /**
     * @deprecated El relleno uniforme anterior. Se sigue leyendo porque lo traen los
     * bloques ya publicados; hoy el relleno va por lado y por modo (ver
     * SpacingSection) y este valor solo alimenta su `legacy`.
     */
    padding?: number
    background?: string
    categoriesIds?: string
    borderStyle?: BorderStyle
    borderColor?: string
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    [key: string]: unknown
}

// Las medidas del formato anterior: un relleno unico en px (por defecto 16), para
// que la seccion "Tamaño y espaciado" lo enseñe y lo migre al primer cambio.
function spacingLegacyOf(props: EditableCategoryGridProps): SpacingLegacy {
    const padding = props.padding ?? 16
    return { padding: uniformSpacing(padding), paddingValueFor: () => padding }
}

/**
 * La letra que el nombre de cada categoria llevaba escrita en las clases de su
 * <h3>: `font-mono text-lg sm:text-xl font-bold text-white tracking-wide`. No
 * era una prop, asi que no hay nada que renombrar en el JSON publicado; se
 * declara como legado para que esas paginas sigan viendose igual mientras nadie
 * toque la seccion "Tipografía", y se migre al primer cambio.
 *
 * Las equivalencias son exactas: `font-mono` es la misma familia que "mono" del
 * editor (tailwind.config la mapea a var(--font-space-grotesk)), `font-bold` es
 * 700, `text-white` es #ffffff y `tracking-wide` es 0.025em. La unica que no se
 * puede calcar es el tamaño: el `sm:` de Tailwind rompe en 640px y la cascada
 * del editor lo hace en 768px, asi que entre esos dos anchos el nombre pasa de
 * 20px a 18px. Se asume porque la alternativa —dejar las clases puestas— seria
 * tener dos sitios escribiendo font-size y un panel que ofrece controles que no
 * pintan nada.
 */
function typographyLegacyOf(): TypographyLegacy {
    const px = (value: number) => ({ value, unit: "px" as const, custom: "" })
    const em = (value: number) => ({ value, unit: "em" as const, custom: "" })
    return {
        fontFamily: "mono",
        fontWeight: 700,
        textColor: "#ffffff",
        size: { desktop: px(20), tablet: px(20), mobile: px(18) },
        // text-lg y text-xl traen los dos el mismo alto de linea, 1.75rem.
        lineHeight: { desktop: px(28), tablet: px(28), mobile: px(28) },
        letterSpacing: { desktop: em(0.025), tablet: em(0.025), mobile: em(0.025) },
        // Sin alineacion propia: el <h3> heredaba la de la tarjeta y lo sigue
        // haciendo hasta que alguien elija una.
    }
}

export function EditableCategoryGrid(props: EditableCategoryGridProps) {
    const {
    columnsDesktop = 4,
    columnsTablet = 3,
    columnsMobile = 2,
    gap = 16,
    background = "transparent",
    categoriesIds = "",
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
    } = props
    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))

    // Bordes de la seccion "Bordes" del panel (ver BorderSection).
    const borde = useBorderCss(props as Record<string, unknown>)
    // Ancho, alto, relleno y margen de la seccion "Tamaño y espaciado".
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

    // La letra de la seccion "Tipografía". Va en el <h3> de cada tarjeta, que es
    // el elemento que lleva el texto: el nombre sale de la base de datos y no
    // hay ningun otro campo del editor que le de formato. El aviso de "EXPLORAR"
    // y el mensaje de la grilla vacia no son texto del cliente y conservan el
    // suyo.
    const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf())

    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })
    const columns = useResponsiveValue({ desktop: columnsDesktop, tablet: columnsTablet, mobile: columnsMobile })

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la de
    // la grilla, para que el usuario pueda pisarla si quiere.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    const id = useId()
    const gridClass = `editable-category-grid-${id.replace(/:/g, "")}`

    const [categories, setCategories] = useState<any[]>([])
    const debouncedCategoriesIds = useDebounce(categoriesIds, 1000)

    useEffect(() => {
        const fetchCategories = async () => {
            const idsArray = (debouncedCategoriesIds || "")
                .split(",")
                .map(id => id.trim())
                .filter(id => id !== "" && !isNaN(Number(id)))
                .map(id => Number(id));

            const response = await getCategoryGrid(idsArray)
            if (response.success) {
                setCategories(response.data)
            }
        }
        fetchCategories()
    }, [debouncedCategoriesIds])

    return (
        <>
            <style>{columns !== null ? `
        .${gridClass} {
          display: grid;
          grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          gap: ${gap}px;
        }
      ` : `
        .${gridClass} {
          display: grid;
          grid-template-columns: repeat(${columnsMobile}, minmax(0, 1fr));
          gap: ${gap}px;
        }
        @media (min-width: 768px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsTablet}, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsDesktop}, minmax(0, 1fr));
          }
        }
      `}</style>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode
                className={`${gridClass} w-full transition-all duration-200 ${visClass} ${customCssClass} ${customClass} ${borde.className} ${medidas.className}`}
                style={{
                    background: background,
                }}
            >
                {categories.map((cat) => (
                    <Link
                        key={cat.category_id}
                        href={enabled ? "#" : `/tienda/categoria/${cat.category_id}`}
                        onClick={(e) => enabled && e.preventDefault()}
                        className="group relative aspect-[3/4] overflow-hidden rounded-xl"
                    >
                        <Image
                            src={cat.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                            alt={cat.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                        <div className="absolute inset-0 flex items-end p-5 sm:p-6">
                            <div className="w-full">
                                {/* Sin clases de letra propias: las que tenia
                                    (font-mono, text-lg sm:text-xl, font-bold,
                                    text-white, tracking-wide) las emite ahora la
                                    seccion "Tipografía" desde su legado, para
                                    que no haya dos sitios escribiendo el mismo
                                    font-size. La sombra no es tipografia y se
                                    queda. */}
                                <h3 className={`${letra.className} drop-shadow-md`}>
                                    {cat.name.toUpperCase()}
                                </h3>
                                <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300 mt-1" />
                                <p className="text-white text-[10px] font-bold mt-2 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    EXPLORAR →
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}

                {categories.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-xl">
                        <p className="text-muted-foreground">Escribe IDs de categorías en el panel lateral para visualizarlas.</p>
                    </div>
                )}
            </SelectableNode>
        </>
    )
}

const columnOptions = [
    { value: "1", label: "1 Columna" },
    { value: "2", label: "2 Columnas" },
    { value: "3", label: "3 Columnas" },
    { value: "4", label: "4 Columnas" },
    { value: "5", label: "5 Columnas" },
    { value: "6", label: "6 Columnas" },
]

function EditableCategoryGridSettings() {
    const {
        actions: { setProp },
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        gap,
        background,
        categoriesIds,
        customClass,
        customCss,
        bag,
    } = useNode((node) => ({
        columnsDesktop: node.data.props.columnsDesktop,
        columnsTablet: node.data.props.columnsTablet,
        columnsMobile: node.data.props.columnsMobile,
        gap: node.data.props.gap,
        background: node.data.props.background,
        categoriesIds: node.data.props.categoriesIds,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
        bag: node.data.props as EditableCategoryGridProps,
    }))

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">IDs de Categorías (separados por coma)</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            type="text"
                            placeholder="1, 2, 3..."
                            value={categoriesIds || ""}
                            onChange={(e) =>
                                setProp(
                                    (props: EditableCategoryGridProps) =>
                                        (props.categoriesIds = e.target.value)
                                )
                            }
                        />
                    </div>
                </div>
            </SettingsSection>

            {/* La letra del nombre de cada categoria, que sale de la base de
                datos: es la unica forma de darle formato desde el editor. El
                legado es lo que el <h3> llevaba escrito en sus clases. */}
            <TypographySection legacy={typographyLegacyOf()} />

            <SettingsSection title="Distribución">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
                        <Select
                            value={String(columnsDesktop)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableCategoryGridProps) =>
                                        (props.columnsDesktop = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Tableta (≥768px)</Label>
                        <Select
                            value={String(columnsTablet)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableCategoryGridProps) =>
                                        (props.columnsTablet = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Celular (&lt;768px)</Label>
                        <Select
                            value={String(columnsMobile)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableCategoryGridProps) =>
                                        (props.columnsMobile = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Estilos">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Espaciado (gap)</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            type="number"
                            value={gap}
                            min={0}
                            max={100}
                            onChange={(e) =>
                                setProp(
                                    (props: EditableCategoryGridProps) =>
                                        (props.gap = parseInt(e.target.value) || 0)
                                )
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={background}
                                onChange={(val) =>
                                    setProp(
                                        (props: EditableCategoryGridProps) =>
                                            (props.background = val)
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf(bag)} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp(
                        (props: EditableCategoryGridProps) => (props.customClass = val)
                    )
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp(
                        (props: EditableCategoryGridProps) => (props.customCss = val)
                    )
                }
            />
        </div>
    )
}

EditableCategoryGrid.craft = {
    displayName: "Grilla de categorías",
    props: {
        columnsDesktop: 4,
        columnsTablet: 3,
        columnsMobile: 2,
        gap: 16,
        padding: 16,
        background: "transparent",
        categoriesIds: "",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableCategoryGridSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
