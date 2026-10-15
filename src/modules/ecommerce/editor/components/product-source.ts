import type { ProductGridFilters, ProductGridSource } from "@/modules/ecommerce/editor/tienda/types"
import { parseCategoryIds } from "@/modules/ecommerce/editor/components/category-ids-picker"

/**
 * Fuentes de producto disponibles en los bloques que listan productos
 * (Grilla y Carrusel). Los valores viajan tal cual al backend como `source`
 * en ec-get-product-ids.
 */
export const productSourceOptions: { value: ProductGridSource; label: string }[] = [
    { value: "productIds", label: "IDs de productos" },
    { value: "categoryId", label: "Categorías" },
    { value: "brandId", label: "ID de marca" },
    { value: "new", label: "Nuevos" },
    { value: "best_sellers", label: "Mas vendidos" },
    { value: "sale", label: "En oferta" },
]

/**
 * Fuentes cuyo orden lo define el propio backend (fecha de creacion, unidades
 * vendidas o precio de oferta). En estas el selector de "Orden" no aplica.
 */
const sourcesWithImplicitOrder: ProductGridSource[] = ["new", "best_sellers", "sale"]

export function hasImplicitOrder(source?: string): boolean {
    return sourcesWithImplicitOrder.includes(source as ProductGridSource)
}

function parseId(value?: string): number | null {
    const parsed = Number((value || "").trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function parseIdList(value?: string): number[] {
    return (value || "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "" && !isNaN(Number(id)))
        .map((id) => Number(id))
}

/**
 * Traduce la configuracion del bloque al body que espera ec-get-product-ids.
 * `limit` se envia como `size` para que las fuentes dinamicas (nuevos, mas
 * vendidos, ofertas) se recorten en la base y no traigan todo el catalogo.
 *
 * A diferencia de franquiciados, aqui la categoria viaja como `category_ids`
 * (arreglo): este proyecto permite elegir varias con el selector de categorias.
 */
export function buildProductGridFilters(config: {
    dataSource?: string
    productIds?: string
    categoryId?: string
    brandId?: string
    order?: string
    limit?: number
}): ProductGridFilters {
    const source = (config.dataSource || "productIds") as ProductGridSource

    const categoryIds =
        source === "categoryId" ? parseCategoryIds(config.categoryId || "") : []

    return {
        source,
        product_ids: source === "productIds" ? parseIdList(config.productIds) : [],
        category_ids: categoryIds.length > 0 ? categoryIds : null,
        brand_id: source === "brandId" ? parseId(config.brandId) : null,
        order: hasImplicitOrder(source) ? null : config.order ?? null,
        size: config.limit && config.limit > 0 ? config.limit : null,
    }
}
