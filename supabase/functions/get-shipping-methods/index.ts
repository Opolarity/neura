import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || null;
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("size")) || 20;
    const min_cost = Number(url.searchParams.get("min_cost")) || null;
    const max_cost = Number(url.searchParams.get("max_cost")) || null;
    const countries = Number(url.searchParams.get("country")) || null;
    const states = Number(url.searchParams.get("state")) || null;
    const cities = Number(url.searchParams.get("city")) || null;
    const neighborhoods = Number(url.searchParams.get("neighborhood")) || null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    console.log("Authorization header:", authHeader);
    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Validar el token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);
    const { data: shippingMethods, error: shippingMethodsError } = await supabase.rpc("sp_get_shipping_methods", {
      p_search: search,
      p_page: page,
      p_size: size,
      p_min_cost: min_cost,
      p_max_cost: max_cost,
      p_countries: countries,
      p_states: states,
      p_cities: cities,
      p_neighborhoods: neighborhoods
    });
    if (shippingMethodsError) throw shippingMethodsError;
    return new Response(JSON.stringify({
      shippingMethods
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching products list:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
