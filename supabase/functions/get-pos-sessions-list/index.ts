import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const url = new URL(req.url);
    const p_page = parseInt(url.searchParams.get("page") || "1");
    const p_size = parseInt(url.searchParams.get("size") || "20");
    const p_search = url.searchParams.get("search") || null;
    const p_status_id = url.searchParams.get("status_id")
      ? parseInt(url.searchParams.get("status_id")!)
      : null;
    const p_date_from = url.searchParams.get("date_from") || null;
    const p_date_to = url.searchParams.get("date_to") || null;
    const p_difference_type = url.searchParams.get("difference_type") || null;
    const p_sales_min = url.searchParams.get("sales_min")
      ? parseFloat(url.searchParams.get("sales_min")!)
      : null;
    const p_sales_max = url.searchParams.get("sales_max")
      ? parseFloat(url.searchParams.get("sales_max")!)
      : null;
    const p_order_by = url.searchParams.get("order_by") || "date-desc";

    const { data, error } = await supabase.rpc("get_pos_sessions_list", {
      p_page,
      p_size,
      p_search,
      p_status_id,
      p_date_from,
      p_date_to,
      p_difference_type,
      p_sales_min,
      p_sales_max,
      p_order_by,
    });

    if (error) {
      console.error("RPC Error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ sessions_data: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-pos-sessions-list:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
