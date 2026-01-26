import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);

    const mintotal = Number(url.searchParams.get("minuser")) || null;
    const maxtotal = Number(url.searchParams.get("maxuser")) || null;
    const start_date = url.searchParams.get("is_admin") || null;
    const end_date = url.searchParams.get("is_admin") || null;
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("size")) || 20;
    const search = url.searchParams.get("search") || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    console.log("Authorization header:", authHeader);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar el token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { data: returnsdata, error: returnsrror } = await supabase.rpc(
      "sp_get_returns",
      {
        p_mintotal: mintotal,
        p_maxtotal: maxtotal,
        p_start_date: start_date,
        p_end_date: end_date,
        p_search: search,
        p_page: page,
        p_size: size,
      }
    );

    if (returnsrror) throw returnsrror;

    return new Response(
      JSON.stringify({ returnsdata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching returns list:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
