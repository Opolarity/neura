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

    const show = url.searchParams.get("show") || null;
    const order = url.searchParams.get("order") || null;
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("size")) || 20;
    const account_type = Number(url.searchParams.get("account_type")) || null;
    const search = url.searchParams.get("search") || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    console.log("Authorization header:", authHeader);

    // Use Service Role Key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { data: accountsdata, error: accountserror } = await supabase.rpc(
      "sp_get_accounts",
      {
        p_show: show,
        p_account_type: account_type,
        p_order: order,
        p_page: page,
        p_size: size,
        p_search: search
      }
    );

    if (accountserror) throw accountserror;

    return new Response(
      JSON.stringify({ accountsdata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching accounts list:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
