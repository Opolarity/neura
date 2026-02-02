import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const url = new URL(req.url);
    
    const params = {
      p_page: parseInt(url.searchParams.get("page") || "1"),
      p_size: parseInt(url.searchParams.get("size") || "20"),
      p_search: url.searchParams.get("search") || null,
      p_status: url.searchParams.get("status") || null,
      p_sale_type: url.searchParams.get("sale_type")
        ? parseInt(url.searchParams.get("sale_type")!)
        : null,
      p_start_date: url.searchParams.get("start_date") || null,
      p_end_date: url.searchParams.get("end_date") || null,
      p_order: url.searchParams.get("order") || "date_desc",
    };

    console.log("Calling sp_get_sales_list with params:", params);

    const { data, error } = await supabase.rpc("sp_get_sales_list", params);

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    console.log("RPC Response received, data count:", data?.data?.length || 0);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
