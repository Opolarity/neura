import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-channel-code",
};

// --- CONFIGURACIÓN DE NIVELES ---
const LEVEL_DISCOUNTS = {
  LEVEL_1: { min: 150, max: 749.99, discount: 0.05, pack3Amount: 5, label: "Nivel 1 (5%)" },
  LEVEL_2: { min: 750, max: 1499, discount: 0.10, pack3Amount: 10, label: "Nivel 2 (10%)" },
  LEVEL_3: { min: 1500, max: 2999, discount: 0.15, pack3Amount: 15, label: "Nivel 3 (15%)" },
  LEVEL_4: { min: 3000, max: Infinity, discount: 0.30, pack3Amount: 30, label: "Nivel 4 (30%)" },
} as const;

// --- CATEGORÍAS ---
const CAT = {
  POLOS: { id: 48, label: "Polos" },
  PERFUMES: { id: 50, label: "Perfumes" },
  BOXERS: { id: 40, label: "Boxers" },
  MEDIAS: { id: 32, label: "Medias" },
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

interface AppliedRule {
  type: "pack" | "level" | "gift";
  label: string;         // mensaje legible para el frontend
  detail?: string;       // detalle adicional opcional
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
    categoryIds: productToCategories.get(variationToProduct.get(item.variationId) as number) ?? [],
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// REGLAS PARA MINORISTAS (MIN)
// ════════════════════════════════════════════════════════════════════════════

function applyPriceRulesMIN(
  items: CartItemWithCategory[],
  levelKey: keyof typeof LEVEL_DISCOUNTS | null
): { items: CartItemWithCategory[]; appliedRules: AppliedRule[] } {

  const currentLevel = levelKey ? LEVEL_DISCOUNTS[levelKey] : null;
  const appliedRules: AppliedRule[] = [];

  // Totales por categoría
  let tP = 0, tB = 0, tPerf = 0, tM = 0;
  items.forEach(i => {
    if (i.categoryIds.includes(CAT.POLOS.id)) tP += i.quantity;
    else if (i.categoryIds.includes(CAT.BOXERS.id)) tB += i.quantity;
    else if (i.categoryIds.includes(CAT.PERFUMES.id)) tPerf += i.quantity;
    else if (i.categoryIds.includes(CAT.MEDIAS.id)) tM += i.quantity;
  });

  // Registrar reglas de pack aplicadas
  if (Math.floor(tP / 3) > 0) appliedRules.push({ type: "pack", label: "Pack x3 Polos", detail: `${Math.floor(tP / 3) * 3} unidades a S/ 56.67 c/u` });
  if (Math.floor((tP % 3) / 2) > 0) appliedRules.push({ type: "pack", label: "Pack x2 Polos", detail: `${Math.floor((tP % 3) / 2) * 2} unidades a S/ 59 c/u` });
  if (Math.floor(tB / 3) > 0) appliedRules.push({ type: "pack", label: "Pack x3 Boxers", detail: `${Math.floor(tB / 3) * 3} unidades a S/ 26.33 c/u` });
  if (Math.floor((tB % 3) / 2) > 0) appliedRules.push({ type: "pack", label: "Pack x2 Boxers", detail: `${Math.floor((tB % 3) / 2) * 2} unidades a S/ 30 c/u` });
  if (Math.floor(tPerf / 2) > 0) appliedRules.push({ type: "pack", label: "Pack x2 Perfumes", detail: `${Math.floor(tPerf / 2) * 2} unidades a S/ 49.50 c/u` });
  if (Math.floor(tM / 3) > 0) appliedRules.push({ type: "pack", label: "Pack x3 Medias", detail: `${Math.floor(tM / 3) * 3} unidades a S/ 20 c/u` });
  if (Math.floor((tM % 3) / 2) > 0) appliedRules.push({ type: "pack", label: "Pack x2 Medias", detail: `${Math.floor((tM % 3) / 2) * 2} unidades a S/ 25 c/u` });

  // Registrar descuento de nivel
  if (currentLevel) {
    appliedRules.push({
      type: "level",
      label: `Descuento ${currentLevel.label}`,
      detail: `${(currentLevel.discount * 100).toFixed(0)}% en unidades sueltas / S/ ${currentLevel.pack3Amount} menos en pack x3`,
    });
  }

  // Contadores mutables de unidades en pack
  let uP3 = Math.floor(tP / 3) * 3;
  let uP2 = Math.floor((tP % 3) / 2) * 2;
  let uB3 = Math.floor(tB / 3) * 3;
  let uB2 = Math.floor((tB % 3) / 2) * 2;
  let uPerf2 = Math.floor(tPerf / 2) * 2;
  let uM3 = Math.floor(tM / 3) * 3;
  let uM2 = Math.floor((tM % 3) / 2) * 2;

  const resultItems = items.map((item) => {
    const isP = item.categoryIds.includes(CAT.POLOS.id);
    const isB = item.categoryIds.includes(CAT.BOXERS.id);
    const isPerf = item.categoryIds.includes(CAT.PERFUMES.id);
    const isM = item.categoryIds.includes(CAT.MEDIAS.id);

    if (!isP && !isB && !isPerf && !isM) {
      return { ...item, product_price: item.regular_price };
    }

    let en3 = 0, en2 = 0;
    let p3Base = 0, p2Base = 0;

    if (isP) {
      en3 = Math.min(item.quantity, uP3); uP3 -= en3;
      en2 = Math.min(item.quantity - en3, uP2); uP2 -= en2;
      p3Base = 56.666; p2Base = 59;
    } else if (isB) {
      en3 = Math.min(item.quantity, uB3); uB3 -= en3;
      en2 = Math.min(item.quantity - en3, uB2); uB2 -= en2;
      p3Base = 26.33; p2Base = 30;
    } else if (isPerf) {
      en2 = Math.min(item.quantity, uPerf2); uPerf2 -= en2;
      p2Base = 49.5;
    } else if (isM) {
      en3 = Math.min(item.quantity, uM3); uM3 -= en3;
      en2 = Math.min(item.quantity - en3, uM2); uM2 -= en2;
      p3Base = 20; p2Base = 25;
    }

    const rest = item.quantity - en3 - en2;

    let priceFinal3 = p3Base;
    let priceFinal2 = p2Base;
    let priceFinalUnit = item.regular_price;

    if (currentLevel) {
      priceFinal3 = p3Base - (currentLevel.pack3Amount / 3);
      priceFinal2 = p2Base;
      priceFinalUnit = item.regular_price * (1 - currentLevel.discount);
    }

    const nPrice = ((en3 * priceFinal3) + (en2 * priceFinal2) + (rest * priceFinalUnit)) / item.quantity;

    return { ...item, product_price: parseFloat(nPrice.toFixed(2)) };
  });

  return { items: resultItems, appliedRules };
}

// ════════════════════════════════════════════════════════════════════════════
// LÓGICA DE REGALOS
// ════════════════════════════════════════════════════════════════════════════

async function fetchGiftsForItems(supabase: any, items: CartItemWithCategory[]): Promise<any[]> {
  const giftIds: number[] = [];
  const totalPolos = items
    .filter(i => i.categoryIds.includes(CAT.POLOS.id))
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { items, userId, priceListId } = await req.json();

    const priceListCode = await getPriceListCode(supabase, priceListId);
    const itemsWithCategory = await verifItemCategory(supabase, items);

    let resultItems: CartItemWithCategory[] = [...itemsWithCategory];
    let gifts: any[] = [];
    let appliedRules: AppliedRule[] = [];

    if (priceListCode === "MIN") {

      // 1. Nivel del cliente
      const points = userId ? await getCustomerPoints(supabase, userId) : 0;
      let levelKey: keyof typeof LEVEL_DISCOUNTS | null = null;
      for (const [key, l] of Object.entries(LEVEL_DISCOUNTS)) {
        if (points >= l.min && points <= l.max) {
          levelKey = key as keyof typeof LEVEL_DISCOUNTS;
          break;
        }
      }

      // 2. Aplicar packs + nivel → devuelve items Y reglas aplicadas
      const result = applyPriceRulesMIN(resultItems, levelKey);
      resultItems = result.items;
      appliedRules = result.appliedRules;

      // 3. Regalos
      gifts = await fetchGiftsForItems(supabase, itemsWithCategory);

      // 4. Agregar regla de regalo si aplica
      if (gifts.length > 0) {
        appliedRules.push({
          type: "gift",
          label: "¡Regalo incluido!",
          detail: gifts.map(g => g.product_name).join(", "),
        });
      }

    } else if (priceListCode === "MAY") {
      console.log("Aplicando lógica MAY...");
    }

    return new Response(JSON.stringify({ items: resultItems, gifts, appliedRules }), {
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