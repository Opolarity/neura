import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────────────────────
// NIVELES
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = {
  LEVEL_1: { min: 150, max: 749.99, discount: 0.05, label: "Nivel 1 (5%)" },
  LEVEL_2: { min: 750, max: 1499, discount: 0.10, label: "Nivel 2 (10%)" },
  LEVEL_3: { min: 1500, max: 2999, discount: 0.15, label: "Nivel 3 (15%)" },
  LEVEL_4: { min: 3000, max: Infinity, discount: 0.30, label: "Nivel 4 (30%)" },
} as const;

type LevelKey = keyof typeof LEVELS;

function resolveLevel(points: number): { key: LevelKey; discount: number; label: string } | null {
  for (const [key, lvl] of Object.entries(LEVELS) as [LevelKey, typeof LEVELS[LevelKey]][]) {
    if (points >= lvl.min && points <= lvl.max) {
      return { key, discount: lvl.discount, label: lvl.label };
    }
  }
  return null;
}

async function getCustomerPoints(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      accounts (
        customer_profile ( points )
      )
    `)
    .eq("UID", userId)
    .maybeSingle();

  if (error || !data) return 0;

  const accounts = data.accounts as any;
  const accountsObj = Array.isArray(accounts) ? accounts[0] : accounts;
  const customerProfile = accountsObj?.customer_profile;
  const cp = Array.isArray(customerProfile) ? customerProfile[0] : customerProfile;
  return cp?.points ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json() as { userId?: string; items?: any[] };

    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "items array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Obtener puntos del usuario
    const points = await getCustomerPoints(supabase, body.userId);

    // 2. Resolver nivel
    const level = resolveLevel(points);

    // 3. Sin nivel → devolver items sin modificar
    if (!level) {
      return new Response(
        JSON.stringify({
          success: true,
          points,
          level: null,
          levelLabel: null,
          levelDiscount: null,
          items: body.items, // sin cambios
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Aplicar descuento en memoria — sin tocar la BD
    const adjustedItems = body.items.map((item: any) => ({
      ...item,
      price: parseFloat(((item.price ?? 0) * (1 - level.discount)).toFixed(2)),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        points,
        level: level.key,
        levelLabel: level.label,
        levelDiscount: `${level.discount * 100}%`,
        items: adjustedItems,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in apply-price-rules-level:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});