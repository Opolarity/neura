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
    const type = Number(url.searchParams.get("type")) || null;
    const classe = Number(url.searchParams.get("class")) || null;
    const bussines_account = Number(url.searchParams.get("bussines_account")) || null;
    const payment_method = Number(url.searchParams.get("payment_method")) || null;
    const start_date = url.searchParams.get("start_date") || null;
    const end_date = url.searchParams.get("end_date") || null;
    const branches = url.searchParams.get("branches") || null;
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
    const { data: movements, error: movementsError } = await supabase.rpc("sp_get_movements", {
      p_search: search,
      p_page: page,
      p_size: size,
      p_type: type,
      p_class: classe,
      p_bussines_account: bussines_account,
      p_start_date: start_date,
      p_end_date: end_date,
      p_payment_method: payment_method,
      p_branches: branches
    });
    if (movementsError) throw movementsError;
    return new Response(JSON.stringify({
      movements
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
