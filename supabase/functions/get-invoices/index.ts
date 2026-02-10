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
    const order = url.searchParams.get("order") || null;
    const declared = url.searchParams.get("declared") || false;
    const min_mount = Number(url.searchParams.get("min_mount")) || null;
    const max_mount = Number(url.searchParams.get("max_mount")) || null;
    const type = Number(url.searchParams.get("type")) || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
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

    const { data: invoicesData, error: invoicesError } = await supabase.rpc("sp_get_invoices", {
      p_page: page,
      p_size: size,
      p_type: type,
      p_declared: declared,
      p_order: order,
      p_min_mount: min_mount,
      p_max_mount: max_mount,
      p_search: search
    });

    if (invoicesError) throw invoicesError;

    return new Response(JSON.stringify({
      invoicesData 
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching invoices list:", error);
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