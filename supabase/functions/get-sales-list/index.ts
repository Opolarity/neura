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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user from auth header to extract branch_id and warehouse_id
    const authHeader = req.headers.get("authorization") || "";
    let userBranchId: number | null = null;
    let userWarehouseId: number | null = null;

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || supabaseServiceRoleKey);
      const { data: { user } } = await supabaseAuth.auth.getUser(token);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("branch_id, warehouse_id")
          .eq("UID", user.id)
          .single();

        if (profile) {
          userBranchId = profile.branch_id || null;
          userWarehouseId = profile.warehouse_id || null;
        }
      }
    }

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
      p_branch_id: userBranchId,
      p_warehouse_id: userWarehouseId,
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
