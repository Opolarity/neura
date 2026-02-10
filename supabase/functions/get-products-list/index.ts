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
<<<<<<< HEAD
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_ANON_KEY");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT so auth.uid() works inside the RPC
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const url = new URL(req.url);
    const p_page = parseInt(url.searchParams.get("page") || "1");
    const p_size = parseInt(url.searchParams.get("size") || "20");
    const p_search = url.searchParams.get("search") || null;
    const p_category = url.searchParams.get("category")
      ? parseInt(url.searchParams.get("category")!)
      : null;
    const p_status = url.searchParams.get("status") !== null
      ? url.searchParams.get("status") === "true"
      : null;
    const p_web = url.searchParams.get("web") !== null
      ? url.searchParams.get("web") === "true"
      : null;
    const p_minprice = url.searchParams.get("minprice")
      ? parseFloat(url.searchParams.get("minprice")!)
      : null;
    const p_maxprice = url.searchParams.get("maxprice")
      ? parseFloat(url.searchParams.get("maxprice")!)
      : null;
    const p_minstock = url.searchParams.get("minstock")
      ? parseInt(url.searchParams.get("minstock")!)
      : null;
    const p_maxstock = url.searchParams.get("maxstock")
      ? parseInt(url.searchParams.get("maxstock")!)
      : null;
    const p_order = url.searchParams.get("order") || null;

    const { data, error } = await supabase.rpc("get_products_list", {
      p_page,
      p_size,
      p_search,
      p_category,
      p_status,
      p_web,
      p_minprice,
      p_maxprice,
      p_minstock,
      p_maxstock,
      p_order,
    });

    if (error) {
      console.error("RPC Error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-products-list:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
=======
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const url = new URL(req.url);

    const params = {
      p_page: parseInt(url.searchParams.get("page") || "1"),
      p_size: parseInt(url.searchParams.get("size") || "20"),
      p_search: url.searchParams.get("search") || null,
      p_category: url.searchParams.get("category")
        ? parseInt(url.searchParams.get("category")!)
        : null,
      p_status: url.searchParams.get("status") !== null
        ? url.searchParams.get("status") === "true"
        : null,
      p_web: url.searchParams.get("web") !== null
        ? url.searchParams.get("web") === "true"
        : null,
      p_min_price: url.searchParams.get("minprice")
        ? parseFloat(url.searchParams.get("minprice")!)
        : null,
      p_max_price: url.searchParams.get("maxprice")
        ? parseFloat(url.searchParams.get("maxprice")!)
        : null,
      p_minstock: url.searchParams.get("minstock")
        ? parseInt(url.searchParams.get("minstock")!)
        : null,
      p_maxstock: url.searchParams.get("maxstock")
        ? parseInt(url.searchParams.get("maxstock")!)
        : null,
      p_order: url.searchParams.get("order") || null,
    };

    console.log("Calling get_products_list with params:", params);

    const { data, error } = await supabase.rpc("get_products_list", params);

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ productsdata: data }), {
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
>>>>>>> 39dbd4b (get product list)
    );
  }
});
