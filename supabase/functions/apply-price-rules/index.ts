import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


const CAT = {
  POLOS: { id: 48 },
  PERFUMES: { id: 50 },
  BOXERS: { id: 40 },
  MEDIAS: { id: 32 },
  POLOSKIDS: { id: 0 },  // ← reemplazar con el ID real de la categoría
} as const;

const EXCLUDED = {
  POLOS_PREMIUM: [113647, 113642, 113637, 113632, 107302, 107297, 107292, 107308, 117135, 117130, 117125, 91783],
  GORRAS_HEAVY_WEIGHT: [71157, 71158],
} as const;

const GIFT = {
  REGALO_DEL_MES: { id: 232 }, // variation ID del regalo
  REGALO_POR_COMPRA: { id: 118539 },
} as const;

interface CartItem {
  variationId: number;
  productId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  [key: string]: unknown;
}

interface CartItemWithCategory extends CartItem {
  categoryIds: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICACIÓN DE CATEGORÍAS
// ─────────────────────────────────────────────────────────────────────────────

async function verifItemCategory(
  supabase: ReturnType<typeof createClient>,
  items: CartItem[]
): Promise<CartItemWithCategory[]> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  if (productIds.length === 0) return [];

  const { data: productCats, error: catError } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", productIds);

  if (catError) throw new Error(`Error fetching product_categories: ${catError.message}`);

  const productToCategories = new Map<number, number[]>();
  for (const row of productCats ?? []) {
    const list = productToCategories.get(row.product_id) ?? [];
    list.push(row.category_id);
    productToCategories.set(row.product_id, list);
  }

