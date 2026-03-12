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

const LEVEL_POLO_DISCOUNT: Record<string, number> = {
  LEVEL_1: 5,
  LEVEL_2: 10,
  LEVEL_3: 15,
  LEVEL_4: 20,
};

// --- CATEGORÍAS ---
const CAT = {
  POLOS: { id: 147 },
  PERFUMES: { id: 83 },
  BOXERS: { id: 118 },
  GORRAS_Y_CANGUROS: { id: 109, id2: 83, id3: 80 },
  MEDIAS: { id: 144 },
  MOCHILAS: { id: 123 },
  POLERAS: { id: 93 },
  PANTALONES: { id: 140 },
  PREMIUM: { id: 67 },
  HEAVY_WEIGHT: { id: 65 },
  CLASICOS_Y_CAMISEROS: { id: 136, id2: 110 },
  KIDS: { id: 74 },
  LANYARD: { id: 119 },
};

const GC_IDS = [
  CAT.GORRAS_Y_CANGUROS.id,
  CAT.GORRAS_Y_CANGUROS.id2,
  CAT.GORRAS_Y_CANGUROS.id3,
];

const CYC_IDS = [
  CAT.CLASICOS_Y_CAMISEROS.id,
  CAT.CLASICOS_Y_CAMISEROS.id2,
];

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

