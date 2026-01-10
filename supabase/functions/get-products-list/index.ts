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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar el token y obtener el user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = user.id;

    const url = new URL(req.url);
    const getParam = (name: string) => url.searchParams.get(name);
    const getNum = (name: string) => {
      const val = getParam(name);
      return (val !== null && val !== "") ? Number(val) : null;
    };
    const getBool = (name: string) => {
      const val = getParam(name);
      if (val === "true") return true;
      if (val === "false") return false;
      return null;
    };

    const rpcParams = {
      p_min_price: getNum('minprice'),
      p_max_price: getNum('maxprice'),
      p_category: getNum('category'),
      p_status: getBool('status'),
      p_web: getBool('web'),
      p_minstock: getNum('minstock'),
      p_maxstock: getNum('maxstock'),
      p_order: getParam('order'),
      p_search: getParam('search'),
      p_page: getNum('page') ?? 1,
      p_size: getNum('size') ?? 20,
    };

    console.log('Invoking get_products_list with mapped RPC params:', JSON.stringify(rpcParams));

    const { data: productsdata, error: productserror } = await supabase.rpc(
      "get_products_list",
      rpcParams
    );

    if (productserror) throw productserror;

    // Standardize the response structure
    let responseBody: any;

    // Unwrap 'products' key if it exists (SQL function quirk)
    const rawResult = (productsdata && productsdata.products) ? productsdata.products : productsdata;

    if (Array.isArray(rawResult)) {
      // If the RPC returns a raw array, wrap it
      const totalCount = (rawResult.length > 0 && rawResult[0].total_count !== undefined)
        ? Number(rawResult[0].total_count)
        : rawResult.length;

      responseBody = {
        data: rawResult,
        page: {
          page: rpcParams.p_page,
          size: rpcParams.p_size,
          total: totalCount
        }
      };
    } else if (rawResult && typeof rawResult === 'object') {
      // Ensure it has data and page keys
      responseBody = {
        data: rawResult.data ?? [],
        page: rawResult.page ?? {
          page: rpcParams.p_page,
          size: rpcParams.p_size,
          total: rawResult.total ?? (rawResult.data?.length || 0)
        }
      };
    } else {
      // Fallback
      responseBody = {
        data: [],
        page: {
          page: rpcParams.p_page,
          size: rpcParams.p_size,
          total: 0
        }
      };
    }

    console.log(`Returning ${responseBody.data.length} products. Total: ${responseBody.page.total}`);

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching products list:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
