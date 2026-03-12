import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-channel-code",
};

// --- CONFIGURACIÓN DE NIVELES ---
const LEVEL_DISCOUNTS = {
  LEVEL_1: { min: 150, max: 749.99, discount: 0.05 },
  LEVEL_2: { min: 750, max: 1499, discount: 0.10 },
  LEVEL_3: { min: 1500, max: 2999, discount: 0.15 },
  LEVEL_4: { min: 3000, max: Infinity, discount: 0.30 },
} as const;

// --- CATEGORÍAS (pueden ser padre o hijo — se resuelven automáticamente) ---
const CAT = {
  POLOS: { id: 147 },
  PERFUMES: { id: 50 },
  BOXERS: { id: 40 },
  MEDIAS: { id: 32 },
};

// --- REGALOS ---
const GIFT_CONFIG = {
  REGALO_DEL_MES: { id: 236 },
};

// --- INTERFACES ---
interface CartItem {
  variationId: number;
  quantity: number;
  product_price: number;
  regular_price: number;
  sale_price: number | null;
}

interface CartItemWithCategory extends CartItem {
  categoryIds: number[];
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE APOYO
// ════════════════════════════════════════════════════════════════════════════

async function getPriceListCode(supabase: any, priceListId: number): Promise<string | null> {
  const { data } = await supabase.from("price_list").select("code").eq("id", priceListId).maybeSingle();
  return data?.code || null;
}

async function getCustomerPoints(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase.from("profiles").select(`accounts ( customer_profile ( points ) )`).eq("UID", userId).maybeSingle();
  if (!data) return 0;
  const accountData = Array.isArray(data.accounts) ? data.accounts[0] : (data.accounts as any);
  const customerProfile = Array.isArray(accountData?.customer_profile) ? accountData.customer_profile[0] : accountData?.customer_profile;
  return customerProfile?.points ?? 0;
}

/**
 * Dado un categoryId raíz, devuelve ese id + todos sus descendientes
 * usando la tabla `categories` con columna `parent_category`.
 */
function getDescendants(allCategories: { id: number; parent_category: number | null }[], rootId: number): number[] {
  const result: number[] = [rootId];
  const queue: number[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = allCategories
      .filter((c) => c.parent_category === current)
      .map((c) => c.id);
    result.push(...children);
    queue.push(...children);
  }

  return result;
}

/**
 * Construye un mapa { catId raíz → [catId raíz, ...hijos, ...nietos] }
 * para las categorías definidas en CAT.
 */
async function buildCategoryMap(supabase: any): Promise<Map<number, number[]>> {
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, parent_category");

  const map = new Map<number, number[]>();

  for (const cat of Object.values(CAT)) {
    map.set(cat.id, getDescendants(allCategories ?? [], cat.id));
  }

  return map;
}

async function verifItemCategory(supabase: any, items: CartItem[]): Promise<CartItemWithCategory[]> {
  const variationIds = [...new Set(items.map((i) => i.variationId))].filter(Boolean);
  if (variationIds.length === 0) return items.map((i) => ({ ...i, categoryIds: [] }));

  const { data: variations } = await supabase.from("variations").select("id, product_id").in("id", variationIds);
  const variationToProduct = new Map(variations?.map((v: any) => [v.id, v.product_id]));
  const productIds = [...new Set([...variationToProduct.values()])] as number[];

  const { data: productCats } = await supabase.from("product_categories").select("product_id, category_id").in("product_id", productIds);
  const productToCategories = new Map<number, number[]>();
  productCats?.forEach((row: any) => {
    const list = productToCategories.get(row.product_id) ?? [];
    list.push(row.category_id);
    productToCategories.set(row.product_id, list);
  });

  return items.map((item) => ({
    ...item,
    categoryIds: productToCategories.get(variationToProduct.get(item.variationId) as number) ?? [],
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS — verifica si un item pertenece a una categoría (incluye hijos)
// ════════════════════════════════════════════════════════════════════════════

function inCat(item: CartItemWithCategory, catId: number, catMap: Map<number, number[]>): boolean {
  const ids = catMap.get(catId) ?? [catId];
  return item.categoryIds.some((c) => ids.includes(c));
}

// ════════════════════════════════════════════════════════════════════════════
// REGLAS PARA MINORISTAS (MIN)
// ════════════════════════════════════════════════════════════════════════════

function applyPriceRulesMIN(items: CartItemWithCategory[], catMap: Map<number, number[]>): CartItemWithCategory[] {
  let tP = 0, tB = 0, tPerf = 0, tM = 0;

  items.forEach((i) => {
    if (inCat(i, CAT.POLOS.id, catMap)) tP += i.quantity;
    else if (inCat(i, CAT.BOXERS.id, catMap)) tB += i.quantity;
    else if (inCat(i, CAT.PERFUMES.id, catMap)) tPerf += i.quantity;
    else if (inCat(i, CAT.MEDIAS.id, catMap)) tM += i.quantity;
  });

  let uP3 = Math.floor(tP / 3) * 3, uP2 = Math.floor((tP % 3) / 2) * 2;
  let uB3 = Math.floor(tB / 3) * 3, uB2 = Math.floor((tB % 3) / 2) * 2;
  let uPerf2 = Math.floor(tPerf / 2) * 2;
  let uM3 = Math.floor(tM / 3) * 3, uM2 = Math.floor((tM % 3) / 2) * 2;

  return items.map((item) => {
    const isP = inCat(item, CAT.POLOS.id, catMap);
    const isB = inCat(item, CAT.BOXERS.id, catMap);
    const isPerf = inCat(item, CAT.PERFUMES.id, catMap);
    const isM = inCat(item, CAT.MEDIAS.id, catMap);

    if (!isP && !isB && !isPerf && !isM) return { ...item, product_price: item.regular_price };

    let en3 = 0, en2 = 0, p3 = 0, p2 = 0;

    if (isP) {
      en3 = Math.min(item.quantity, uP3); uP3 -= en3;
      en2 = Math.min(item.quantity - en3, uP2); uP2 -= en2;
      p3 = 56.666; p2 = 59;
    } else if (isB) {
      en3 = Math.min(item.quantity, uB3); uB3 -= en3;
      en2 = Math.min(item.quantity - en3, uB2); uB2 -= en2;
      p3 = 26.33; p2 = 30;
    } else if (isPerf) {
      en2 = Math.min(item.quantity, uPerf2); uPerf2 -= en2;
      p2 = 49.5;
    } else if (isM) {
      en3 = Math.min(item.quantity, uM3); uM3 -= en3;
      en2 = Math.min(item.quantity - en3, uM2); uM2 -= en2;
      p3 = 20; p2 = 25;
    }

    const rest = item.quantity - en3 - en2;
    const nPrice = ((en3 * p3) + (en2 * p2) + (rest * item.regular_price)) / item.quantity;
    return { ...item, product_price: parseFloat(nPrice.toFixed(2)) };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// LÓGICA DE REGALOS (ARRAY SEPARADO)
// ════════════════════════════════════════════════════════════════════════════

async function fetchGiftsForItems(supabase: any, items: CartItemWithCategory[], catMap: Map<number, number[]>): Promise<any[]> {
  const giftIds: number[] = [];
  const totalPolos = items
    .filter((i) => inCat(i, CAT.POLOS.id, catMap))
    .reduce((s, i) => s + i.quantity, 0);

  if (totalPolos >= 1) giftIds.push(GIFT_CONFIG.REGALO_DEL_MES.id);
  if (giftIds.length === 0) return [];

  const { data: variations } = await supabase
    .from("variations")
    .select(`id, sku, product_id, products ( title )`)
    .in("id", giftIds);

  if (!variations) return [];

  return variations.map((v: any) => ({
    variation_id: v.id,
    product_name: `(REGALO) ${v.products?.title}`,
    sku: v.sku,
    quantity: 1,
    product_price: 0,
    isGift: true,
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { items, userId, priceListId } = await req.json();

    const [priceListCode, itemsWithCategory, catMap] = await Promise.all([
      getPriceListCode(supabase, priceListId),
      verifItemCategory(supabase, items),
      buildCategoryMap(supabase),      // ← trae categorías con sus hijos
    ]);

    let resultItems = [...itemsWithCategory];
    let gifts: any[] = [];

    // --- REGLAS SEGÚN LISTA DE PRECIOS ---
    if (priceListCode === "MIN") {
      // 1. Packs (3x, 2x)
      resultItems = applyPriceRulesMIN(resultItems, catMap);

      // 2. Descuento de Nivel (Puntos)
      const points = userId ? await getCustomerPoints(supabase, userId) : 0;
      let disc = 0;
      for (const l of Object.values(LEVEL_DISCOUNTS)) {
        if (points >= l.min && points <= l.max) { disc = l.discount; break; }
      }
      if (disc > 0) {
        resultItems = resultItems.map((i) => ({
          ...i,
          product_price: parseFloat((i.product_price * (1 - disc)).toFixed(2)),
        }));
      }

      // 3. Regalos (solo para MIN)
      gifts = await fetchGiftsForItems(supabase, itemsWithCategory, catMap);

    } else if (priceListCode === "MAY") {
      // Reglas para Mayoristas (Futuro)
      console.log("Aplicando lógica MAY...");
    }

    return new Response(JSON.stringify({ items: resultItems, gifts }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});