interface DiscountEntry {
  name: string;
  discount: number; // monto en S/ (positivo = cargo, negativo = descuento)
  percent: number;  // porcentaje aplicado (informativo)
  code: string;     // código para order_discounts
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE APOYO
// ════════════════════════════════════════════════════════════════════════════

async function getPriceListCode(supabase: any, priceListId: number): Promise<string | null> {
  const { data } = await supabase.from("price_list").select("code").eq("id", priceListId).maybeSingle();
  return data?.code || null;
}

async function getCustomerPoints(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select(`accounts ( customer_profile ( points ) )`)
    .eq("UID", userId)
    .maybeSingle();
  if (!data) return 0;
  const accountData = Array.isArray(data.accounts) ? data.accounts[0] : (data.accounts as any);
  const customerProfile = Array.isArray(accountData?.customer_profile)
    ? accountData.customer_profile[0]
    : accountData?.customer_profile;
  return customerProfile?.points ?? 0;
}

function getDescendants(
  allCategories: { id: number; parent_category: number | null }[],
  rootId: number
): number[] {
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

  const { data: variations } = await supabase
    .from("variations")
    .select("id, product_id")
    .in("id", variationIds);

  const variationToProduct = new Map(variations?.map((v: any) => [v.id, v.product_id]));
  const productIds = [...new Set([...variationToProduct.values()])] as number[];

  const { data: productCats } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", productIds);

  const productToCategories = new Map<number, number[]>();
  productCats?.forEach((row: any) => {
    const list = productToCategories.get(row.product_id) ?? [];
    list.push(row.category_id);
    productToCategories.set(row.product_id, list);
  });

  return items.map((item) => ({
    ...item,
    categoryIds:
      productToCategories.get(variationToProduct.get(item.variationId) as number) ?? [],
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function inCat(item: CartItemWithCategory, catId: number, catMap: Map<number, number[]>): boolean {
  const ids = catMap.get(catId) ?? [catId];
  return item.categoryIds.some((c) => ids.includes(c));
}

function inGC(item: CartItemWithCategory, catMap: Map<number, number[]>): boolean {
  return GC_IDS.some((id) => (catMap.get(id) ?? [id]).some((c) => item.categoryIds.includes(c)));
}

function inCYC(item: CartItemWithCategory, catMap: Map<number, number[]>): boolean {
  return CYC_IDS.some((id) => (catMap.get(id) ?? [id]).some((c) => item.categoryIds.includes(c)));
}

// ════════════════════════════════════════════════════════════════════════════
// REGLAS PARA MINORISTAS (MIN)
// ════════════════════════════════════════════════════════════════════════════

function applyPriceRulesMIN(
  items: CartItemWithCategory[],
  catMap: Map<number, number[]>,
): CartItemWithCategory[] {

  let tP = 0, tB = 0, tPerf = 0, tM = 0, tGC = 0, tCYC = 0;
  let tKids = 0;

  items.forEach((i) => {
    if (inCat(i, CAT.KIDS.id, catMap)) tKids += i.quantity;
    else if (inCat(i, CAT.POLOS.id, catMap)) tP += i.quantity;
    else if (inCat(i, CAT.BOXERS.id, catMap)) tB += i.quantity;
    else if (inCat(i, CAT.PERFUMES.id, catMap)) tPerf += i.quantity;
    else if (inCat(i, CAT.MEDIAS.id, catMap)) tM += i.quantity;
    else if (inGC(i, catMap)) tGC += i.quantity;
    else if (inCYC(i, catMap)) tCYC += i.quantity;
  });

  let uP3 = Math.floor(tP / 3) * 3, uP2 = Math.floor((tP % 3) / 2) * 2;
  let uB3 = Math.floor(tB / 3) * 3, uB2 = Math.floor((tB % 3) / 2) * 2;
  let uPerf2 = Math.floor(tPerf / 2) * 2;
  let uM3 = Math.floor(tM / 3) * 3, uM2 = Math.floor((tM % 3) / 2) * 2;
  let uGC2 = Math.floor(tGC / 2) * 2;
  let uCYC3 = Math.floor(tCYC / 3) * 3;
  let uKids3 = Math.floor(tKids / 3) * 3;
  let uKids2 = Math.floor((tKids % 3) / 2) * 2;

  return items.map((item) => {
    const isKids = inCat(item, CAT.KIDS.id, catMap);
    const isP = !isKids && inCat(item, CAT.POLOS.id, catMap);
    const isB = inCat(item, CAT.BOXERS.id, catMap);
    const isPerf = inCat(item, CAT.PERFUMES.id, catMap);
    const isM = inCat(item, CAT.MEDIAS.id, catMap);
    const isGC = inGC(item, catMap);
    const isCYC = inCYC(item, catMap);
    const isHW = inCat(item, CAT.HEAVY_WEIGHT.id, catMap);
    const isPrem = inCat(item, CAT.PREMIUM.id, catMap);

    if (!isP && !isB && !isPerf && !isM && !isGC && !isCYC && !isKids) {
      return { ...item, product_price: item.regular_price };
    }

    let en3 = 0, en2 = 0, p3 = 0, p2 = 0;

    if (isKids) {
      en3 = Math.min(item.quantity, uKids3); uKids3 -= en3;
      en2 = Math.min(item.quantity - en3, uKids2); uKids2 -= en2;
      p3 = 130; p2 = 80;
    } else if (isP) {
      en3 = Math.min(item.quantity, uP3); uP3 -= en3;
      en2 = Math.min(item.quantity - en3, uP2); uP2 -= en2;
      p3 = 56.66666667; p2 = 59;
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
    } else if (isGC) {
      en2 = Math.min(item.quantity, uGC2); uGC2 -= en2;
      p2 = 65;
    } else if (isCYC) {
      en3 = Math.min(item.quantity, uCYC3); uCYC3 -= en3;
      p3 = 33;
    }

    const rest = item.quantity - en3 - en2;
    let nPrice = ((en3 * p3) + (en2 * p2) + (rest * item.regular_price)) / item.quantity;

    if (isP && (en3 > 0 || en2 > 0)) {
      if (isHW) nPrice += 5;
      if (isPrem) nPrice += 10;
    }

    return { ...item, product_price: parseFloat(nPrice.toFixed(2)) };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// CROSS SELL
// ════════════════════════════════════════════════════════════════════════════

/**
 * CROSS SELL: Lanyard a precio fijo S/15.
 * Condición: subtotal > S/100 y nivel 1, 2 o 3 (nivel 4 no aplica).
 * Solo modifica el product_price de los items que pertenezcan a la categoría
 * LANYARD — no agrega ni elimina items del carrito.
 * Para desactivar: comentar la llamada en el bloque MIN del servidor principal.
 */
function calcCrossSellLanyard(
  items: CartItemWithCategory[],
  catMap: Map<number, number[]>,
  subtotal: number,
  levelKey: string
): CartItemWithCategory[] {
  const LANYARD_FIXED_PRICE = 15;
  const LANYARD_MIN_SUBTOTAL = 100;

  if (levelKey === "LEVEL_4" || subtotal <= LANYARD_MIN_SUBTOTAL) {
    return items;
  }

  return items.map((item) =>
    inCat(item, CAT.LANYARD.id, catMap)
      ? { ...item, product_price: LANYARD_FIXED_PRICE }
      : item
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DESCUENTOS ADICIONALES MIN — cada función es independiente y comentable
// ════════════════════════════════════════════════════════════════════════════

/**
 * DESCUENTO 1: Recargo por pago con MercadoPago (+5% sobre subtotal).
 * Para desactivar: comentar la llamada en el bloque MIN del servidor principal.
 * Retorna un DiscountEntry con discount POSITIVO (es un cargo, no un ahorro).
 */
function calcMercadoPagoSurcharge(
  subtotal: number,
  paymentMethodCode: string | null
): DiscountEntry | null {
  if (paymentMethodCode !== "MERCP") return null;

  const surcharge = parseFloat((subtotal * 0.05).toFixed(2));
  return {
    name: "MERCADO PAGO",
    discount: surcharge,
    percent: 5,
    code: "MERCP_SURCHARGE",
  };
}

/**
 * DESCUENTO 2: Descuento nuevo usuario (−8% sobre subtotal).
 * Aplica solo si el userId NO tiene ninguna orden previa en la tabla orders.
 * Para desactivar: comentar la llamada en el bloque MIN del servidor principal.
 * Retorna un DiscountEntry con discount NEGATIVO (es un ahorro real).
 */
async function calcNewUserDiscount(
  supabase: any,
  userId: string | null,
  subtotal: number
): Promise<DiscountEntry | null> {
  if (!userId) return null;

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) return null;

  const discountAmount = parseFloat((subtotal * 0.08).toFixed(2));
  return {
    name: "NUEVO USUARIO",
    discount: -discountAmount,
    percent: 8,
    code: "NEW_USER_DISCOUNT",
  };
}

// ════════════════════════════════════════════════════════════════════════════
// LÓGICA DE REGALOS
// ════════════════════════════════════════════════════════════════════════════

async function fetchGiftsForItems(
  supabase: any,
  items: CartItemWithCategory[],
  catMap: Map<number, number[]>
): Promise<any[]> {
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
// REGLAS PARA MAYORISTAS (MAY)
// ════════════════════════════════════════════════════════════════════════════

function applyPriceRulesMAY(
  items: CartItemWithCategory[],
  catMap: Map<number, number[]>
): CartItemWithCategory[] {

  const totalPolos = items
    .filter((i) => inCat(i, CAT.POLOS.id, catMap))
    .reduce((sum, i) => sum + i.quantity, 0);
  const totalPoleras = items
    .filter((i) => inCat(i, CAT.POLERAS.id, catMap))
    .reduce((sum, i) => sum + i.quantity, 0);
  const totalPantalones = items
    .filter((i) => inCat(i, CAT.PANTALONES.id, catMap))
    .reduce((sum, i) => sum + i.quantity, 0);

  const descPolos = Math.floor(totalPolos / 12) * 1.5;
  const descPoleras = Math.floor(totalPoleras / 12) * 5.0;
  const descPantalones = Math.floor(totalPantalones / 12) * 5.0;

  return items.map((item) => {
    let descuento = 0;

    if (inCat(item, CAT.POLOS.id, catMap)) descuento = descPolos;
    else if (inCat(item, CAT.POLERAS.id, catMap)) descuento = descPoleras;
    else if (inCat(item, CAT.PANTALONES.id, catMap)) descuento = descPantalones;
    else return { ...item, product_price: item.regular_price };

    if (descuento <= 0) return { ...item, product_price: item.regular_price };

    return {
      ...item,
      product_price: parseFloat(Math.max(0, item.regular_price - descuento).toFixed(2)),
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { items, userId, priceListId, paymentMethodCode } = await req.json();

    const [priceListCode, itemsWithCategory, catMap] = await Promise.all([
      getPriceListCode(supabase, priceListId),
      verifItemCategory(supabase, items),
      buildCategoryMap(supabase),
    ]);

    let resultItems = [...itemsWithCategory];
    let gifts: any[] = [];
    let discounts: DiscountEntry[] = [];

    if (priceListCode === "MIN") {

      // ── Nivel del cliente ──────────────────────────────────────────────
      const points = userId ? await getCustomerPoints(supabase, userId) : 0;

      let disc = 0;
      let levelKey = "";
      for (const [key, l] of Object.entries(LEVEL_DISCOUNTS)) {
        if (points >= l.min && points <= l.max) { disc = l.discount; levelKey = key; break; }
      }

      // ── Paso 1: packs + recargos HW/PREMIUM ───────────────────────────
      resultItems = applyPriceRulesMIN(resultItems, catMap);

      // ── Paso 2: descuento % de nivel sobre TODO el carrito ─────────────
      if (disc > 0) {
        resultItems = resultItems.map((i) => ({
          ...i,
          product_price: parseFloat((i.product_price * (1 - disc)).toFixed(2)),
        }));
      }

      // ── Subtotal tras packs y nivel (base para descuentos adicionales) ─
      const subtotal = resultItems.reduce(
        (sum, i) => sum + i.product_price * i.quantity,
        0
      );

      // ── Descuentos adicionales (comentar la línea para desactivar) ─────

      // DESCUENTO 1: Recargo MercadoPago (+5%)
      const mpSurcharge = calcMercadoPagoSurcharge(subtotal, paymentMethodCode ?? null);
      if (mpSurcharge) discounts.push(mpSurcharge);

      // DESCUENTO 2: Nuevo usuario (−8%)
      const newUserDisc = await calcNewUserDiscount(supabase, userId ?? null, subtotal);
      if (newUserDisc) discounts.push(newUserDisc);

      // ── Paso 3: regalos ────────────────────────────────────────────────
      gifts = await fetchGiftsForItems(supabase, itemsWithCategory, catMap);

      // ── Paso 4: cross sell Lanyard (precio fijo S/15) ──────────────────
      resultItems = calcCrossSellLanyard(resultItems, catMap, subtotal, levelKey);

    } else if (priceListCode === "MAY") {
      resultItems = applyPriceRulesMAY(resultItems, catMap);
    }

    return new Response(JSON.stringify({ items: resultItems, gifts, discounts }), {
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