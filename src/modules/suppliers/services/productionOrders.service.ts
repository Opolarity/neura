import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  toExplosionOption,
  toProductionOrder,
  toProductionOrderDetail,
} from "../adapters/productionOrders.adapter";
import {
  ExplosionOption,
  ProductionOrder,
  ProductionOrderClassOption,
  ProductionOrderDetail,
  ProductionOrdersFilters,
  SaveProductionOrderData,
} from "../types/productionOrders.types";

/** Código del módulo del que cuelgan las clases de orden de producción. */
const SUPPLIERS_MODULE_CODE = "SPL";
/**
 * Catálogo de clases de ORDEN DE PRODUCCIÓN. Es su propio módulo, no el de
 * proveedores: 202609200002 lo creó precisamente porque `SPL` describe al
 * proveedor y no al proceso, y dejó escrito que el ERP pasaría a leer de aquí.
 */
const PRODUCTION_ORDER_MODULE_CODE = "OPR";

/** Tamaño del catálogo que alimenta el combobox de explosiones. */
const OPTIONS_PAGE_SIZE = 100;

interface ProductionOrdersListResponse {
  data: ProductionOrder[];
  pagination: PaginationState;
}

export const productionOrdersListApi = async (
  filters: ProductionOrdersFilters
): Promise<ProductionOrdersListResponse> => {
  const { page = 1, size = 20, search, production_order_class_id, type } = filters;

  const endpoint = buildEndpoint("get-production-orders", {
    page,
    size,
    search,
    production_order_class_id,
    type,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.ordersdata ?? { data: [], page: { page, size, total: 0 } };

  return {
    data: (raw.data ?? []).map(toProductionOrder),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

export const productionOrderByIdApi = async (
  id: number
): Promise<ProductionOrderDetail> => {
  const endpoint = buildEndpoint("get-production-order-by-id", { id });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toProductionOrderDetail(data?.order ?? {});
};

export const createProductionOrderApi = async (
  payload: SaveProductionOrderData
): Promise<void> => {
  const { error } = await supabase.functions.invoke("create-production-order", {
    method: "POST",
    body: payload,
  });

  if (error) throw error;
};

/**
 * El choque del bloqueo optimista: alguien más editó la orden mientras esta
 * pantalla la tenía abierta. Se distingue de un error de validación porque
 * la respuesta trae `conflict` y llega con 409, no con 400.
 */
export class ProductionOrderConflictError extends Error {
  readonly conflict = true;
}

export const updateProductionOrderApi = async (
  payload: SaveProductionOrderData
): Promise<void> => {
  const { error } = await supabase.functions.invoke("update-production-order", {
    method: "POST",
    body: payload,
  });

  if (!error) return;

  // `invoke` no trae el cuerpo del error: viene en `context`, que es la
  // Response cruda. Sin leerla, un conflicto llegaría como un error genérico
  // y la pantalla no podría ofrecer recargar.
  const respuesta = (error as { context?: Response }).context;
  if (respuesta && typeof respuesta.json === "function") {
    try {
      const cuerpo = await respuesta.clone().json();
      if (cuerpo?.conflict) throw new ProductionOrderConflictError(cuerpo.error);
      if (cuerpo?.error) throw new Error(cuerpo.error);
    } catch (parsed) {
      if (parsed instanceof Error && parsed.message) throw parsed;
    }
  }

  throw error;
};

/** Una prenda de la orden y cuántas se reciben de ella. */
export interface ReceiveProductionOrderItem {
  production_order_item_id: number;
  quantity_good: number;
  /**
   * Las que llegaron malas. Entran a stock igual —existen físicamente— pero
   * en su propio movimiento, con el almacén y el tipo que se elijan para
   * ellas. Cero u omitido: no se genera nada.
   */
  quantity_bad?: number;
}

/** A dónde entra lo que se recibe, y como qué. */
export interface ReceiveProductionOrderDestination {
  warehouseId: number;
  /** El tipo de stock de lo bueno. Sin él, el SP usa Producción. */
  stockTypeId?: number | null;
  /** El de la merma. Sin ellos, la merma va donde y como lo bueno. */
  badWarehouseId?: number | null;
  badStockTypeId?: number | null;
}

/**
 * Recibe a stock lo que salió de la orden.
 *
 * A diferencia del ingreso por servicio, **aquí no se busca la variación**: el
 * SP la lee de `production_order_items.variation_id`, que es el producto que ya
 * se eligió al armar los ítems, y rechaza los que no lo tengan.
 *
 * El stock lo sube el trigger de `stock_movements`; ni esta llamada ni la edge
 * function tocan `variation_stock`.
 */
export const receiveProductionOrderApi = async (
  productionOrderId: number,
  destination: ReceiveProductionOrderDestination,
  items: ReceiveProductionOrderItem[]
): Promise<{ stockEntryId: number | null }> => {
  const { data, error } = await supabase.functions.invoke(
    "receive-production-order",
    {
      method: "POST",
      body: {
        production_order_id: productionOrderId,
        warehouse_id: destination.warehouseId,
        stock_type_id: destination.stockTypeId ?? null,
        bad_warehouse_id: destination.badWarehouseId ?? null,
        bad_stock_type_id: destination.badStockTypeId ?? null,
        items,
      },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  // El id de la entrada de stock: es el correlativo de la guía de ingreso.
  const stockEntryId = data?.data?.stock_entry_id;
  return {
    stockEntryId:
      stockEntryId === undefined || stockEntryId === null ? null : Number(stockEntryId),
  };
};

/**
 * Cierra a mano el ingreso a stock de una prenda: «ya no entra más».
 *
 * Definitivo: no hay endpoint de reapertura. Tras esto el SP de recepción
 * rechaza la prenda, así que el diálogo la bloquea y el plan la pinta en verde.
 */
export const closeProductionOrderItemIntakeApi = async (
  productionOrderItemId: number,
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke(
    "close-production-order-item-intake",
    { method: "POST", body: { production_order_item_id: productionOrderItemId } },
  );
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};

/** Clases de orden de producción (classes filtradas por modules.code = 'SPL'). */
export const productionOrderClassesApi = async (): Promise<
  ProductionOrderClassOption[]
> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", PRODUCTION_ORDER_MODULE_CODE)
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

/**
 * Explosiones para el combobox de los ítems. Reutiliza get-explosions.
 *
 * Con `variationId` el filtro lo hace el SERVIDOR, y esa es la diferencia que
 * importa: la lista general trae una página, así que filtrar en cliente sobre
 * ella solo encuentra las recetas de la prenda si tuvieron la suerte de caer
 * en esa página. Con muchas recetas no caían, el filtro se quedaba vacío y el
 * combobox se abría con todas.
 */
export const explosionOptionsApi = async (
  search?: string | null,
  variationId?: number | null
): Promise<ExplosionOption[]> => {
  const endpoint = buildEndpoint("get-explosions", {
    page: 1,
    size: OPTIONS_PAGE_SIZE,
    search,
    variation_id: variationId ?? null,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (data?.explosionsdata?.data ?? []).map(toExplosionOption);
};

// ─────────────────────────────────────────────────────────────
// El producto final de un ítem
// ─────────────────────────────────────────────────────────────

/** Una variación candidata para vincular al ítem. */
export interface VariationOption {
  id: number;
  sku: string | null;
  productTitle: string;
  /**
   * Título del producto con los términos de la variación:
   * «Chompa Overtake Fire - M». Sin esto dos tallas de la misma prenda salen
   * con el mismo texto y solo se distinguen por el SKU, que no dice nada.
   */
  label: string;
  /**
   * Del PRODUCTO, no de la variación: `product_categories` y `product_tags`
   * cuelgan de `products`, así que todas las tallas comparten las mismas.
   */
  categories: string[];
  tags: string[];
  /** Para marcar en los selectores lo que el producto ya tiene. */
  categoryIds: number[];
  tagIds: number[];
  /**
   * El PRODUCTO de la variación. La taxonomía cuelga de él, así que sin este
   * id no se le puede añadir una categoría a la prenda que se acaba de elegir.
   */
  productId: number | null;
}

/** Embed de PostgREST: términos de la variación, y la taxonomía del producto. */
const PRODUCT_TAXONOMY_SELECT =
  "product_categories(categories(id, name)), product_tags(tags(id, name))";

const VARIATION_SELECT =
  `id, sku, products(id, title, ${PRODUCT_TAXONOMY_SELECT}), variation_terms(terms(name))`;

/** Nombres de las categorías del producto embebido, ordenados. */
const toCategoryNames = (product: any): string[] =>
  (product?.product_categories ?? [])
    .map((pc: any) => pc.categories?.name ?? "")
    .filter(Boolean)
    .sort((a: string, b: string) => a.localeCompare(b));

/** Nombres de las etiquetas del producto embebido, ordenados. */
const toTagNames = (product: any): string[] =>
  (product?.product_tags ?? [])
    .map((pt: any) => pt.tags?.name ?? "")
    .filter(Boolean)
    .sort((a: string, b: string) => a.localeCompare(b));

/**
 * Los ids de esa misma taxonomía.
 *
 * Los nombres sirven para pintar; los ids, para marcar lo que el producto YA
 * tiene en los selectores del diálogo. Casarlo por nombre funcionaría hasta la
 * primera categoría repetida con otra grafía.
 */
const toCategoryIds = (product: any): number[] =>
  (product?.product_categories ?? [])
    .map((pc: any) => pc.categories?.id)
    .filter((id: unknown): id is number => typeof id === "number");

const toTagIds = (product: any): number[] =>
  (product?.product_tags ?? [])
    .map((pt: any) => pt.tags?.id)
    .filter((id: unknown): id is number => typeof id === "number");

/** «Chompa Overtake Fire - M», o solo el título si no lleva términos. */
const toVariationLabel = (title: string, row: any): string => {
  const terms: string[] = (row.variation_terms ?? [])
    .map((vt: any) => vt.terms?.name ?? "")
    .filter(Boolean);

  return terms.length > 0 ? `${title} - ${terms.join(" / ")}` : title;
};

/** Un producto al que añadirle una talla más. */
export interface ProductOption {
  id: number;
  title: string;
  isVariable: boolean;
  categories: string[];
  tags: string[];
  /** Para marcar en los selectores lo que el producto ya tiene. */
  categoryIds: number[];
  tagIds: number[];
}

/**
 * Busca variaciones por SKU o por título del producto.
 *
 * Son dos consultas y no un `.or()` porque PostgREST no resuelve una columna
 * de un recurso embebido dentro de un `or` sobre un embed normal: hay que
 * forzar `!inner`, y entonces el filtro por SKU dejaría fuera las variaciones
 * cuyo producto no matchea. Separadas, cada rama filtra lo suyo y se unen
 * aquí deduplicando por id.
 */
export const searchVariationsApi = async (
  term: string
): Promise<VariationOption[]> => {
  const search = term.trim();
  if (!search) return [];

  const [bySku, byTitle] = await Promise.all([
    supabase
      .from("variations")
      .select(VARIATION_SELECT)
      .ilike("sku", `%${search}%`)
      .limit(OPTIONS_PAGE_SIZE),
    supabase
      .from("variations")
      .select(VARIATION_SELECT.replace("products(", "products!inner("))
      .ilike("products.title", `%${search}%`)
      .limit(OPTIONS_PAGE_SIZE),
  ]);

  if (bySku.error) throw bySku.error;
  if (byTitle.error) throw byTitle.error;

  const merged = new Map<number, VariationOption>();
  [...(bySku.data ?? []), ...(byTitle.data ?? [])].forEach((row: any) => {
    if (!merged.has(row.id)) {
      const product = row.products as Record<string, unknown> | null;
      const title = (product?.title as string | undefined) ?? "";
      merged.set(row.id, {
        id: row.id,
        sku: row.sku ?? null,
        productTitle: title,
        label: toVariationLabel(title, row),
        categories: toCategoryNames(product),
        tags: toTagNames(product),
        categoryIds: toCategoryIds(product),
        tagIds: toTagIds(product),
        productId: (product?.id as number | undefined) ?? null,
      });
    }
  });

  return Array.from(merged.values()).slice(0, OPTIONS_PAGE_SIZE);
};

/**
 * Una variación concreta, con su etiqueta y la clasificación de su producto.
 *
 * Hace falta porque el selector compartido busca en el catálogo de venta y
 * devuelve producto, talla y sku, pero no las categorías ni las etiquetas — que
 * cuelgan del producto y son lo que el diálogo deja editar. Es una consulta
 * más al elegir, no en cada tecla.
 */
export const variationByIdApi = async (
  variationId: number
): Promise<VariationOption | null> => {
  const { data, error } = await supabase
    .from("variations")
    .select(VARIATION_SELECT)
    .eq("id", variationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Los embebidos de PostgREST no se infieren bien con este select, y el
  // fichero ya vive con eso; aqui basta con nombrar lo que se usa.
  const row = data as unknown as {
    id: number;
    sku: string | null;
    products: Record<string, unknown> | null;
    variation_terms?: unknown;
  };
  const product = row.products;
  const title = (product?.title as string | undefined) ?? "";

  return {
    id: row.id,
    sku: row.sku ?? null,
    productTitle: title,
    label: toVariationLabel(title, row),
    categories: toCategoryNames(product),
    tags: toTagNames(product),
    categoryIds: toCategoryIds(product),
    tagIds: toTagIds(product),
    productId: (product?.id as number | undefined) ?? null,
  };
};

/**
 * Un producto concreto, con su clasificación.
 *
 * Lo mismo que `variationByIdApi` pero para el modo «añadir una talla»: el
 * selector compartido devuelve id y título, y lo demás --si es variable, sus
 * categorías y etiquetas-- cuelga del producto y hay que pedirlo.
 */
export const productByIdApi = async (
  productId: number
): Promise<ProductOption | null> => {
  const { data, error } = await supabase
    .from("products")
    .select(`id, title, is_variable, ${PRODUCT_TAXONOMY_SELECT}`)
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: number;
    title: string;
    is_variable: boolean | null;
  };

  return {
    id: row.id,
    title: row.title,
    isVariable: Boolean(row.is_variable),
    categories: toCategoryNames(data),
    tags: toTagNames(data),
    categoryIds: toCategoryIds(data),
    tagIds: toTagIds(data),
  };
};

/** Una talla que el producto YA tiene. */
export interface ProductVariationSummary {
  id: number;
  sku: string | null;
  /** Los términos de la variación: «M», «Azul»… Vacío si no tiene ninguno. */
  terms: string[];
}

/**
 * Las tallas que ya tiene un producto.
 *
 * Para el modo «añadir una talla»: antes de elegir los atributos de la nueva
 * hay que poder ver cuáles existen, que es lo que evita pedir una que ya está.
 * `productByIdApi` no las trae -- solo mira `products` -- y aquí hace falta la
 * puente `variation_terms`.
 */
export const productVariationsApi = async (
  productId: number
): Promise<ProductVariationSummary[]> => {
  const { data, error } = await supabase
    .from("variations")
    .select("id, sku, variation_terms(terms(name))")
    .eq("product_id", productId)
    .order("id");

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: number;
    sku: string | null;
    variation_terms?: Array<{ terms?: { name?: string } | null }> | null;
  }>).map((row) => ({
    id: row.id,
    sku: row.sku ?? null,
    terms: (row.variation_terms ?? [])
      .map((vt) => vt.terms?.name ?? "")
      .filter(Boolean),
  }));
};

/** Una imagen del producto, tal como se guarda. */
export interface ProductImage {
  id: number;
  url: string;
  order: number;
}

/**
 * Las imágenes de un producto.
 *
 * Del PRODUCTO, no de la variación: `variation_images` es solo el reparto de
 * esas mismas fotos entre las tallas, así que una prenda «sin imagen» lo está
 * a nivel de producto y es ahí donde hay que subirla.
 */
export const productImagesApi = async (
  productId: number
): Promise<ProductImage[]> => {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, image_url, image_order")
    .eq("product_id", productId)
    .order("image_order");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.image_url,
    order: row.image_order,
  }));
};

/**
 * Subirle una imagen a un producto que ya existe.
 *
 * Va directo a `product_images` en vez de pasar por `update-product`: esa edge
 * function pide el producto entero --precios, canales, variaciones-- y aquí
 * solo se está añadiendo una foto. Mandar un producto reconstruido a medias
 * para colgar una imagen es la forma segura de borrar algo sin querer.
 *
 * El fichero se guarda bajo su producto y no en `tmp/`: esa carpeta la vacía
 * el alta, y una imagen subida por este camino no pasa por ahí.
 */
export const addProductImageApi = async (
  productId: number,
  file: File
): Promise<ProductImage> => {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `products-images/product-${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("products").getPublicUrl(path);

  // Al final de las que ya tiene: subir una foto no reordena las anteriores.
  const existing = await productImagesApi(productId);
  const order =
    existing.reduce((max, image) => Math.max(max, image.order), -1) + 1;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_url: publicUrl, image_order: order })
    .select("id, image_url, image_order")
    .single();

  if (error) throw error;

  return { id: data.id, url: data.image_url, order: data.image_order };
};

/**
 * Quitarle una foto a un producto.
 *
 * Primero el REPARTO y después la foto: `variation_images` solo distribuye las
 * fotos del producto entre sus tallas, y su FK a `product_images` no lleva
 * `ON DELETE CASCADE` -- sin borrar el reparto antes, el delete muere con un
 * 23503. Quitar la foto del producto es quitarla también de sus tallas, que es
 * justo lo que se espera.
 *
 * El fichero se queda en storage. Borrarlo obligaría a estar seguro de que no
 * lo referencia nadie más, y un huérfano en el bucket no rompe nada; una
 * imagen borrada que otra fila sigue apuntando, sí.
 */
export const deleteProductImageApi = async (imageId: number): Promise<void> => {
  // `as any` como en el resto del fichero: los tipos generados de esta tabla
  // hacen que el cliente se instancie en profundidad y tsc se rinda (TS2589).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: repartoError } = await (supabase as any)
    .from("product_variation_images")
    .delete()
    .eq("product_image_id", imageId);

  if (repartoError) throw repartoError;

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw error;
};

/**
 * Reordenar las fotos de un producto.
 *
 * El orden importa: la primera es la que sale como referencia en la Orden de
 * Producción.
 *
 * Una a una y en orden, no con un upsert: son tres o cuatro fotos, y un upsert
 * obligaría a reenviar `product_id` e `image_url` --que no cambian-- con el
 * riesgo de pisarlos si el objeto se arma mal.
 */
export const reorderProductImagesApi = async (
  orderedImageIds: number[]
): Promise<void> => {
  for (let index = 0; index < orderedImageIds.length; index += 1) {
    const { error } = await supabase
      .from("product_images")
      .update({ image_order: index })
      .eq("id", orderedImageIds[index]);

    if (error) throw error;
  }
};

/** Productos por título, para añadirles una talla nueva. */
export const searchProductsApi = async (
  term: string
): Promise<ProductOption[]> => {
  const search = term.trim();
  if (!search) return [];

  const { data, error } = await supabase
    .from("products")
    .select(`id, title, is_variable, ${PRODUCT_TAXONOMY_SELECT}`)
    .ilike("title", `%${search}%`)
    .eq("is_active", true)
    .order("title")
    .limit(OPTIONS_PAGE_SIZE);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title ?? "",
    isVariable: Boolean(row.is_variable),
    // Aquí la taxonomía viene del propio producto, no de un embed anidado.
    categories: toCategoryNames(row),
    tags: toTagNames(row),
    categoryIds: toCategoryIds(row),
    tagIds: toTagIds(row),
  }));
};

/**
 * Añade una variación a un producto que ya existe.
 *
 * Es el caso de la segunda talla en adelante: la prenda es UN producto con
 * varias variaciones, no un producto por talla. Si esa combinación de
 * términos ya está, el SP devuelve la que hay en vez de duplicarla.
 */
export const addProductVariationApi = async (
  productId: number,
  termIds: number[],
  /**
   * La taxonomía es del producto y `add-product-variation` no la devuelve.
   * Quien llama ya tiene el producto seleccionado, así que la pasa en vez de
   * pagar una consulta más por un dato que ya está en pantalla.
   */
  taxonomy: {
    categories: string[];
    tags: string[];
    categoryIds: number[];
    tagIds: number[];
  } = { categories: [], tags: [], categoryIds: [], tagIds: [] }
): Promise<VariationOption> => {
  const { data, error } = await supabase.functions.invoke(
    "add-product-variation",
    { method: "POST", body: { product_id: productId, term_ids: termIds } }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const row = data?.data;
  if (!row?.id) throw new Error("La variación se creó pero no devolvió su id");

  const title = row.product_title ?? "";
  const terms: string[] = row.variation_terms ?? [];

  return {
    id: Number(row.id),
    sku: row.sku ?? null,
    productTitle: title,
    label: terms.length > 0 ? `${title} - ${terms.join(" / ")}` : title,
    categories: taxonomy.categories,
    tags: taxonomy.tags,
    categoryIds: taxonomy.categoryIds,
    tagIds: taxonomy.tagIds,
    productId,
  };
};

/**
 * Todas las variaciones de un producto, en orden de alta.
 *
 * create-product solo devuelve el id del producto: cuando el alta trae varias
 * tallas de golpe hay que releerlas todas para repartirlas en los ítems.
 */
export const variationsOfProductApi = async (
  productId: number
): Promise<VariationOption[]> => {
  const { data, error } = await supabase
    .from("variations")
    .select(VARIATION_SELECT)
    .eq("product_id", productId)
    .order("id", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const product = row.products as Record<string, unknown> | null;
    const title = (product?.title as string | undefined) ?? "";
    return {
      id: row.id,
      sku: row.sku ?? null,
      productTitle: title,
      label: toVariationLabel(title, row),
      categories: toCategoryNames(product),
      tags: toTagNames(product),
      categoryIds: toCategoryIds(product),
      tagIds: toTagIds(product),
      productId,
    };
  });
};

/** La variación de un producto recién creado (siempre crea exactamente una). */
export const firstVariationOfProductApi = async (
  productId: number
): Promise<VariationOption | null> => {
  const { data, error } = await supabase
    .from("variations")
    .select(VARIATION_SELECT)
    .eq("product_id", productId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const product = (data as any).products as Record<string, unknown> | null;
  const title = (product?.title as string | undefined) ?? "";
  return {
    id: (data as any).id,
    sku: (data as any).sku ?? null,
    productTitle: title,
    label: toVariationLabel(title, data),
    categories: toCategoryNames(product),
    tags: toTagNames(product),
    categoryIds: toCategoryIds(product),
    tagIds: toTagIds(product),
    productId,
  };
};

/** Etiquetas para clasificar. `getTags` del módulo de productos es paginada y
 *  viene con forma de tabla; aquí hace falta la lista suelta. */
export const tagOptionsApi = async (): Promise<{ id: number; name: string }[]> => {
  const { data, error } = await (supabase as any)
    .from("tags")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};

/**
 * Añade categorías y etiquetas al producto, **sin quitar** las que ya tiene.
 *
 * Desde la orden no se ve el cuadro completo del producto, así que mandar una
 * lista "completa" desde aquí borraría lo que se clasificó en Productos.
 */
export const addProductTaxonomyApi = async (
  productId: number,
  categoryIds: number[],
  tagIds: number[]
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke(
    "add-product-taxonomy",
    {
      method: "POST",
      body: {
        product_id: productId,
        category_ids: categoryIds,
        tag_ids: tagIds,
      },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};

/**
 * Cambiar SOLO la fecha de término de una orden.
 *
 * Existe porque una orden que ya salió de borrador no se edita: el formulario
 * entero se bloquea, y con razón — mover cantidades o prendas de una orden que
 * ya está en los talleres descuadra lo que se pidió con lo que se está
 * haciendo. La fecha de término es la excepción: es un dato del cierre, no del
 * encargo, y a veces hay que corregirla a mano.
 *
 * Manda solo `id` y `finish_date`: la edge function deja fuera del UPDATE todo
 * lo que no venga, y sin `items` no se tocan las prendas. Mandar el formulario
 * entero pasaría por `fn_replace_production_order_items`, que rehace los ítems
 * y su stock, para cambiar una fecha.
 */
export const updateProductionOrderFinishDateApi = async (
  id: number,
  finishDate: string | null,
  expectedUpdatedAt?: string | null
): Promise<void> => {
  const { error } = await supabase.functions.invoke("update-production-order", {
    method: "POST",
    body: {
      id,
      finish_date: finishDate,
      ...(expectedUpdatedAt === undefined
        ? {}
        : { expected_updated_at: expectedUpdatedAt }),
    },
  });

  if (!error) return;

  // Mismo desempaquetado que updateProductionOrderApi: el cuerpo del error
  // viene en `context`, y sin leerlo un conflicto llegaría como error genérico.
  const respuesta = (error as { context?: Response }).context;
  if (respuesta && typeof respuesta.json === "function") {
    try {
      const cuerpo = await respuesta.clone().json();
      if (cuerpo?.conflict) throw new ProductionOrderConflictError(cuerpo.error);
      if (cuerpo?.error) throw new Error(cuerpo.error);
    } catch (parseError) {
      if (parseError instanceof ProductionOrderConflictError) throw parseError;
      if (parseError instanceof Error && parseError.message) throw parseError;
    }
  }

  throw error;
};