  return items.map((item) => ({
    ...item,
    categoryIds: productToCategories.get(item.productId) ?? [],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// REGLAS DE PRECIO
// ─────────────────────────────────────────────────────────────────────────────

function applyPriceRules(items: CartItemWithCategory[], levelDiscount = 0): CartItemWithCategory[] {
  let totalPolos = 0;
  let totalBoxers = 0;
  let totalPerfumes = 0;
  let totalMedias = 0;

  for (const item of items) {
    if (item.categoryIds.includes(CAT.POLOS.id)) totalPolos += item.quantity;
    else if (item.categoryIds.includes(CAT.BOXERS.id)) totalBoxers += item.quantity;
    else if (item.categoryIds.includes(CAT.PERFUMES.id)) totalPerfumes += item.quantity;
    else if (item.categoryIds.includes(CAT.MEDIAS.id)) totalMedias += item.quantity;
  }

  let unidadesPolos3 = Math.floor(totalPolos / 3) * 3;
  let unidadesPolos2 = Math.floor((totalPolos % 3) / 2) * 2;
  let unidadesBoxers3 = Math.floor(totalBoxers / 3) * 3;
  let unidadesBoxers2 = Math.floor((totalBoxers % 3) / 2) * 2;
  let unidadesPerfumes2 = Math.floor(totalPerfumes / 2) * 2;
  let unidadesMedias3 = Math.floor(totalMedias / 3) * 3;
  let unidadesMedias2 = Math.floor((totalMedias % 3) / 2) * 2;

  return items.map((item) => {
    const isPolo = item.categoryIds.includes(CAT.POLOS.id);
    const isBoxer = !isPolo && item.categoryIds.includes(CAT.BOXERS.id);
    const isPerfume = !isPolo && !isBoxer && item.categoryIds.includes(CAT.PERFUMES.id);
    const isMedias = !isPolo && !isBoxer && !isPerfume && item.categoryIds.includes(CAT.MEDIAS.id);

    if (!isPolo && !isBoxer && !isPerfume && !isMedias) {
      const discounted = Number((item.originalPrice * (1 - levelDiscount)).toFixed(2));
      return { ...item, price: discounted };
    }

    let enPack3 = 0;
    let enPack2 = 0;
    let price3 = 0;
    let price2 = 0;

    if (isPolo) {
      enPack3 = Math.min(item.quantity, unidadesPolos3); unidadesPolos3 -= enPack3;
      enPack2 = Math.min(item.quantity - enPack3, unidadesPolos2); unidadesPolos2 -= enPack2;
      price3 = 56.666; price2 = 59;
    } else if (isBoxer) {
      enPack3 = Math.min(item.quantity, unidadesBoxers3); unidadesBoxers3 -= enPack3;
      enPack2 = Math.min(item.quantity - enPack3, unidadesBoxers2); unidadesBoxers2 -= enPack2;
      price3 = 26.33; price2 = 30;
    } else if (isPerfume) {
      enPack2 = Math.min(item.quantity, unidadesPerfumes2); unidadesPerfumes2 -= enPack2;
      price2 = 49.5;
    } else if (isMedias) {
      enPack3 = Math.min(item.quantity, unidadesMedias3); unidadesMedias3 -= enPack3;
      enPack2 = Math.min(item.quantity - enPack3, unidadesMedias2); unidadesMedias2 -= enPack2;
      price3 = 20; price2 = 25;
    }

    const sinDescuento = item.quantity - enPack3 - enPack2;
    const precioSuelto = item.originalPrice * (1 - levelDiscount);
    const totalPack3 = enPack3 * price3 - (isPolo && enPack3 > 0 ? Math.round(levelDiscount * 100) : 0);
    const newPrice = (totalPack3 + (enPack2 * price2) + (sinDescuento * precioSuelto)) / item.quantity;

    return { ...item, price: newPrice };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REGALOS — qué variationIds aplican como regalo
// ─────────────────────────────────────────────────────────────────────────────

function applyGifts(items: CartItemWithCategory[]): number[] {
  const giftIds: number[] = [];

  // Regalo por categoría: ≥1 polo kids → regalo del mes
  const totalPolos = items
    .filter((i) => i.categoryIds.includes(CAT.POLOS.id))
    .reduce((sum, i) => sum + i.quantity, 0);

  if (totalPolos >= 1) {
    giftIds.push(GIFT.REGALO_DEL_MES.id);
  }

  // Regalo por subtotal (descomentar cuando se active):
  // const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // if (subtotal >= 200) giftIds.push(GIFT.REGALO_DEL_MES.id);

  return [...new Set(giftIds)]; // sin duplicados si varias reglas aplican el mismo regalo
}

// ─────────────────────────────────────────────────────────────────────────────
// Obtiene info de producto para los regalos — misma estructura que SP
// ─────────────────────────────────────────────────────────────────────────────

async function fetchGiftItems(
  supabase: ReturnType<typeof createClient>,
  variationIds: number[]
): Promise<any[]> {
  if (variationIds.length === 0) return [];

  const { data: variations, error: varError } = await supabase
    .from("variations")
    .select("id, sku, product_id")
    .in("id", variationIds);

  if (varError) throw new Error(`Error fetching gift variations: ${varError.message}`);
  if (!variations || variations.length === 0) return [];

  const productIds = [...new Set(variations.map((v: any) => v.product_id))];

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, title, short_description")
    .in("id", productIds);

  if (prodError) throw new Error(`Error fetching gift products: ${prodError.message}`);

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, image_url, image_order")
    .in("product_id", productIds)
    .order("image_order", { ascending: true });

  const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));
  const imageMap = new Map<number, string>();
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img.image_url);
  }

  // Construir con la misma estructura que retorna el SP en cartItems
  return variations.map((v: any) => {
    const product = productMap.get(v.product_id);
    return {
      id: null,
      product_variation_id: v.id,
      quantity: 1,
      product_price: 0,
      product_discount: 0,
      warehouse_id: 1,
      is_active: true,
      isGift: true,
      product: {
        id: product?.id ?? null,
        title: product?.title ?? "Regalo",
        image_url: imageMap.get(v.product_id) ?? "/placeholder.svg",
        short_description: product?.short_description ?? "",
      },
      variation: {
        id: v.id,
        sku: v.sku,
        name: "Regalo del mes",
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { items, levelDiscount = 0 } = await req.json() as { items: CartItem[]; levelDiscount?: number };

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "items array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const itemsWithCategory = await verifItemCategory(supabase, items);
    const result = applyPriceRules(itemsWithCategory, levelDiscount);
    const giftVariationIds = applyGifts(itemsWithCategory);
    const gifts = await fetchGiftItems(supabase, giftVariationIds);

    return new Response(
      JSON.stringify({ items: result, gifts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in apply-price-rules:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
