import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItem {
  variationId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  [key: string]: unknown;
}

function applyPriceRules(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    let newPrice = item.originalPrice; // siempre partir del precio original

    // --- REGLA 1: Ejemplo placeholder ---
    // if (item.variationId === 42 && item.quantity >= 3) {
    //   newPrice = item.originalPrice * 0.9; // 10% descuento
    // }

    // --- REGLA 2: Ejemplo por total de items en carrito ---
    // const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    // if (totalUnits >= 10) {
    //   newPrice = item.originalPrice * 0.95; // 5% descuento general
    // }

    return { ...item, price: newPrice };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const { items } = await req.json() as { items: CartItem[] };

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "items array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apply rules
    const result = applyPriceRules(items);

    return new Response(
      JSON.stringify({ items: result }),
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
