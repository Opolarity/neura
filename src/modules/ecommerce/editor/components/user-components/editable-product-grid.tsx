import { useId, useEffect, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { getProductGrid } from "@/modules/ecommerce/editor/tienda/api"
import { normalizeImages } from "@/modules/ecommerce/editor/tienda/adapters"
import type { ProductGridItem, ProductGridSource } from "@/modules/ecommerce/editor/tienda/types"
import {
    buildProductGridFilters,
    hasImplicitOrder,
    productSourceOptions,
} from "@/modules/ecommerce/editor/components/product-source"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import { ProductCard } from "@/modules/ecommerce/editor/tienda/product-card"
import { ProductIdsPicker } from "@/modules/ecommerce/editor/components/product-ids-picker"
import { CategoryIdsPicker } from "@/modules/ecommerce/editor/components/category-ids-picker"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { normalizePrice } from "@/modules/ecommerce/editor/tienda/pricing"
import type { Product } from "@/modules/ecommerce/editor/tienda/types"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, uniformSpacing, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"


interface EditableProductGridProps {
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
    limit?: number
    order?: string
    productIds?: string
    categoryId?: string
    brandId?: string
    dataSource?: ProductGridSource
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
function spacingLegacyOf(props: EditableProductGridProps): SpacingLegacy {
    const padding = props.padding ?? 16
    return { padding: uniformSpacing(padding), paddingValueFor: () => padding }
}

export function EditableProductGrid(props: EditableProductGridProps) {
    const {
    columnsDesktop = 4,
    columnsTablet = 3,
    columnsMobile = 2,
    gap = 16,
    background = "transparent",
    limit = 20,
    order = "date-desc",
    productIds = "",
    categoryId = "",
    brandId = "",
    dataSource = "productIds",
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

    // La letra de la seccion "Tipografía". Va en el contenedor del que cuelgan
    // las tarjetas, no en cada tarjeta: los nombres y los precios los pinta
    // ProductCard, que es compartido con toda la tienda, asi que la herencia es
    // la unica via para darles formato desde el editor. Sin nada guardado no
    // emite ninguna regla y la grilla se sigue viendo igual. No lleva legado
    // porque el bloque nunca guardo tipografia propia con otros nombres.
    const letra = useTypographyCss(props as Record<string, unknown>)

    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })
    const columns = useResponsiveValue({ desktop: columnsDesktop, tablet: columnsTablet, mobile: columnsMobile })

    const id = useId()
    const gridClass = `editable-product-grid-${id.replace(/:/g, "")}`

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la de
    // la grilla, para que el usuario pueda pisar sus reglas.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    const [products, setProducts] = useState<ProductGridItem[]>([])

    const debouncedProductIds = useDebounce(productIds, 1000)
    const debouncedCategoryId = useDebounce(categoryId, 1000)
    const debouncedBrandId = useDebounce(brandId, 1000)

    useEffect(() => {
        const fetchProducts = async () => {
            const response = await getProductGrid(
                buildProductGridFilters({
                    dataSource,
                    productIds: debouncedProductIds,
                    categoryId: debouncedCategoryId,
                    brandId: debouncedBrandId,
                    order,
                    limit,
                })
            )
            if (response.success) {
                setProducts(response.data.data.slice(0, limit))
            }
        }
        fetchProducts()
    }, [limit, order, debouncedProductIds, debouncedCategoryId, debouncedBrandId, dataSource])

    return (
        <>
            <style>{columns !== null ? `
        .${gridClass} {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
        }
      ` : `
        .${gridClass} {
          display: grid;
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
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode
                className={`${gridClass} w-full ${visClass} ${customCssClass} ${customClass} ${borde.className} ${medidas.className} ${letra.className}`}
                style={{
                    gap,
                    background,
                }}
            >
                {products.map((product) => {
                    const normalizedPrice = normalizePrice({
                        price: product.price,
                        regularPrice: product.regular_price,
                        salePrice: product.sale_price,
                    })

                    // Mapeo local para compatibilidad con ProductCard
                    const mappedProduct: Product = {
                        id: product.product_id.toString(),
                        name: product.name,
                        slug: (product as any).slug || product.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, ""),
                        price: normalizedPrice.effectivePrice,
                        salePrice: normalizedPrice.originalPrice,
                        images: normalizeImages(product.images),
                        description: "",
                        category: product.categories || "General",
                        stock: product.stock,
                        groupTerms: product.terminos as any,
                        isNew: (product as any).isNew,
                        isSale: normalizedPrice.hasDiscount || (product as any).isSale,
                        isPreSale: (product as any).isPreSale,
                        promotionalText: product.promotional_text ?? undefined,
                        promotionalTextColor: product.promotional_text_color ?? undefined,
                        promotionalBgColor: product.promotional_bg_color ?? undefined,
                        exhibitionStartDate: product.exhibition_start_date ?? null,
                        exhibitionEndDate: product.exhibition_end_date ?? null,
                    };

                    return (
                        <div
                            key={product.product_id}
                            className={`relative ${enabled ? "pointer-events-none" : ""}`}
                        >
                            <ProductCard product={mappedProduct} />
                        </div>
                    );
                })}
            </SelectableNode>
        </>
    )
}

const columnOptions = [
    { value: "1", label: "1 columna" },
    { value: "2", label: "2 columnas" },
    { value: "3", label: "3 columnas" },
    { value: "4", label: "4 columnas" },
    { value: "5", label: "5 columnas" },
    { value: "6", label: "6 columnas" },
]

const orderOptions = [
    { value: "date-desc", label: "Orden de creación" },
    { value: "alp-asc", label: "Alfabéticamente: A-Z" },
    { value: "alp-desc", label: "Alfabéticamente: Z-A" },
    { value: "pri-asc", label: "Precio: menor a mayor" },
    { value: "pri-desc", label: "Precio: mayor a menor" },
]

function EditableProductGridSettings() {
    const {
        actions: { setProp },
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        gap,
        background,
        limit,
        order,
        productIds,
        categoryId,
        brandId,
        dataSource,
        customClass,
        customCss,
        bag,
    } = useNode((node) => ({
        columnsDesktop: node.data.props.columnsDesktop,
        columnsTablet: node.data.props.columnsTablet,
        columnsMobile: node.data.props.columnsMobile,
        gap: node.data.props.gap,
        background: node.data.props.background,
        limit: node.data.props.limit,
        order: node.data.props.order,
        productIds: node.data.props.productIds,
        categoryId: node.data.props.categoryId,
        brandId: node.data.props.brandId,
        dataSource: node.data.props.dataSource,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
        bag: node.data.props as EditableProductGridProps,
    }))

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Límite de productos</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            type="number"
                            value={limit}
                            min={1}
                            max={100}
                            onChange={(e) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.limit = parseInt(e.target.value) || 20)
                                )
                            }
                        />
                    </div>

                    {!hasImplicitOrder(dataSource) && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Orden</Label>
                        <Select
                            value={order}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.order = val)
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {orderOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fuente de productos</Label>
                        <Select
                            value={dataSource || "productIds"}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.dataSource = val as ProductGridSource)
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {productSourceOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {dataSource === "productIds" && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Productos</Label>
                        <ProductIdsPicker
                            value={productIds || ""}
                            onChange={(csv) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.productIds = csv)
                                )
                            }
                        />
                    </div>
                    )}

                    {dataSource === "categoryId" && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Categorías</Label>
                        <CategoryIdsPicker
                            value={categoryId || ""}
                            onChange={(csv) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.categoryId = csv)
                                )
                            }
                        />
                    </div>
                    )}

                    {dataSource === "brandId" && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">ID de marca</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            type="number"
                            value={brandId || ""}
                            onChange={(e) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
                                        (props.brandId = e.target.value)
                                )
                            }
                        />
                    </div>
                    )}
                </div>
            </SettingsSection>

            {/* La letra del bloque: la base que heredan las tarjetas. El texto
                de la grilla sale de la base de datos y lo pinta ProductCard, asi
                que esta seccion es la unica forma de darle formato desde el
                editor. Sin valores guardados no emite ninguna regla. */}
            <TypographySection />

            <SettingsSection title="Distribución">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
                        <Select
                            value={String(columnsDesktop)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductGridProps) =>
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
                                    (props: EditableProductGridProps) =>
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
                                    (props: EditableProductGridProps) =>
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
                                    (props: EditableProductGridProps) =>
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
                                        (props: EditableProductGridProps) =>
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
                        (props: EditableProductGridProps) => (props.customClass = val)
                    )
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp(
                        (props: EditableProductGridProps) => (props.customCss = val)
                    )
                }
            />
        </div>
    )
}

EditableProductGrid.craft = {
    displayName: "Grilla de productos",
    props: {
        columnsDesktop: 4,
        columnsTablet: 3,
        columnsMobile: 2,
        gap: 16,
        padding: 16,
        background: "transparent",
        limit: 20,
        order: "date-desc",
        productIds: "",
        categoryId: "",
        brandId: "",
        dataSource: "productIds",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableProductGridSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
