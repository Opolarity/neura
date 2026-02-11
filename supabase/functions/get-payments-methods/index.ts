import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
 
//hola
Deno.serve(async (req) => {
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
 
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");
 
    if (!authHeader) {
      throw new Error("No authorization header");
    }
 
    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing environment variables");
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
 
    const { data: paymentsMethodsData, error: paymentsMethodsError } = await supabase.rpc("sp_get_payments_methods", {
      p_page: page,
      p_size: size,
      p_search: search
    });
 
    if (paymentsMethodsError) throw paymentsMethodsError;
 
    return new Response(JSON.stringify({
      paymentsMethodsData
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching payments methods list:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});