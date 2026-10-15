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
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import { ProductCard } from "@/modules/ecommerce/editor/tienda/product-card"
import { ProductIdsPicker } from "@/modules/ecommerce/editor/components/product-ids-picker"
import { CategoryIdsPicker } from "@/modules/ecommerce/editor/components/category-ids-picker"
import { normalizePrice } from "@/modules/ecommerce/editor/tienda/pricing"
import type { Product } from "@/modules/ecommerce/editor/tienda/types"
import Autoplay from "embla-carousel-autoplay"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
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
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, uniformSpacing, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"

interface EditableProductCarouselProps {
    slidesDesktop?: number
    slidesTablet?: number
    slidesMobile?: number
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
    autoplay?: boolean
    interval?: number
    showArrows?: boolean
    showIndicators?: boolean
    loop?: boolean
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

// El relleno unico que el bloque guardaba, para que la seccion "Tamaño y
// espaciado" lo enseñe y lo migre al primer cambio.
function spacingLegacyOf(props: { padding?: number }): SpacingLegacy {
    const { padding = 16 } = props
    return { padding: uniformSpacing(padding), paddingValueFor: () => padding }
}

export function EditableProductCarousel(props: EditableProductCarouselProps) {
    const {
        slidesDesktop = 4,
        slidesTablet = 3,
        slidesMobile = 2,
        gap = 16,
        background = "transparent",
        limit = 20,
        order = "date-desc",
        productIds = "",
        categoryId = "",
        brandId = "",
        dataSource = "productIds",
        autoplay = false,
        interval = 3000,
        showArrows = true,
        showIndicators = false,
        loop = true,
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
    const slidesActive = useResponsiveValue({ desktop: slidesDesktop, tablet: slidesTablet, mobile: slidesMobile })

    const id = useId()
    const carouselClass = `product-carousel-${id.replace(/:/g, "")}`

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la
    // del carrusel, para que el usuario pueda pisar sus reglas.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)
    const borde = useBorderCss(props as Record<string, unknown>)
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

    // La letra de la seccion "Tipografía". Va en el contenedor del que cuelgan
    // las tarjetas, no en cada tarjeta: los nombres y los precios los pinta
    // ProductCard, que es compartido con toda la tienda, asi que la herencia es
    // la unica via para darles formato desde el editor. Sin nada guardado no
    // emite ninguna regla y el carrusel se sigue viendo igual. No lleva legado
    // porque el bloque nunca guardo tipografia propia con otros nombres.
    const letra = useTypographyCss(props as Record<string, unknown>)

    const [products, setProducts] = useState<ProductGridItem[]>([])
    const [api, setApi] = useState<any>()
    useEditorCarouselReset(api)
    const [current, setCurrent] = useState(0)

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

    useEffect(() => {
        if (!api) return
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    const plugins = autoplay && !enabled
        ? [Autoplay({ delay: interval, stopOnInteraction: true })]
        : []

    return (
        <>
            <style>{slidesActive !== null ? `
        .${carouselClass} .embla-item {
          flex: 0 0 calc(${100 / slidesActive}%);
          min-width: 0;
        }
      ` : `
        .${carouselClass} .embla-item {
          flex: 0 0 calc(${100 / slidesMobile}%);
          min-width: 0;
        }
        @media (min-width: 768px) {
          .${carouselClass} .embla-item {
            flex: 0 0 calc(${100 / slidesTablet}%);
          }
        }
        @media (min-width: 1024px) {
          .${carouselClass} .embla-item {
            flex: 0 0 calc(${100 / slidesDesktop}%);
          }
        }
      `}</style>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode
                className={`${carouselClass} w-full ${visClass} ${customCssClass} ${customClass} ${borde.className} ${medidas.className} ${letra.className}`}
                style={{
                    background,
                }}
            >
                <Carousel
                    key={`${autoplay}-${interval}-${loop}`}
                    setApi={setApi}
                    opts={{ loop, align: "start" }}
                    plugins={plugins}
                    className="w-full"
                >
                    <CarouselContent style={{ marginLeft: -gap }}>
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
                                <CarouselItem key={product.product_id} className="embla-item" style={{ paddingLeft: gap }}>
                                    <div className={`relative ${enabled ? "pointer-events-none" : ""}`}>
                                        <ProductCard product={mappedProduct} />
                                    </div>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>

                    {showArrows && products.length > 0 && (
                        <>
                            <CarouselPrevious className="left-2 bg-black/30 hover:bg-black/50 border-0 text-white" />
                            <CarouselNext className="right-2 bg-black/30 hover:bg-black/50 border-0 text-white" />
                        </>
                    )}
                </Carousel>

                {showIndicators && products.length > 0 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {products.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => api?.scrollTo(index)}
                                className={`h-2 w-2 rounded-full transition ${current === index
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </SelectableNode>
        </>
    )
}

const slideOptions = [
    { value: "1", label: "1 slide" },
    { value: "2", label: "2 slides" },
    { value: "3", label: "3 slides" },
    { value: "4", label: "4 slides" },
    { value: "5", label: "5 slides" },
    { value: "6", label: "6 slides" },
]

const orderOptions = [
    { value: "date-desc", label: "Orden de creación" },
    { value: "alp-asc", label: "Alfabéticamente: A-Z" },
    { value: "alp-desc", label: "Alfabéticamente: Z-A" },
    { value: "pri-asc", label: "Precio: menor a mayor" },
    { value: "pri-desc", label: "Precio: mayor a menor" },
]

function EditableProductCarouselSettings() {
    const {
        actions: { setProp },
        slidesDesktop,
        slidesTablet,
        slidesMobile,
        gap,
        padding,
        background,
        limit,
        order,
        productIds,
        categoryId,
        brandId,
        dataSource,
        autoplay,
        interval,
        showArrows,
        showIndicators,
        loop,
        customClass,
        customCss,
    } = useNode((node) => ({
        slidesDesktop: node.data.props.slidesDesktop,
        slidesTablet: node.data.props.slidesTablet,
        slidesMobile: node.data.props.slidesMobile,
        gap: node.data.props.gap,
        padding: node.data.props.padding,
        background: node.data.props.background,
        limit: node.data.props.limit,
        order: node.data.props.order,
        productIds: node.data.props.productIds,
        categoryId: node.data.props.categoryId,
        brandId: node.data.props.brandId,
        dataSource: node.data.props.dataSource,
        autoplay: node.data.props.autoplay,
        interval: node.data.props.interval,
        showArrows: node.data.props.showArrows,
        showIndicators: node.data.props.showIndicators,
        loop: node.data.props.loop,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
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
                                    (props: EditableProductCarouselProps) =>
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
                                    (props: EditableProductCarouselProps) =>
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
                                    (props: EditableProductCarouselProps) =>
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
                                    (props: EditableProductCarouselProps) =>
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
                                    (props: EditableProductCarouselProps) =>
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
                                    (props: EditableProductCarouselProps) =>
                                        (props.brandId = e.target.value)
                                )
                            }
                        />
                    </div>
                    )}
                </div>
            </SettingsSection>

            {/* La letra del bloque: la base que heredan las tarjetas. El texto
                del carrusel sale de la base de datos y lo pinta ProductCard, asi
                que esta seccion es la unica forma de darle formato desde el
                editor. Sin valores guardados no emite ninguna regla. */}
            <TypographySection />

            <SettingsSection title="Distribución">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
                        <Select
                            value={String(slidesDesktop)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductCarouselProps) =>
                                        (props.slidesDesktop = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {slideOptions.map((opt) => (
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
                            value={String(slidesTablet)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductCarouselProps) =>
                                        (props.slidesTablet = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {slideOptions.map((opt) => (
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
                            value={String(slidesMobile)}
                            onValueChange={(val) =>
                                setProp(
                                    (props: EditableProductCarouselProps) =>
                                        (props.slidesMobile = parseInt(val))
                                )
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {slideOptions.map((opt) => (
                                    <SelectItem className="text-[12px]" key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Carrusel">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="auto-play"
                            checked={autoplay}
                            onCheckedChange={(val) =>
                                setProp((props: EditableProductCarouselProps) => {
                                    props.autoplay = Boolean(val)
                                })
                            }
                        />
                        <Label htmlFor="auto-play" className="text-[11px] text-foreground/80">Autoplay</Label>
                    </div>

                    {autoplay && (
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] text-foreground/60">Intervalo (ms)</Label>
                            <Input
                                className="h-8 text-[12px] md:text-[12px]"
                                type="number"
                                value={interval}
                                min={1000}
                                step={500}
                                onChange={(e) =>
                                    setProp((props: EditableProductCarouselProps) => {
                                        props.interval = parseInt(e.target.value) || 3000
                                    })
                                }
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show-arrows"
                            checked={showArrows}
                            onCheckedChange={(val) =>
                                setProp((props: EditableProductCarouselProps) => {
                                    props.showArrows = Boolean(val)
                                })
                            }
                        />
                        <Label htmlFor="show-arrows" className="text-[11px] text-foreground/80">Mostrar Flechas</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show-indicators"
                            checked={showIndicators}
                            onCheckedChange={(val) =>
                                setProp((props: EditableProductCarouselProps) => {
                                    props.showIndicators = Boolean(val)
                                })
                            }
                        />
                        <Label htmlFor="show-indicators" className="text-[11px] text-foreground/80">Mostrar Indicadores</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="loop-infinite"
                            checked={loop}
                            onCheckedChange={(val) =>
                                setProp((props: EditableProductCarouselProps) => {
                                    props.loop = Boolean(val)
                                })
                            }
                        />
                        <Label htmlFor="loop-infinite" className="text-[11px] text-foreground/80">Loop Infinito</Label>
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
                                    (props: EditableProductCarouselProps) =>
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
                                        (props: EditableProductCarouselProps) =>
                                            (props.background = val)
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf({ padding })} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp(
                        (props: EditableProductCarouselProps) =>
                            (props.customClass = val)
                    )
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp(
                        (props: EditableProductCarouselProps) =>
                            (props.customCss = val)
                    )
                }
            />
        </div>
    )
}

EditableProductCarousel.craft = {
    displayName: "Carrusel de productos",
    props: {
        slidesDesktop: 4,
        slidesTablet: 3,
        slidesMobile: 2,
        gap: 16,
        padding: 16,
        background: "transparent",
        limit: 20,
        order: "date-desc",
        productIds: "",
        categoryId: "",
        brandId: "",
        dataSource: "productIds",
        autoplay: false,
        interval: 3000,
        showArrows: true,
        showIndicators: false,
        loop: true,
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableProductCarouselSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
