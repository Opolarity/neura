import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const url = new URL(req.url);
    const p_page = parseInt(url.searchParams.get("p_page") || "1");
    const p_size = parseInt(url.searchParams.get("p_size") || "10");
    const p_search = url.searchParams.get("p_search") || null;
    const p_stock_type_id = url.searchParams.get("p_stock_type_id") 
      ? parseInt(url.searchParams.get("p_stock_type_id")!) 
      : null;
    const p_warehouse_id = url.searchParams.get("p_warehouse_id") 
      ? parseInt(url.searchParams.get("p_warehouse_id")!) 
      : null;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("sp_get_sale_products", {
      p_page,
      p_size,
      p_search,
      p_stock_type_id,
      p_warehouse_id,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-sale-products:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
